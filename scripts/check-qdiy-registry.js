#!/usr/bin/env node
/**
 * 装修组件三处注册一致性校验
 *
 * 一个装修组件要在三个互不相干的地方登记，谁都不检查谁，漏一处的后果还各不相同
 * 而且全是静默的：
 *
 *   1. `eb_qdiy_component` 注册表（后端 sql/）—— 漏了：组件库里拖不出来
 *   2. 平台端 `editor/widgets/<code>/preview.vue` —— 漏了：编辑器画布显示灰色占位块
 *   3. App 端 `components/qdiy/index.vue` 的 identify 映射 —— 漏了：App 上静默不渲染
 *
 * 典型事故：`title`（猜你喜欢/为你推荐用的标题组件）App 端早就实现了，
 * 注册表和平台端两处都没补，运营在编辑器里看到的是个改不动的灰框。
 *
 * 用法：
 *   node scripts/check-qdiy-registry.js
 *   node scripts/check-qdiy-registry.js --sql-dir=D:/code/1/tjMall/sql --app=D:/code/xx/TJ-UniAPP
 *
 * 退出码 0 = 一致，1 = 存在差异，2 = 路径找不到（无法校验）。
 */

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/* 路径解析                                                             */
/* ------------------------------------------------------------------ */

const ROOT = path.resolve(__dirname, '..');

function argOf(name, def) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}

// 默认按仓库并列摆放的布局推断，可用参数覆盖
const PATHS = {
  widgets: path.join(ROOT, 'src/views/qdiy/editor/widgets'),
  sqlDir: argOf('sql-dir', path.resolve(ROOT, '../../1/tjMall/sql')),
  appIndex: path.join(argOf('app', path.resolve(ROOT, '../TJ-UniAPP')), 'components/qdiy/index.vue'),
};

/**
 * 不需要 App 端渲染的 code。
 * page-body 是「页面主体位置」占位标记，App 端靠它把组件切成 top/bottom 两段，
 * 占位符本身不渲染任何东西，没有对应分支是正确的。
 */
const APP_EXEMPT = new Set(['page-body']);

/* ------------------------------------------------------------------ */
/* 三个来源的解析                                                       */
/* ------------------------------------------------------------------ */

/**
 * 解析注册表。
 *
 * 只认 `INSERT INTO eb_qdiy_component (...)` 这一张表，不能简单全文正则：
 * 同一个 sql 文件里还有 `eb_qdiy_component_config`（组件属性默认值），
 * 它的第一列是组件 code 但第二列才是属性名，混进来会把属性当组件。
 *
 * 两种写法都要支持：
 *   INSERT INTO `eb_qdiy_component` (...) VALUES ('nav', '顶部导航', ...), (...);
 *   INSERT INTO `eb_qdiy_component` (...) SELECT 'title', '标题', ... WHERE NOT EXISTS (...);
 */
function readRegistry(sqlDir) {
  const codes = new Map(); // code -> { file, group }
  if (!fs.existsSync(sqlDir)) return null;

  fs.readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .forEach((file) => {
      const text = fs.readFileSync(path.join(sqlDir, file), 'utf8');
      const stmt = /INSERT\s+INTO\s+`?eb_qdiy_component`?\s*\(/gi;
      let m;
      while ((m = stmt.exec(text)) !== null) {
        // 表名后面紧跟 _config 的是另一张表，跳过
        const tail = text.slice(m.index, m.index + 60);
        if (/eb_qdiy_component_/i.test(tail)) continue;

        const end = text.indexOf(';', m.index);
        const body = text.slice(m.index, end === -1 ? text.length : end);

        // 前三列固定是 code / title / group_code，group 用来区分「零散遗漏」和「整组未接入」
        const add = (code, group) => {
          if (!codes.has(code)) codes.set(code, { file, group: group || '' });
        };
        // VALUES 形式：每行以 ('code', '标题', 'group', 开头
        const rowRe = /(?:^|\n)\s*\(\s*'([a-z0-9_-]+)'\s*,\s*'[^']*'\s*,\s*'([a-z0-9_]*)'/gi;
        let r;
        while ((r = rowRe.exec(body)) !== null) add(r[1], r[2]);
        // SELECT 形式
        const selRe = /\bSELECT\s+'([a-z0-9_-]+)'\s*,\s*'[^']*'\s*,\s*'([a-z0-9_]*)'/gi;
        while ((r = selRe.exec(body)) !== null) add(r[1], r[2]);
      }
    });

  return codes;
}

/** 平台端编辑器：widgets/<code>/preview.vue 存在即视为已实现 */
function readEditorWidgets(dir) {
  if (!fs.existsSync(dir)) return null;
  return new Set(
    fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'preview.vue')))
      .map((e) => e.name)
  );
}

/**
 * App 端：识别两种登记方式
 *   const GOODS_GROUP = ['commodity-group', ...]   分组常量
 *   item.identify === 'video'                       单独分支
 */
function readAppMapping(indexFile) {
  if (!fs.existsSync(indexFile)) return null;
  const text = fs.readFileSync(indexFile, 'utf8');
  const codes = new Set();

  const constRe = /const\s+[A-Z_]+\s*=\s*\[([\s\S]*?)\]/g;
  let m;
  while ((m = constRe.exec(text)) !== null) {
    const inner = m[1];
    const strRe = /'([a-z0-9-]+)'/g;
    let s;
    while ((s = strRe.exec(inner)) !== null) codes.add(s[1]);
  }

  const eqRe = /identify\s*===\s*'([a-z0-9-]+)'/g;
  while ((m = eqRe.exec(text)) !== null) codes.add(m[1]);

  return codes;
}

