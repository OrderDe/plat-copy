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
    data: {
      title: component.title,
    },
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
 * 把 computedStyle 转成画布上可用的内联样式
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
