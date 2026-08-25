/**
 * QDiy 组件注册中心
 *
 * 约定：每个业务组件放在 `widgets/{code}/` 下，固定两个文件
 *   preview.vue —— 中间画布预览，注册为全局组件 {code}-preview
 *   style.vue   —— 右侧属性面板，注册为全局组件 {code}-style
 *
 * P6 迁移组件时只需按此目录结构添加文件，无需改动编辑器代码。
 * 尚未迁移的组件自动回退到 FallbackPreview / FallbackStyle，保证编辑器可用。
 */
import Vue from 'vue';
import FallbackPreview from './components/FallbackPreview';
import FallbackStyle from './components/FallbackStyle';
// 全局注册 21 个基础控件，P6 的 preview/style 可直接按 diy-xxx 标签名使用
import './controls';

// 占位组件先注册，供未迁移组件回退使用
Vue.component('FallbackPreview', FallbackPreview);
Vue.component('FallbackStyle', FallbackStyle);

// 已注册的组件 code 集合
const registered = new Set();

/**
 * 扫描 widgets 目录，注册所有已迁移组件
 */
function scanWidgets() {
  let ctx;
  try {
    ctx = require.context('./widgets', true, /\/(preview|style)\.vue$/);
  } catch (e) {
    // widgets 目录为空或不存在时静默跳过
    return;
  }
  ctx.keys().forEach((key) => {
    // key 形如 './carousel-img/preview.vue'
    const match = key.match(/^\.\/(.+)\/(preview|style)\.vue$/);
    if (!match) return;
    const [, code, type] = match;
    const component = ctx(key).default;
    if (!component) return;
    Vue.component(`${code}-${type}`, component);
    if (type === 'preview') registered.add(code);
  });
}

scanWidgets();

/**
 * 该 code 是否已有迁移好的组件实现
 */
export function isRegistered(code) {
  return registered.has(code);
}

/**
 * 取画布预览组件名，未迁移的回退到占位组件
 */
export function previewOf(code) {
  return isRegistered(code) ? `${code}-preview` : 'FallbackPreview';
}

/**
 * 取属性面板组件名，未迁移的回退到占位组件
 */
export function styleOf(code) {
  return Vue.options.components[`${code}-style`] ? `${code}-style` : 'FallbackStyle';
}

/**
 * 依据组件注册表信息，构造一个空的画布项
 * 数据协议与 PHP 侧保持一致：{identify, site, data, computedStyle, params}
 */
export function createItem(component, site) {
  return {
    identify: component.code,
    site,
    /*
     * data 里不放 title。
     *
     * 这里原来写的是 title: component.title —— 那是「组件库里的显示名」（按钮组、公告…），
     * 不是业务标题。而 App 端好几个组件（图标组、播报…）会把 data.title 当成要渲染的
     * 分组标题显示出来，于是页面上白白多出「按钮组」三个字，运营在面板里还找不到地方关掉。
     * 需要默认标题的组件（如常用图标组的「其他功能」）由各自的 style.vue 在 init 里给，
     * 那才是能被运营改、也能被清空的地方。
     */
    data: {},
    computedStyle: {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: 0,
      bgColor: '',
    },
    params: {},
  };
}

/**
 * 解析组件的操作权限，permission 字段是 JSON 字符串
 * 缺省全部允许，与 PHP 侧行为一致
 */
export function parsePermission(permission) {
  const def = { drag: true, up: true, down: true, copy: true, delete: true };
  if (!permission) return def;
  try {
    return Object.assign(def, typeof permission === 'string' ? JSON.parse(permission) : permission);
  } catch (e) {
    return def;
  }
}

/** 画布默认认的那批顶层样式字段，值是不带单位的数字 */
const TOP_STYLE_KEYS = [
  'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'paddingTop', 'paddingBottom', 'borderRadius',
];

/** 把 searchIpts / spaceStyle 这类「已带单位」的样式对象叠加到 box 上，跳过空值和嵌套对象 */
function mergeStyleObj(box, obj) {
  if (!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (v === '' || v === null || v === undefined || typeof v === 'object') return;
    box[k] = v;
  });
}

/**
 * 把 computedStyle 转成画布上可用的内联样式。
 *
 * 边距 / 圆角历史上有三套互不相通的写法，而这里原来只认顶层的 marginTop 等：
 *   顶层 marginTop…        画布（本函数）写、本函数读
 *   searchIpts.marginTop…  属性面板公共 mixin（basicMixins 的 sliderChange / RadiusChange）写
 *   spaceStyle.marginTop…  少数组件自己写，也是 App 端各 widget 读的那份
 * 于是运营在面板里拖「上下左右边距」「圆角」，画布纹丝不动 —— 值进了 searchIpts，
 * 而画布只看顶层字段。
 *
 * 按 顶层 < spaceStyle < searchIpts 的优先级合并。searchIpts 最高，因为它是
 * 「组件边距 / 圆角」两个公共控件唯一的写入口，代表运营最近一次的显式操作；
 * spaceStyle 是各组件自己写的，两者字段基本不重叠（写 spaceStyle-margin 的
 * carousel-img / img-ad / rubik-cube / star-car-care 都覆写了 sliderChange，不写 searchIpts）。
 *
 * 反过来让 spaceStyle 优先会出事：像 commonly-icon-group 这种只用公共边距控件的
 * 组件，历史数据里残留的 spaceStyle.margin 会永久压住运营新拖的值。
 *
 * 这个口径与 App 端 utils.normalizeComputedStyle 保持一致，两边改动时必须同步。
 */
export function toStyle(computedStyle) {
  const cs = computedStyle || {};
  const px = (v) => `${Number(v) || 0}px`;

  const box = {};
  TOP_STYLE_KEYS.forEach((k) => {
    box[k] = px(cs[k]);
  });

  mergeStyleObj(box, cs.spaceStyle);
  mergeStyleObj(box, cs.searchIpts);

  box.background = cs.bgColor || 'transparent';
  return box;
}
