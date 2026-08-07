import request from '@/api/flowable/request'

// 开始事件
export function start(data) {
    return request({
      url: '/activiti/message/start',
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
      url: '/activiti/message/boundary',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
}

// 中间事件
export function middle(data) {
  return request({
    url: '/activiti/message/middle',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 触发边界事件
export function boundaryTrigger(params) {
    return request({
      url: '/activiti/message/boundaryTrigger',
      method: 'get',
      params: params
    })
  }

// 触发中间事件
export function middleTrigger(params) {
  return request({
    url: '/activiti/message/middleTrigger',
    method: 'get',
    params: params
  })
}
  
