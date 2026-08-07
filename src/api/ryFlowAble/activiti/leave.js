import request from '@/api/flowable/request'

// 查询请假列表
export function listLeave(query) {
  return request({
    url: '/activiti/leave/list',
    method: 'get',
    params: query
  })
}

// 查询请假详细
export function getLeave(id) {
  return request({
    url: '/activiti/leave/' + id,
    method: 'get'
  })
}

// 新增请假
export function addLeave(data) {
  return request({
    url: '/activiti/leave/add',
    method: 'post',
    data: data
  })
}

// 修改请假
export function updateLeave(data) {
  return request({
    url: '/activiti/leave/update',
    method: 'put',
    data: data
  })
}

// 删除请假
export function delLeave(id) {
  return request({
    url: '/activiti/leave/' + id,
    method: 'delete'
  })
}

// 我的待办 - 分页
export function pageMyTodoTasks(params) {
  return request({
    url: '/activiti/leave/pageMyTodoTasks',
    method: 'get',
    params
  })
}

// 我的已办 - 分页
export function pageMyDoneTasks(params) {
  return request({
    url: '/activiti/leave/pageMyDoneTasks',
    method: 'get',
    params
  })
}

// 抄送给我的 - 分页
export function pageMyCopyTasks(params) {
  return request({
    url: '/activiti/leave/pageMyCopyTasks',
    method: 'get',
    params
  })
}

// 审批通过
export function approve(data) {
  return request({
    url: '/activiti/leave/approve',
    method: 'post',
    data: data
  })
}

// 审批拒绝
export function reject(data) {
  return request({
    url: '/activiti/leave/reject',
    method: 'post',
    data: data
  })
}

// 委派任务
export function delegateTask(data) {
  return request({
    url: '/activiti/leave/delegate',
    method: 'post',
    data: data
  })
}

// 完成委派（审查）
export function resolveDelegateTask(data) {
  return request({
    url: '/activiti/leave/delegate/resolve',
    method: 'post',
    data: data
  })
}

// 转交任务
export function transfer(data) {
  return request({
    url: '/activiti/leave/transfer',
    method: 'post',
    data: data
  })
}

// 撤回流程
export function withdrawProcess(data) {
  return request({
    url: '/activiti/leave/withdraw',
    method: 'post',
    data: data
  })
}

// 查询可驳回的节点
export function getRejectBackNodes(params) {
  return request({
    url: '/activiti/leave/rejectBack/nodes',
    method: 'get',
    params
  })
}

// 驳回任务
export function rejectBack(data) {
  return request({
    url: '/activiti/leave/rejectBack',
    method: 'post',
    data: data
  })
}

// 重发请假
export function resendLeave(data) {
  return request({
    url: '/activiti/leave/resend',
    method: 'post',
    data: data
  })
}