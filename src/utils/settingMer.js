// 请求接口地址 如果没有配置自动获取当前网址路径
const VUE_APP_API_URL = process.env.VUE_APP_BASE_API || `${location.origin}`;
const VUE_APP_API_URL2 = process.env.VUE_APP_BASE_API2 || `${location.origin}`;
const VUE_APP_API_URL3 = process.env.VUE_APP_BASE_API3 || `${location.origin}`;
// 推荐配置走网关的 /flink 路由（tjMall-flink 模块）
const VUE_APP_API_URL4 = process.env.VUE_APP_BASE_API4 || `${location.origin}`;
// 推荐试算走网关的 /front 路由（tjMall-app 模块）——召回逻辑在 app 里，只能找它要
const VUE_APP_API_URL5 = process.env.VUE_APP_BASE_API5 || `${location.origin}`;
const VUE_APP_WS_URL =
  process.env.VUE_APP_WS_URL || (location.protocol === 'https' ? 'wss' : 'ws') + ':' + location.hostname;

const SettingMer = {
  // 服务器地址
  httpUrl: VUE_APP_API_URL,
  // 接口请求地址
  apiBaseURL: VUE_APP_API_URL + '/api/',
  apiBaseURL2: VUE_APP_API_URL2 + '/',
  apiBaseURL3: VUE_APP_API_URL3 + '/',
  apiBaseURL4: VUE_APP_API_URL4 + '/',
  apiBaseURL5: VUE_APP_API_URL5 + '/',
  // socket连接
  wsSocketUrl: VUE_APP_WS_URL,
  // 是否为平台端
  isPlatform: isPlatform,
};
// 判断是否为平台端路由
const isPlatform = isPlatformPath();
function isPlatformPath() {
  const path = window.location.pathname;
  if (path == '/') return true;
  return path.split('/')[1] ? path.split('/')[1].toLowerCase() !== 'circle' : false;
}
// 导出 isPlatform 函数
export { isPlatform };
export default SettingMer;
