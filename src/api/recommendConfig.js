/**
 * 商品用户推荐配置 API
 *
 * 后端在 tjMall-flink 模块，经网关 /flink 路由转发（StripPrefix=1）。
 * 所有保存类接口都会返回刷新后的整页数据，前端拿返回值直接重渲染即可，不用再拉一次 view。
 */
import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

const baseURL = SettingMer.apiBaseURL4;

// 页面全量数据：行为列表 + 过滤规则 + 推荐位 + 各下拉框候选项
export function getRecommendView() {
  return request({ url: '/recommend/config/view', method: 'get', baseURL });
}

// 保存顾客动作配置（页面①）
export function saveBehaviors(data) {
  return request({ url: '/recommend/config/behavior/save', method: 'post', data, baseURL });
}

// 套用整体风格模板：CONSERVATIVE / BALANCED / AGGRESSIVE
export function applyPreset(presetCode) {
  return request({ url: `/recommend/config/preset/${presetCode}`, method: 'post', baseURL });
}

// 保存商品过滤规则（页面②）
export function saveFilterRules(data) {
  return request({ url: '/recommend/config/filter/save', method: 'post', data, baseURL });
}

// 保存推荐位配置（页面③）
export function saveScenes(data) {
  return request({ url: '/recommend/config/scene/save', method: 'post', data, baseURL });
}

// 保存全局设置（新顾客兜底策略）
export function saveSetting(data) {
  return request({ url: '/recommend/config/setting/save', method: 'post', data, baseURL });
}

// 变更记录
export function getConfigLogs(limit) {
  return request({ url: '/recommend/config/logs', method: 'get', params: { limit }, baseURL });
}

// 强制重新下发配置到算法侧
export function publishConfig() {
  return request({ url: '/recommend/config/publish', method: 'post', baseURL });
}

// 效果看板：按推荐位统计曝光/点击/加购/成交，数据来自 ClickHouse 行为流水
export function getSceneStats(startDate, endDate) {
  return request({
    url: '/recommend/config/stats',
    method: 'get',
    params: { startDate, endDate },
    baseURL,
  });
}

/**
 * 推荐试算：按指定顾客跑一遍真实召回，看看他现在会被推什么。
 *
 * 这个接口在 tjMall-app（召回逻辑在那儿），不在 flink，所以走 /front 路由。
 * 鉴权用的还是平台后台的登录 token，app 侧会校验只有平台管理员能调。
 */
export function previewRecommend(userId, limit) {
  return request({
    url: '/api/front/index/recommend/preview',
    method: 'get',
    params: { userId, limit },
    baseURL: SettingMer.apiBaseURL5,
  });
}