/** 预置装修内容里实际用到的 identify（默认模板配错 code 会让预置页面一上来就是坏的） */
function readSeedIdentifies(sqlDir) {
  const used = new Map(); // code -> 来源文件
  if (!fs.existsSync(sqlDir)) return used;
  fs.readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .forEach((file) => {
      const text = fs.readFileSync(path.join(sqlDir, file), 'utf8');
      const re = /"identify"\s*:\s*"([a-z0-9-]+)"/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        if (!used.has(m[1])) used.set(m[1], file);
      }
    });
  return used;
}

/* ------------------------------------------------------------------ */
/* 报告                                                                 */
/* ------------------------------------------------------------------ */

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

let problems = 0;

/** count=false 只提示不计入退出码，用于已知的整块缺口 */
function section(color, title, items, hint, count = true) {
  if (!items.length) return;
  if (count) problems += items.length;
  const mark = count ? '✗' : '!';
  console.log(`\n${color}${mark} ${title}（${items.length}）${RESET}`);
  console.log(`${DIM}  ${hint}${RESET}`);
  items.forEach((i) => console.log(`    ${i}`));
}

function main() {
  const registry = readRegistry(PATHS.sqlDir);
  const editor = readEditorWidgets(PATHS.widgets);
  const app = readAppMapping(PATHS.appIndex);

  const missing = [];
  if (!registry) missing.push(`注册表 sql 目录：${PATHS.sqlDir}`);
  if (!editor) missing.push(`平台端 widgets：${PATHS.widgets}`);
  if (!app) missing.push(`App 端映射：${PATHS.appIndex}`);
  if (missing.length) {
    console.error(`${RED}无法校验，以下路径不存在：${RESET}`);
    missing.forEach((m) => console.error(`  ${m}`));
    console.error('\n用 --sql-dir= / --app= 指定实际路径。');
    process.exit(2);
  }

  const seed = readSeedIdentifies(PATHS.sqlDir);
  const registryCodes = [...registry.keys()].sort();

  console.log('装修组件注册一致性校验');
  console.log(`${DIM}  注册表      ${registryCodes.length} 个   ${PATHS.sqlDir}${RESET}`);
  console.log(`${DIM}  平台端编辑器 ${editor.size} 个   ${PATHS.widgets}${RESET}`);
  console.log(`${DIM}  App 端      ${app.size} 个   ${PATHS.appIndex}${RESET}`);

  // App 端缺失按分组拆开看：整组都没接是「这个页面还没做装修」，
  // 组里只缺一两个才是真遗漏。两者混在一起报，真问题会被淹掉。
  const appMissing = registryCodes.filter((c) => !app.has(c) && !APP_EXEMPT.has(c));
  const byGroup = new Map();
  registryCodes.forEach((c) => {
    const g = registry.get(c).group || '(未分组)';
    if (!byGroup.has(g)) byGroup.set(g, { total: 0, missing: [] });
    byGroup.get(g).total += 1;
    if (appMissing.includes(c)) byGroup.get(g).missing.push(c);
  });

  const wholeGroupGaps = [];
  const scattered = [];
  byGroup.forEach((info, group) => {
    if (!info.missing.length) return;
    if (info.missing.length === info.total) {
      wholeGroupGaps.push(`${group}  ${DIM}整组 ${info.total} 个全部未接入：${info.missing.join(', ')}${RESET}`);
    } else {
      info.missing.forEach((c) =>
        scattered.push(`${c}  ${DIM}（${group} 组其余 ${info.total - info.missing.length} 个已接入）${RESET}`),
      );
    }
  });

  section(
    RED,
    '注册表里有，App 端不渲染',
    scattered,
    '后果：运营能拖出来、编辑器里也正常，但 App 上静默消失',
  );

  section(
    YELLOW,
    'App 端整组未接入',
    wholeGroupGaps,
    '整个页面的装修还没接，属于功能缺口而非遗漏；接入前别把这些组件放进预置模板',
    false,
  );

  section(
    RED,
    '注册表里有，平台端编辑器没实现',
    registryCodes.filter((c) => !editor.has(c)),
    '后果：画布显示灰色占位块「该组件尚未迁移」，配置改不了',
  );

  section(
    YELLOW,
    '已实现但没登记进注册表',
    [...new Set([...editor, ...app])].filter((c) => !registry.has(c) && !APP_EXEMPT.has(c)).sort(),
    '后果：组件库里拖不出来，只有历史数据里已有的才能渲染',
  );

  const seedBroken = [...seed.entries()]
    .filter(([code]) => !APP_EXEMPT.has(code) && (!registry.has(code) || !editor.has(code) || !app.has(code)))
    .map(([code, file]) => {
      const miss = [];
      if (!registry.has(code)) miss.push('注册表');
      if (!editor.has(code)) miss.push('平台端');
      if (!app.has(code)) miss.push('App 端');
      return `${code}  ${DIM}缺 ${miss.join(' / ')}   ← ${file}${RESET}`;
    });
  section(
    RED,
    '预置装修内容用了残缺的组件',
    seedBroken,
    '后果：预置页面开箱就是坏的，用户第一次进装修看到的就是灰块',
  );

  if (problems === 0) {
    console.log(`\n${GREEN}✓ 三处注册完全一致${RESET}`);
    process.exit(0);
  }
  console.log(`\n${RED}共 ${problems} 处不一致${RESET}`);
  process.exit(1);
}

main();
