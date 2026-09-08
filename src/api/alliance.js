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
 * 按昵称 / 手机号 / uid 搜商城用户，开通代理时挑人用。
 *
 * 代理 uid 必须是真实存在的商城用户 —— 代理靠它登录小程序审批团长、看分成。
 * 让运营手打一个数字必然抄错，抄错就是一条没人能登录的空壳记录。
 */
export function searchUser(keyword, limit = 10) {
  return request({ url: '/api/platform/user/search', method: 'get', params: { keyword, limit }, baseURL });
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

/** 删除没有绑定团长的区域代理（后端会再次校验团长数量） */
export function deleteRegionAgent(id) {
  return request({ url: `/api/platform/region/agent/${id}/delete`, method: 'post', baseURL });
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

/** 解除团长与区域代理的管理绑定，保留团长身份及历史数据 */
export function unbindLeaderAgent(leaderUid, reason) {
  return request({
    url: `/api/platform/leader/${leaderUid}/unbind-agent`,
    method: 'post',
    params: { reason },
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

// ===================== 平台报表 =====================
//
// 以下六个都是「不限本人 / 不限本区」的全量查询，只有平台端能调。
// 代理端与团长端的同类接口一律带范围过滤，拿来做平台报表会少一大截数据。
//
// 统一返回 { total, list, users }：users 是 uid -> { nickname, phone, valid } 的字典，
// 后端一次性补齐，页面别再逐行去查用户。查不到的 uid 不在字典里，显示「查无此人」。

/**
 * 全平台团长分页。
 *
 * regionPrefix 是行政区划编码前缀；auditStatus：0-待审 1-通过 2-驳回。
 * 默认不限审批状态 —— 被驳回和被否决的那些也要看得见。
 */
export function getLeaderList(params) {
  return request({ url: '/api/platform/leaders', method: 'get', params, baseURL });
}

/** 全平台团长申请分页，含待抽查。抽查否决从这个列表选单 */
export function getLeaderApplyList(params) {
  return request({ url: '/api/platform/leader/applies', method: 'get', params, baseURL });
}

/**
 * 全平台分成明细分页。
 *
 * role：LEADER 团长侧 / AGENT 收货地代理 / AGENT_ORIGIN 招募代理。
 * 跨区订单里 AGENT 与 AGENT_ORIGIN 是两个不同的人，各占一行。
 */
export function getCommissionList(params) {
  return request({ url: '/api/platform/commissions', method: 'get', params, baseURL });
}

/** 团长提现申请：平台人工审核和确认打款 */
export function getLeaderWithdrawList(params) {
  return request({ url: '/api/platform/withdrawals', method: 'get', params, baseURL });
}

export function approveLeaderWithdraw(id, remark) {
  return request({ url: `/api/platform/withdrawals/${id}/approve`, method: 'post', data: { remark }, baseURL });
}

export function rejectLeaderWithdraw(id, remark) {
  return request({ url: `/api/platform/withdrawals/${id}/reject`, method: 'post', data: { remark }, baseURL });
}

export function markLeaderWithdrawPaid(id, remark) {
  return request({ url: `/api/platform/withdrawals/${id}/paid`, method: 'post', data: { remark }, baseURL });
}

/** 对该笔提现重新发起微信自动打款（上次转账失败后的重试） */
export function retryLeaderWithdrawPayout(id) {
  return request({ url: `/api/platform/withdrawals/${id}/payout`, method: 'post', baseURL });
}

/** 向微信查询该笔转账的最新状态 */
export function refreshLeaderWithdrawPayout(id) {
  return request({ url: `/api/platform/withdrawals/${id}/payout/refresh`, method: 'post', baseURL });
}

/**
 * 打款时才取的完整卡号。
 *
 * 列表里只有掩码，明文按笔单独取 —— 一次点开一笔，明文的暴露面就不是一整页。
 */
export function getLeaderWithdrawCard(id) {
  return request({ url: `/api/platform/withdrawals/${id}/card`, method: 'get', baseURL });
}

/** 积分账户分页，按可用余额倒序 */
export function getPointsAccounts(params) {
  return request({ url: '/api/platform/points/accounts', method: 'get', params, baseURL });
}

/** 积分账本分页。账本不可变，冲正是另写一行，所以按时间求和就是那段时间的净额 */
export function getPointsLedger(params) {
  return request({ url: '/api/platform/points/ledger', method: 'get', params, baseURL });
}

/** 同一团长对同一用户的每日积分核销次数、积分额度配置。0 表示不限。 */
export function getLeaderUserVerifyLimitList(params) {
  return request({ url: '/api/platform/leader-user-verify-limits', method: 'get', params, baseURL });
}

export function saveLeaderUserVerifyLimit(data) {
  return request({ url: '/api/platform/leader-user-verify-limits', method: 'post', data, baseURL });
}

export function disableLeaderUserVerifyLimit(id) {
  return request({ url: `/api/platform/leader-user-verify-limits/${id}/disable`, method: 'post', baseURL });
}

/** 全平台核销单分页。merchantId 留空即查全平台 */
export function getVerifyRecords(params) {
  return request({ url: '/api/platform/verify/records', method: 'get', params, baseURL });
}

/** 指定商户的经营概览。商户端同名接口只能看自己 */
export function getMerchantOverview(merchantId) {
  return request({ url: '/api/platform/merchant/overview', method: 'get', params: { merchantId }, baseURL });
}

// ===================== 分销设置（分享链路） =====================

/**
 * 分销设置回显。
 *
 * 分享链路是「区域代理 → 团长 → 消费者」：代理把平台开放给他的商品发到名下团长群，
 * 团长再把链接分发到消费者群，成交后团长与代理各按利润分成设置取佣。
 *
 * targetRole: LEADER-团长可分享的商品，AGENT-开放给区域代理选品的商品。
 */
export function getShareSettings(targetRole = 'LEADER') {
  return request({ url: '/api/platform/share/settings', method: 'get', params: { targetRole }, baseURL });
}

/**
 * 保存分销设置。
 *
 * products 是覆盖式的：提交的清单就是该角色最终能分享的全部商品，
 * 页面上取消勾选的商品会真的从池子里移除，不会继续被分享。
 */
export function saveShareSettings(data) {
  return request({ url: '/api/platform/share/settings', method: 'post', data, baseURL });
}

// ===================== 分销商品（全平台） =====================
//
// 走的是 admin 的 /admin/platform/**，不是联盟服务，所以不带 baseURL —— 它用默认的
// 商城后台地址。写在这个文件里只是因为菜单归在联盟下面，接口本身不属于联盟模块。

/** 全平台分销商品分页，merId 留空为全部商户 */
export function getPlatformDistributionProducts(params) {
  return request({ url: '/admin/platform/distribution/product/list', method: 'get', params });
}

/** 平台强制开关某条分销商品配置。奖励值不给平台改，只给开关 */
export function togglePlatformDistributionProduct(id, open) {
  return request({ url: `/admin/platform/distribution/product/toggle/${id}`, method: 'post', params: { open } });
}
