import request from '@/utils/request'
import SettingMer from '@/utils/settingMer';
let baseURL = SettingMer.apiBaseURL2;
// 查询流程监听列表
export function listListener(query) {
  return request({
    url: '/system/listener/list',
    method: 'get',
    params: query,
    baseURL: baseURL
  })
}

// 查询流程监听详细
export function getListener(id) {
  return request({
    url: '/system/listener/' + id,
    method: 'get',
    baseURL: baseURL
  })
}

// 新增流程监听
export function addListener(data) {
  return request({
    url: '/system/listener',
    method: 'post',
    data: data,
    baseURL: baseURL
  })
}

// 修改流程监听
export function updateListener(data) {
  return request({
    url: '/system/listener',
    method: 'put',
    data: data,
    baseURL: baseURL
  })
}

// 删除流程监听
export function delListener(id) {
  return request({
    url: '/system/listener/' + id,
    method: 'delete',
    baseURL: baseURL
  })
}
