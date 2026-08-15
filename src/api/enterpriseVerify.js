import request from '@/utils/request';
export function getEnterpriseVerifyConfig() {
  return request({ url: '/admin/platform/enterprise-verify-config', method: 'get' });
}

export function saveEnterpriseVerifyConfig(data) {
  return request({ url: '/admin/platform/enterprise-verify-config', method: 'put', data });
}

export function getEnterpriseVerifyRecords(params) {
  return request({ url: '/admin/platform/enterprise-verify-config/records', method: 'get', params });
}

export function testEnterpriseVerify(data) {
  return request({ url: '/admin/platform/enterprise-verify-config/test', method: 'post', data });
}
