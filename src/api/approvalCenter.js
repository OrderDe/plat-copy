/**
 * 审批中心 API — 发起 / 待办 / 我发起的 / 详情 / 同意 / 驳回 / 转办 / 撤回
 * 对应后端 tjMall-flowable / ApprovalInstanceController
 */
import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

const baseURL = SettingMer.apiBaseURL2;

// 发起审批 (供业务侧调用, 如商户提交商品上架时)
export function startApproval(data) {
  return request({ url: '/flowable/approval/start', method: 'post', data, baseURL });
}

// 我的待办
export function listTodo(userId) {
  return request({ url: '/flowable/approval/todo/list', method: 'get', params: { userId }, baseURL });
}

// 我发起的
export function listMine(userId) {
  return request({ url: '/flowable/approval/mine/list', method: 'get', params: { userId }, baseURL });
}

// 审批详情 (含操作历史)
export function getApprovalDetail(instanceId) {
  return request({ url: `/flowable/approval/detail/${instanceId}`, method: 'get', baseURL });
}

// 同意
export function approvePass(data) {
  return request({ url: '/flowable/approval/pass', method: 'post', data, baseURL });
}

// 驳回
export function approveReject(data) {
  return request({ url: '/flowable/approval/reject', method: 'post', data, baseURL });
}

// 转办
export function approveTransfer(data) {
  return request({ url: '/flowable/approval/transfer', method: 'post', data, baseURL });
}

// 撤回
export function withdrawApproval(instanceId, userId) {
  return request({ url: `/flowable/approval/withdraw/${instanceId}`, method: 'post', params: { userId }, baseURL });
}

// 已办结
export function listDone(userId) {
  return request({ url: '/flowable/approval/done/list', method: 'get', params: { userId }, baseURL });
}

// 我收到的抄送
export function listCc(userId) {
  return request({ url: '/flowable/approval/cc/list', method: 'get', params: { userId }, baseURL });
}

// 抄送未读数
export function unreadCcCount(userId) {
  return request({ url: '/flowable/approval/cc/unread-count', method: 'get', params: { userId }, baseURL });
}

// 标记抄送已读
export function markCcRead(ccId, userId) {
  return request({ url: `/flowable/approval/cc/read/${ccId}`, method: 'post', params: { userId }, baseURL });
}

// 添加抄送 (测试用)
export function addCc(instanceId, userId, userName) {
  return request({ url: '/flowable/approval/cc/add', method: 'post', params: { instanceId, userId, userName }, baseURL });
}

// 全量审批记录分页 (平台端溯源，不限发起人/审批人)
export function pageApprovalRecords(data) {
  return request({ url: '/flowable/approval/page', method: 'post', data, baseURL });
}

// 按业务查审批轨迹 (某商品/订单走过的所有审批，含每一步记录)
export function listApprovalByBusiness(businessType, businessId) {
  return request({ url: '/flowable/approval/business', method: 'get', params: { businessType, businessId }, baseURL });
}

// 审批统计
export function approvalStat(days) {
  return request({ url: '/flowable/approval/stat', method: 'get', params: { days: days || 30 }, baseURL });
}
