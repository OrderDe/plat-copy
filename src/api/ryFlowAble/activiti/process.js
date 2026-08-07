import request from '@/api/flowable/request'

// 分页查询流程实例
export function getProcessDefinitionBpmnXML(params) {
  return request({
    url: '/activiti/process/getBpmnXml',
    method: 'get',
    params: params
  })
}

// 分页查询流程实例
export function getProcessHighlight(params) {
  return request({
    url: '/activiti/process/getProcessHighlight',
    method: 'get',
    params: params
  })
}

// 分页查询流程实例
export function pageQuery(params) {
    return request({
      url: '/activiti/process/pageQuery',
      method: 'get',
      params: params
    })
}

// 查询审批时间线
export function getApprovalDetail(params) {
  return request({
    url: '/activiti/process/getApprovalDetail',
    method: 'get',
    params: params
  })
}