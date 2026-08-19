/**
 * QDiy 基础控件公共工具
 * 迁移自 PHP 侧 `backend/web/resources/js/diy-util.js`
 */

/** 生成 uuid，用于给列表项分配稳定 key */
export function getRandomId() {
  const hexDigits = '0123456789abcdef';
  const s = [];
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4';
  s[19] = hexDigits.substr((parseInt(s[19], 16) & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = '-';
  return s.join('');
}

/** 深拷贝 */
export function deepClone(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (obj instanceof Array) return obj.map((e) => deepClone(e));
  const o = {};
  Object.keys(obj).forEach((k) => {
    o[k] = deepClone(obj[k]);
  });
  return o;
}

/**
 * 按路径安全取值，取不到时返回默认值
 * getObjValue(obj, ['computedStyle', 'searchIpts', 'marginTop'], 0)
 */
export function getObjValue(target, keys = [], def) {
  let value;
  try {
    value = keys.reduce((prev, key) => prev[key], target);
  } catch (e) {
    value = def;
  }
  return value === undefined || value === null || value === '' ? def : value;
}

/** 深比较 */
export function deepEqual(x, y) {
  if (x === y) return true;
  if (typeof x === 'object' && x !== null && typeof y === 'object' && y !== null) {
    if (Object.keys(x).length !== Object.keys(y).length) return false;
    return Object.keys(x).every((prop) => Object.prototype.hasOwnProperty.call(y, prop) && deepEqual(x[prop], y[prop]));
  }
  return false;
}

/** 16 进制颜色转 rgb */
export function colorRgb(str) {
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
  let sColor = (str || '').toLowerCase();
  if (!sColor || !reg.test(sColor)) return sColor;
  if (sColor.length === 4) {
    let sColorNew = '#';
    for (let i = 1; i < 4; i += 1) {
      sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
    }
    sColor = sColorNew;
  }
  const sColorChange = [];
  for (let i = 1; i < 7; i += 2) {
    sColorChange.push(parseInt(`0x${sColor.slice(i, i + 2)}`, 16));
  }
  return `rgb(${sColorChange.join(',')})`;
}

/** 判断颜色是亮色还是暗色，用于自动选择前景色 */
export function getContrastYIQ(hexcolor) {
  const colors = (colorRgb(hexcolor) || '').match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!colors) return 'light';
  const brightness = (colors[1] * 299 + colors[2] * 587 + colors[3] * 114) / 255000;
  return brightness >= 0.5 ? 'light' : 'dark';
}

/** 链接选择里「其他链接」类型的中文名 */
export function getOtherUrlName(type) {
  const map = { call: '拨打电话', web: '自定义链接', applet: '小程序' };
  return map[type] || '';
}

/** 防抖 */
export function debounce(func, wait) {
  let timer;
  return function debounced(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), wait);
  };
}

/** 输入框获焦时全选，控件里大量用到 */
export function iptSelect(e) {
  if (e && e.currentTarget && e.currentTarget.select) e.currentTarget.select();
}

/**
 * 边距数组 → 样式对象
 * 对应 PHP basicMixins.sliderChange
 */
export function marginStyle(arr, showUnit = true) {
  const val = (item) => (item ? (showUnit ? item.value + (item.unit || 'px') : item.value) : undefined);
  const lr = val(arr[2]);
  return {
    marginTop: val(arr[0]),
    marginBottom: val(arr[1]),
    marginLeft: lr,
    marginRight: lr,
  };
}

/**
 * 圆角数组 → 样式对象
 * 对应 PHP basicMixins.RadiusChange
 */
export function radiusStyle(arr) {
  const top = arr[0] ? arr[0].value + (arr[0].unit || 'px') : 0;
  const bottom = arr[1] ? arr[1].value + (arr[1].unit || 'px') : 0;
  return {
    'border-top-left-radius': top,
    'border-top-right-radius': top,
    'border-bottom-right-radius': bottom,
    'border-bottom-left-radius': bottom,
  };
}
