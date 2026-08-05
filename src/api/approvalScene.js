/**
 * 审批场景配置 API
 */
import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

const baseURL = SettingMer.apiBaseURL2;

// 所有场景列表 (供配置页显示)
export function listScenes() {
  return request({ url: '/flowable/approval-scene/list', method: 'get', baseURL });
}

// 按 sceneCode 查询单个场景 (供业务侧调用, 判断是否显示"发起审批"按钮)
export function getScene(sceneCode) {
  return request({ url: `/flowable/approval-scene/${sceneCode}`, method: 'get', baseURL });
}

// 更新场景 (启用/停用 + 绑定审批流)
export function updateScene(data) {
  return request({ url: '/flowable/approval-scene', method: 'put', data, baseURL });
}

// 快捷切换启用状态
export function toggleScene(id, enabled) {
  return request({ url: `/flowable/approval-scene/toggle/${id}`, method: 'post', params: { enabled }, baseURL });
}

// 删除场景
export function deleteScene(id) {
  return request({ url: `/flowable/approval-scene/${id}`, method: 'delete', baseURL });
}

// 扫描 tjMall-admin 所有 Controller 方法, 供接入位置下拉选择
// 注意: 走 admin baseURL (不是 flowable)
export function listHookEndpoints() {
  return request({ url: '/admin/approval/endpoints/list', method: 'get' });
}
