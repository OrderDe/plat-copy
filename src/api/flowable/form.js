import request from '@/utils/request'
import SettingMer from '@/utils/settingMer';
let baseURL = SettingMer.apiBaseURL2;
// 查询流程表单列表
export function listForm(query) {
  return request({
    url: '/flowable/form/list',
    method: 'get',
    params: query,
    baseURL: baseURL
  })
}
export function listAllForm(query) {
  return request({
    url: '/flowable/form/formList',
    method: 'get',
    params: query,
    baseURL: baseURL
  })
}

// 查询流程表单详细
export function getForm(formId) {
  return request({
    url: '/flowable/form/' + formId,
    method: 'get',
    baseURL: baseURL
  })
}

// 新增流程表单
export function addForm(data) {
  return request({
    url: '/flowable/form',
    method: 'post',
    data: data,
    baseURL: baseURL
  })
}

// 修改流程表单
export function updateForm(data) {
  return request({
    url: '/flowable/form',
    method: 'put',
    data: data,
    baseURL: baseURL
  })
}
// 挂载表单
export function addDeployForm(data) {
  return request({
    url: '/flowable/form/addDeployForm',
    method: 'post',
    data: data,
    baseURL: baseURL
  })
}

// 删除流程表单
export function delForm(formId) {
  return request({
    url: '/flowable/form/' + formId,
    method: 'delete',
    baseURL: baseURL
  })
}

// 导出流程表单
export function exportForm(query) {
  return request({
    url: '/flowable/form/export',
    method: 'get',
    params: query,
    baseURL: baseURL
  })
}
