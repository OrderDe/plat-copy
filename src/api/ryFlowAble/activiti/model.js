import request from '@/api/flowable/request'

// 新建/更新流程模型
export function saveModel(data) {
  return request({
    url: '/activiti/model/save',
    method: 'post',
    data: data
  })
}

// 获取流程模型详情
export function getModel(modelId) {
  return request({
    url: `/activiti/model/${modelId}`,
    method: 'get'
  })
}

// 部署BPMN流程到activiti引擎
export function deployProcess(data) {
  return request({
    url: '/activiti/model/deploy',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 获取流程定义列表
export function getProcessDefinitions(params) {
  return request({
    url: '/activiti/model/list',
    method: 'get',
    params: params
  })
}

// 获取流程定义XML
export function getProcessDefinitionXml(processDefinitionId) {
  return request({
    url: `/activiti/model/bpmnXml/${processDefinitionId}`,
    method: 'get'
  })
}
// 获取流程定义的部署历史
export function getProcessDefinitionHistory(params) {
  return request({
    url: '/activiti/model/processDefinitions',
    method: 'get',
    params: params
  })
}

// 获取部署列表
export function getDeployments(params) {
  return request({
    url: '/activiti/engine-rest/deployment',
    method: 'get',
    params: params
  })
}

// 获取部署详情
export function getDeployment(deploymentId) {
  return request({
    url: `/activiti/engine-rest/deployment/${deploymentId}`,
    method: 'get'
  })
}

// 删除部署
export function deleteDeployment(deploymentId) {
  return request({
    url: `/activiti/engine-rest/deployment/${deploymentId}`,
    method: 'delete'
  })
}



// 获取流程定义详情
export function getProcessDefinition(processDefinitionId) {
  return request({
    url: `/activiti/engine-rest/process-definition/${processDefinitionId}`,
    method: 'get'
  })
}

// 启动流程实例
export function startProcessInstance(processDefinitionId, data) {
  return request({
    url: `/activiti/engine-rest/process-definition/${processDefinitionId}/start`,
    method: 'post',
    data: data
  })
}

// 获取流程实例列表
export function getProcessInstances(params) {
  return request({
    url: '/activiti/engine-rest/process-instance',
    method: 'get',
    params: params
  })
}

// 获取任务列表
export function getTasks(params) {
  return request({
    url: '/activiti/engine-rest/task',
    method: 'get',
    params: params
  })
}

// 完成任务
export function completeTask(taskId, data) {
  return request({
    url: `/activiti/engine-rest/task/${taskId}/complete`,
    method: 'post',
    data: data
  })
}

// 获取流程实例历史
export function getProcessInstanceHistory(processInstanceId) {
  return request({
    url: `/activiti/engine-rest/history/process-instance/${processInstanceId}`,
    method: 'get'
  })
}

// 获取任务历史
export function getTaskHistory(params) {
  return request({
    url: '/activiti/engine-rest/history/task',
    method: 'get',
    params: params
  })
}



// 获取流程定义图片
export function getProcessDefinitionImage(processDefinitionId) {
  return request({
    url: `/activiti/engine-rest/process-definition/${processDefinitionId}/image`,
    method: 'get',
    responseType: 'blob'
  })
}

// 暂停流程定义
export function suspendProcessDefinition(processDefinitionId, data) {
  return request({
    url: `/activiti/engine-rest/process-definition/${processDefinitionId}/suspended`,
    method: 'put',
    data: data
  })
}

// 激活流程定义
export function activateProcessDefinition(processDefinitionId, data) {
  return request({
    url: `/activiti/engine-rest/process-definition/${processDefinitionId}/suspended`,
    method: 'put',
    data: data
  })
}

// 获取流程定义统计信息
export function getProcessDefinitionStatistics(processDefinitionId) {
  return request({
    url: `/activiti/engine-rest/process-definition/${processDefinitionId}/statistics`,
    method: 'get'
  })
}

// 获取引擎信息
export function getEngineInfo() {
  return request({
    url: '/activiti/engine-rest/version',
    method: 'get'
  })
}

