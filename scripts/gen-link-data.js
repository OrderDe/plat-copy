#!/usr/bin/env node
/**
 * 从 App 端 pages.json 生成装修「选择链接」的页面清单
 *
 * 背景：链接选择器的可选项一直是手写死在 components/linkaddress/linkData.json 里的
 * 31 条，而 App 实际有 140 个页面——缺的那 100 多个在装修里根本选不到。
 * 这和审批中心「选择接入位置」是同一类问题，区别在数据源：
 * 审批扫的是后端 Controller（RequestMappingHandlerMapping），装修要的是 App 页面路由，
 * 后端接口列表对它没用，正确的来源就是 pages.json。
 *
 * 合并策略：以 pages.json 为全集，已有条目按 url 匹配后原样保留
 * （name / type / sort 都不动），只追加缺失的页面。这样跑几次都不会动到现有配置。
 *
 * 用法：
 *   node scripts/gen-link-data.js              # 预览将要新增哪些
 *   node scripts/gen-link-data.js --write      # 真正写入 linkData.json
 *   node scripts/gen-link-data.js --app=D:/path/TJ-UniAPP --write
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function argOf(name, def) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}

const APP_DIR = argOf('app', path.resolve(ROOT, '../TJ-UniAPP'));
const PAGES_JSON = path.join(APP_DIR, 'pages.json');
const LINK_DATA = path.join(ROOT, 'src/components/linkaddress/linkData.json');
const WRITE = process.argv.includes('--write');

/**
 * linkaddress 按 type 分组渲染（见 components/linkaddress/index.vue）：
 *   1 基础链接   2 分销   3 个人中心   4 积分   8 拼团   其它 优惠券
 * 新页面按路径归类，归不上的一律进「基础链接」。
 */
const TYPE_BASIC = 1;
const TYPE_DISTRIBUTION = 2;
const TYPE_USER = 3;

/** 分销相关页面的路径特征 */
const DISTRIBUTION_HINT = /promoter|commission|spread|distribution|poster|extension/i;

/**
 * 不适合作为跳转目标的页面：支付/授权回调、纯中转页。
 * 选了它们只会跳到一个报错页，列出来反而是干扰。
 */
const SKIP = [
  /alipay_(return|invoke)/i,
  /order_pay_status/i,
  /\/auth\//i,
  /systemIframe/i,
  /^pages\/admin\//i, // 管理端页面，商城用户进不去

  /*
   * 详情类页面必须带 id 才能打开（goods_details?id=xxx），
   * 这个选择器选出来的 url 是不带参数的，选了跳过去只会是一个报错页。
   * 要链到具体商品/文章，左侧有「商品」「文章」分类，那里走接口选具体那一条、
   * 回传的 url 才带 id。所以详情页不该出现在「商城链接」里，出现即误导。
   */
  /_details?(\/|$)/i,
  /_con(\/|$)/i,
  /small_page/i, // 微页面，左侧有独立分类按 id 选
  /goods_comment_con/i,

  // 老版发票页：order_details 里跳它的代码已经注释掉了，在用的是 pages/order_invoice/*
  /^pages\/invoice\//i,
];

/** pages.json 带注释，标准 JSON.parse 解析不了 */
function readJsonWithComments(file) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/([^:])\/\/.*$/gm, '$1');
  return JSON.parse(s);
}

function collectPages(pagesJson) {
  const out = [];
  const push = (rootPath, p) => {
    if (!p || !p.path) return;
    const full = rootPath ? `${rootPath}/${p.path}` : p.path;
    const title = (p.style && p.style.navigationBarTitleText) || '';
    out.push({ path: full, title });
  };
  (pagesJson.pages || []).forEach((p) => push('', p));
  (pagesJson.subPackages || []).forEach((sp) => {
    (sp.pages || []).forEach((p) => push(sp.root, p));
  });
  return out;
}

