/**
 * v-int-only —— 数量输入框只允许整数。
 *
 * 为什么需要：el-input-number 的 :precision="0" 只在**失焦**时才把值格式化回整数，
 * 输入过程中 0.2、-1 照样打得进去。运营填完数量直接点「保存」，blur 和 click 撞在一起，
 * 提交出去的就是那个小数（后端已在 JacksonConfig 里拦截，但报错体验远不如根本打不进去）。
 *
 * 这里从键盘和粘贴两条路一起堵：小数点、负号、e/E（科学计数法）都不接受。
 * 用法：<el-input-number v-int-only ... />，也可直接用在 <el-input> 上。
 */
const BLOCKED_KEYS = ['.', '-', '+', 'e', 'E'];

function findInput(el) {
  return el.tagName === 'INPUT' ? el : el.querySelector('input');
}

export default {
  inserted(el) {
    const input = findInput(el);
    if (!input) return;

    // 手机数字键盘也不给小数点
    input.setAttribute('inputmode', 'numeric');

    el._intOnlyKeydown = (e) => {
      // 放行功能键（退格、方向键、Tab、Ctrl 组合等），只拦字符输入
      if (e.ctrlKey || e.metaKey || e.key === undefined || e.key.length > 1) return;
      if (BLOCKED_KEYS.indexOf(e.key) > -1) {
        e.preventDefault();
      }
    };
    // 粘贴 "1.5" 这类内容时把非数字字符去掉，取整数部分
    el._intOnlyPaste = (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text') || '';
      if (/^\d*$/.test(text.trim())) return;
      e.preventDefault();
      const digits = text.replace(/[^\d]/g, '');
      if (!digits) return;
      input.value = digits;
      // 手动派发 input，Vue 才能同步到 v-model
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    input.addEventListener('keydown', el._intOnlyKeydown);
    input.addEventListener('paste', el._intOnlyPaste);
  },
  unbind(el) {
    const input = findInput(el);
    if (!input) return;
    if (el._intOnlyKeydown) input.removeEventListener('keydown', el._intOnlyKeydown);
    if (el._intOnlyPaste) input.removeEventListener('paste', el._intOnlyPaste);
    el._intOnlyKeydown = null;
    el._intOnlyPaste = null;
  },
};
