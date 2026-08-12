/**
 * 仓库模块统一时间展示：2026-08-07T17:01:13 -> 2026-08-07 17:01:13。
 * 不创建 Date 对象，避免浏览器按时区再次换算服务端已经格式化的本地时间。
 */
export function formatDateTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').substring(0, 19);
}

export default formatDateTime;
