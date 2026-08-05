/**
 * 审批流配置 API — 对应后端 tjMall-flowable / ApprovalFlowConfigController
 */
import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

// flowable 服务走 apiBaseURL2 (跟若依 flowable 接口一致)
const baseURL = SettingMer.apiBaseURL2;

// 查询所有业务的审批流配置
export function listFlowConfig() {
  return request({ url: '/flowable/approval-config/list', method: 'get', baseURL });
}

// 按流程 key 查询单个配置
export function getFlowConfig(flowKey) {
  return request({ url: `/flowable/approval-config/${flowKey}`, method: 'get', baseURL });
}

// 新增业务类型 (仅创建空配置)
export function createBiz(data) {
  return request({ url: '/flowable/approval-config/biz', method: 'post', data, baseURL });
}

// 保存节点配置 (草稿, 不部署)
export function saveFlowConfig(data) {
  return request({ url: '/flowable/approval-config', method: 'put', data, baseURL });
}

// 生成 BPMN 并部署到 Flowable
export function deployFlow(flowKey) {
  return request({ url: `/flowable/approval-config/deploy/${flowKey}`, method: 'post', baseURL });
}

// 预览生成的 BPMN XML
export function previewFlowXml(flowKey) {
  return request({ url: `/flowable/approval-config/preview/${flowKey}`, method: 'get', baseURL });
}

// 删除配置
export function deleteFlow(flowKey) {
  return request({ url: `/flowable/approval-config/${flowKey}`, method: 'delete', baseURL });
}

// ===== 组织架构选择器 =====
// 平台管理员列表 (走 admin 网关, 不走 flowable)
// 后端接口: PlatformAdminController#getList 返回 {records:[SystemAdminResponse]}
export function listUsers(keyword) {
  return request({
    url: '/admin/platform/admin/list',
    method: 'get',
    params: { keywords: keyword, page: 1, limit: 200 },
  });
}

// 平台角色列表
// 后端接口: PlatformRoleController#getList 返回 {records:[SystemRole]}
export function listRoles() {
  return request({
    url: '/admin/platform/role/list',
    method: 'get',
    params: { page: 1, limit: 200 },
  });
}

// 按业务类型查询可选条件字段 (供条件分支节点选择)
export function listConditionFields(flowKey) {
  return request({ url: '/flowable/approval-config/condition-fields', method: 'get', params: { flowKey }, baseURL });
}
