/**
 * 校园收益联盟 API（平台端）
 *
 * 后端在 tjMall-alliance 模块，经网关 /alliance 路由转发（StripPrefix=1），
 * 所以这里的 url 要带上后端自己的 /api 前缀。
 *
 * 鉴权沿用平台端现有登录态：request.js 会把 `Authori-zation` 头带上，
 * 联盟侧的 MallTokenResolver 认得 platform 前缀的 Redis 令牌，不需要额外换票。
 *
 * 响应：联盟的成功码同样是 200，拦截器已经把 data 解出来了，页面拿到的就是业务数据。
 */
import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

const baseURL = SettingMer.apiBaseURL6;

/*
 * 没配 VUE_APP_BASE_API6 时 settingMer 会 fallback 到 location.origin，
 * 请求就打到前端自己的 dev server / nginx 上，表现为一片莫名其妙的 404
 * （Request URL 长这样：http://localhost:9527/api/platform/rules）。
 * 改完 .env 必须重启 dev server —— vue-cli 只在启动时读一次 .env，热更新不会重读。
 */
if (!process.env.VUE_APP_BASE_API6) {
  // eslint-disable-next-line no-console
  console.error(
    '[alliance] 未配置 VUE_APP_BASE_API6，联盟接口会打到前端自身导致 404。' +
      '请在 .env.development 配置后重启 dev server。当前 baseURL =',
    baseURL,
  );
}

// ===================== 区域代理 =====================

/** 开通区域代理。该区已有生效代理时后端会拒绝，需走候补队列 */
export function openRegionAgent(data) {
  return request({ url: '/api/platform/region/open', method: 'post', data, baseURL });
}

/** 查某区域当前生效代理 */
export function getRegionAgent(regionCode) {
  return request({ url: '/api/platform/region/agent', method: 'get', params: { regionCode }, baseURL });
}

/**
 * 全平台区域代理分页列表。
 *
 * regionPrefix 是行政区划编码前缀：'44' 查广东、'4401' 查广州、留空查全国。
 * 默认只出生效记录，includeInactive=true 才带上交接后的历史行。
 */
export function getAgentList(params) {
  return request({ url: '/api/platform/region/agents', method: 'get', params, baseURL });
}

/**
 * 编辑代理的合同信息与合作期。
 *
 * 刻意不能改 agentUid 和 regionCode：换人走 handoverRegionAgent（要校验待结算收益、
 * 开新的归属版本），在这里直接改人等于让一个人的历史业绩变成另一个人的。
 */
export function updateRegionAgent(id, data) {
  return request({ url: `/api/platform/region/agent/${id}`, method: 'post', data, baseURL });
}

/**
 * 按 uid 查用户，开通代理时确认「这个 uid 是谁」。
 *
 * 返回 valid=false 表示查无此人或账号已注销/禁用 —— 这种 uid 存进去就是一条
 * 没人能登录使用的空壳代理记录，前端必须拦住。
 */
export function getUserBrief(uid) {
  return request({ url: '/api/platform/user/brief', method: 'get', params: { uid }, baseURL });
}

/** 停用代理。软删：置失效并释放该区名额，历史分账记录仍能追溯到人 */
export function disableRegionAgent(id, reason) {
  return request({ url: `/api/platform/region/agent/${id}/disable`, method: 'post', params: { reason }, baseURL });
}

/** 某区域的候补队列 */
export function getRegionQueue(regionCode) {
  return request({ url: '/api/platform/region/queue', method: 'get', params: { regionCode }, baseURL });
}

/** 从候补队列启用一位代理 */
export function enableFromQueue(queueId, regionPath) {
  return request({
    url: `/api/platform/region/queue/${queueId}/enable`,
    method: 'post',
    params: { regionPath },
    baseURL,
  });
}

/** 代理交接。现任有待结算收益时后端拒绝，必须先结清 */
export function handoverRegionAgent(data) {
  return request({ url: '/api/platform/region/handover', method: 'post', data, baseURL });
}

/** 某区域的历史归属版本，用于追溯历史订单当时归谁管 */
export function getRegionAssignments(regionCode) {
  return request({ url: '/api/platform/region/assignments', method: 'get', params: { regionCode }, baseURL });
}

// ===================== 团长 =====================

/** 平台抽查否决代理的审批结果。只否决身份，不回溯已产生的分成 */
export function vetoLeaderApply(applyId, reason) {
  return request({ url: `/api/platform/leader/apply/${applyId}/veto`, method: 'post', data: { reason }, baseURL });
}

/** 给团长换代理。只改管理关系，不影响任何一单的分账 */
export function changeLeaderAgent(leaderUid, newRegionCode, reason) {
  return request({
    url: `/api/platform/leader/${leaderUid}/change-agent`,
    method: 'post',
    params: { newRegionCode, reason },
    baseURL,
  });
}

// ===================== 佣金规则 =====================

/** 佣金规则列表，status 不传为全部：0-草稿 1-启用 2-停用 */
export function getRuleList(status) {
  return request({ url: '/api/platform/rules', method: 'get', params: { status }, baseURL });
}

/** 保存规则草稿。后端在保存时就做完整校验（计算方式互斥、比例合计、时间区间不重叠） */
export function saveRule(data) {
  return request({ url: '/api/platform/rules', method: 'post', data, baseURL });
}

/** 发布规则，生成不可变版本号 */
export function publishRule(ruleId) {
  return request({ url: `/api/platform/rules/${ruleId}/publish`, method: 'post', baseURL });
}

/** 停用规则，已按该规则算过的订单不受影响 */
export function disableRule(ruleId) {
  return request({ url: `/api/platform/rules/${ruleId}/disable`, method: 'post', baseURL });
}

// ===================== 风控 =====================

/** 待处理风险事件，按等级倒序，limit 上限 200 */
export function getPendingRisks(limit = 50) {
  return request({ url: '/api/platform/risk/pending', method: 'get', params: { limit }, baseURL });
}

/** 处理风险事件。status：1-已拦截 2-审核中 3-确认风险 4-误报 5-已关闭 */
export function handleRisk(id, status, remark) {
  return request({ url: `/api/platform/risk/${id}/handle`, method: 'post', params: { status, remark }, baseURL });
}

// ===================== 配置 =====================

/** 全部联盟配置（key -> value 的字符串字典） */
export function getAllianceConfig() {
  return request({ url: '/api/platform/config', method: 'get', baseURL });
}

/** 更新单个配置并立即生效 */
export function updateAllianceConfig(key, value) {
  return request({ url: '/api/platform/config', method: 'post', params: { key, value }, baseURL });
}
