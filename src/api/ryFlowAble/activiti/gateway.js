import request from '@/api/flowable/request'

// 排他网关案例发起接口
export function startExclusiveCase(data) {
    return request({
      url: '/activiti/gateway/startExclusiveCase',
      method: 'post',
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
}

// 并行网关案例发起接口
export function startParallel(data) {
  return request({
    url: '/activiti/gateway/startParallel',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 包容网关案例发起接口
export function startInclude(data) {
  return request({
    url: '/activiti/gateway/startInclude',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 事件网关案例发起接口
export function startEventBase(data) {
  return request({
    url: '/activiti/gateway/startEventBase',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 触发事件网关上的信号
export function triggerSignal(params) {
  return request({
    url: '/activiti/gateway/triggerSignal',
    method: 'get',
    params: params
  })
}
