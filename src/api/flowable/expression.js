import request from '@/utils/request'
import SettingMer from '@/utils/settingMer';
let baseURL = SettingMer.apiBaseURL2;
// 查询流程达式列表
export function listExpression(query) {
  return request({
    url: '/system/expression/list',
    method: 'get',
    params: query,
    baseURL: baseURL
  })
}

// 查询流程达式详细
export function getExpression(id) {
  return request({
    url: '/system/expression/' + id,
    method: 'get',
    baseURL: baseURL
  })
}

// 新增流程达式
export function addExpression(data) {
  return request({
    url: '/system/expression',
    method: 'post',
    data: data,
    baseURL: baseURL
  })
}

// 修改流程达式
export function updateExpression(data) {
  return request({
    url: '/system/expression',
    method: 'put',
    data: data,
    baseURL: baseURL
  })
}

// 删除流程达式
export function delExpression(id) {
  return request({
    url: '/system/expression/' + id,
    method: 'delete',
    baseURL: baseURL
  })
}
