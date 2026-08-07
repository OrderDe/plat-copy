import request from '@/api/flowable/request'

// 开始事件
export function start(data) {
    return request({
      url: '/activiti/signal/start',
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
    url: '/activiti/signal/boundary',
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
    url: '/activiti/signal/boundaryTrigger',
    method: 'get',
    params: params
  })
}