function typeOf(pagePath) {
  if (DISTRIBUTION_HINT.test(pagePath)) return TYPE_DISTRIBUTION;
  if (/^pages\/users?\//i.test(pagePath) || /^pages\/user\//i.test(pagePath)) return TYPE_USER;
  return TYPE_BASIC;
}

/**
 * 人工命名表：pages.json 里的 navigationBarTitleText 是给 App 顶部导航用的，
 * 直接拿来当装修选项名对运营很不友好——大量重名（两个「商品搜索」、两个「秒杀列表」），
 * 还有几个压根没中文标题。这里按业务含义重命名，并补一句用途说明。
 *
 * desc 会在选择器里以气泡提示显示，让不熟悉业务的人也能选对。
 * 没列进来的页面沿用 pages.json 标题。
 */
const ALIAS = {
  'pages/discover_index/index': { name: '逛逛', desc: '内容社区首页，短视频和笔记的入口' },

  // 搜索/商品列表这几个页面长得像，用途差别大，名字必须能区分开
  'pages/goods/goods_list/index': {
    name: '商品列表页',
    desc: '按分类或推荐展示商品，走搜索引擎接口（searchDynamic）。想让用户点进来看一批商品，选这个',
  },
  'pages/goods/goods_list/searchlist': {
    name: '商品搜索结果页',
    desc: '带搜索框的结果页，用户可以在页面里改关键词重新搜',
  },
  'pages/goods/coupon_goods_list/index': {
    name: '优惠券可用商品',
    desc: '某张优惠券能用的商品范围，需要配合优惠券使用',
  },
  'pages/goods/goods_search/index': { name: '商品搜索页', desc: '只有搜索框的页面，用户自己输关键词' },

  'pages/goods/order_logistics/index': { name: '物流跟踪', desc: '看快递到哪了，需要订单号' },
  'pages/goods/send_record/index': { name: '发货记录', desc: '一个订单分多次发货时的发货批次列表' },
  'pages/goods/agreement_info/index': { name: '协议详情', desc: '用户协议、隐私政策这类条款页' },
  'pages/goods/browsing_history/index': { name: '我的足迹', desc: '用户最近浏览过的商品' },

  'pages/activity/goods_seckill/index': { name: '限时秒杀专区', desc: '平台的秒杀活动会场' },
  'pages/activity/mer-good-seckill/index': { name: '店铺秒杀', desc: '某个商户自己的秒杀，需要指定商户' },
  'pages/activity/goods_group/index': { name: '拼团专区', desc: '所有拼团商品的会场' },
  'pages/activity/status/index': { name: '我的拼团', desc: '用户查看自己参与的拼团进度' },
  'pages/activity/liveBroadcast/index': { name: '直播列表', desc: '正在直播和预告的列表' },
  'pages/activity/points_mall/index': { name: '积分商城', desc: '用积分兑换商品' },

  'pages/discover/discover_video/routineVideo/index': { name: '逛逛短视频（小程序）', desc: '小程序端的短视频播放页' },
  'pages/discover/discover_video/appVideo/index': { name: '逛逛短视频（App）', desc: 'App 端的短视频播放页' },
  'pages/discover/discover_follow/index': { name: '逛逛-我的关注', desc: '用户在逛逛里关注的人的内容' },
  'pages/discover/discover_note_topic/index': { name: '逛逛-话题', desc: '话题聚合页' },
  'pages/discover/discover_release/index': { name: '逛逛-发布内容', desc: '用户发笔记/视频的编辑页' },
  'pages/discover/discover_user/index': { name: '逛逛-个人主页', desc: '某个用户在逛逛里的主页' },

  'pages/users/web_page/index': { name: '外部网页', desc: '在 App 里打开一个外部链接，需要填网址' },
  'pages/users/user_spread_money/index': { name: '佣金明细', desc: '分销佣金的收支流水' },
  'pages/users/user_sgin/index': { name: '每日签到', desc: '签到领积分的页面' },
  'pages/users/couponList/index': { name: '我的卡券包', desc: '用户已领取的优惠券。注意和「领券中心」（去领新券）不是同一个页面' },
  'pages/users/login/index': { name: '登录页', desc: '一般不用配，未登录时系统会自动跳' },
  'pages/users/user_info/index': { name: '个人资料', desc: '改昵称、头像的页面' },
};

/** 没有标题的页面用路径末段兜底，总比显示空白强 */
function nameOf(page) {
  if (page.title) return page.title;
  const seg = page.path.split('/').filter(Boolean);
  const last = seg[seg.length - 1] === 'index' ? seg[seg.length - 2] : seg[seg.length - 1];
  return last || page.path;
}

function main() {
  if (!fs.existsSync(PAGES_JSON)) {
    console.error(`找不到 pages.json：${PAGES_JSON}\n用 --app= 指定 TJ-UniAPP 目录。`);
    process.exit(2);
  }
  const linkData = JSON.parse(fs.readFileSync(LINK_DATA, 'utf8'));
  const existing = linkData.data.list;
  const byUrl = new Map();
  existing.forEach((e) => byUrl.set(String(e.url).trim(), e));

  const pages = collectPages(readJsonWithComments(PAGES_JSON));
  const skipped = [];
  const added = [];
  const renamed = [];
  let maxId = existing.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0);

  pages.forEach((p) => {
    const url = `/${p.path}`;
    if (SKIP.some((re) => re.test(p.path))) {
      skipped.push(url);
      return;
    }
    const alias = ALIAS[p.path];
    if (byUrl.has(url)) {
      /*
       * 已有条目默认原样保留。唯一的例外是 ALIAS 里显式写了的——那是人工确认过
       * 「这个名字对运营不好懂」才加进去的，不覆盖就白写了。
       * 最典型的就是「分类商品列表」：它是老条目，名字看不出它其实是商品列表页。
       */
      if (alias) {
        const cur = byUrl.get(url);
        if (cur.name !== alias.name || cur.desc !== alias.desc) {
          renamed.push(`${cur.name} → ${alias.name}`);
          cur.name = alias.name;
          cur.desc = alias.desc || '';
        }
      }
      return;
    }

    maxId += 1;
    added.push({
      id: maxId,
      cate_id: 5,
      type: typeOf(p.path),
      name: (alias && alias.name) || nameOf(p),
      desc: (alias && alias.desc) || '',
      _path: p.path, // 仅用于去重时补路径，写文件前删掉
      url,
      param: ' ',
      example: url,
      status: 1,
      sort: 0,
      add_time: Math.floor(Date.now() / 1000),
    });
  });

  /*
   * 同名消歧：pages.json 里有多个页面共用一个标题（两个「开票中」、两个「订单详情」…），
   * 平铺在选择器里根本分不清点哪个，补上所属目录。
   * 已有的 31 条不参与改名，只处理新增的。
   */
  const nameCount = {};
  existing.concat(added).forEach((e) => {
    nameCount[e.name] = (nameCount[e.name] || 0) + 1;
  });
  added.forEach((a) => {
    if (nameCount[a.name] > 1) {
      const seg = a._path.split('/').filter(Boolean);
      const dir = seg[seg.length - 1] === 'index' ? seg[seg.length - 2] : seg[seg.length - 1];
      if (dir) a.name = `${a.name}（${dir}）`;
    }
    delete a._path;
  });

  console.log(`App 页面      ${pages.length} 个   ${PAGES_JSON}`);
  console.log(`已有链接      ${existing.length} 条`);
  console.log(`跳过（回调/管理端） ${skipped.length} 个`);
  console.log(`可新增        ${added.length} 条`);
  if (renamed.length) {
    console.log(`
  [按别名表改名] ${renamed.length} 条`);
    renamed.forEach((r) => console.log('    ' + r));
  }

  if (added.length) {
    const group = { 1: '基础链接', 2: '分销', 3: '个人中心' };
    const byType = {};
    added.forEach((a) => {
      (byType[a.type] = byType[a.type] || []).push(a.name);
    });
    Object.entries(byType).forEach(([t, names]) => {
      console.log(`\n  [${group[t] || t}] ${names.length} 条`);
      console.log('    ' + names.join('、'));
    });
  }

  if (!WRITE) {
    console.log('\n预览模式，未写入。加 --write 真正写入。');
    return;
  }
  if (!added.length) {
    console.log('\n没有需要新增的，未改动文件。');
    return;
  }
  linkData.data.list = existing.concat(added);
  fs.writeFileSync(LINK_DATA, JSON.stringify(linkData, null, 2) + '\n', 'utf8');
  console.log(`\n已写入 ${LINK_DATA}，现在共 ${linkData.data.list.length} 条。`);
}

main();
