import request from '@/api/flowable/request'

// 开始事件
export function start(data) {
    return request({
      url: '/activiti/timer/start',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
}

// 边界事件
export function middle(data) {
  return request({
    url: '/activiti/timer/middle',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 边界事件
export function boundary(data) {
  return request({
    url: '/activiti/timer/boundary',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 触发边界事件-模拟初级工程师完成任务
export function boundaryTrigger(params) {
  return request({
    url: '/activiti/timer/boundaryTrigger',
    method: 'get',
    params: params
  })
}
// 分页查询流程实例
export function pageQuery(params) {
    return request({
      url: '/activiti/timer/pageQuery',
      method: 'get',
      params: params
    })
}