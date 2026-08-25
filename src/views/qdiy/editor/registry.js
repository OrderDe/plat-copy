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

/**
 * 把 computedStyle 转成画布上可用的内联样式。
 *
 * 只读顶层字段，不合并 searchIpts / spaceStyle。
 *
 * 曾经在这里合并过那两套，目的是让「面板里拖了边距、画布不动」好起来，
 * 但那是误判：61 个组件里有 33 个的 preview.vue（以及 DiyCenterMenu 这类控件）
 * 本来就自己把 searchIpts / spaceStyle 绑在了内层元素上。外层 canvas-item 再加一遍，
 * 同一个边距就被应用两次 —— 后台画布的间距变成实际值的两倍，
 * 而 App 端是一倍，反而更对不上。
 *
 * 边距由各 preview 自己负责（现状）；还没处理的那 28 个组件应当在各自的
 * preview 里补，不要回到这里统一加 —— 否则又会把那 33 个弄成两倍。
 *
 * App 端不存在这个问题：widget 只有 wrapStyle 一层，
 * utils.normalizeComputedStyle 的合并仍然需要且正确。
 */
export function toStyle(computedStyle) {
  const cs = computedStyle || {};
  const px = (v) => `${Number(v) || 0}px`;
  return {
    marginTop: px(cs.marginTop),
    marginBottom: px(cs.marginBottom),
    marginLeft: px(cs.marginLeft),
    marginRight: px(cs.marginRight),
    paddingTop: px(cs.paddingTop),
    paddingBottom: px(cs.paddingBottom),
    borderRadius: px(cs.borderRadius),
    background: cs.bgColor || 'transparent',
  };
}
