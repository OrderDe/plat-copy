import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

const baseURL = SettingMer.apiBaseURL2;

export function getEnterpriseVerifyConfig() {
  return request({ url: '/flowable/enterprise-verify-config', method: 'get', baseURL });
}

export function saveEnterpriseVerifyConfig(data) {
  return request({ url: '/flowable/enterprise-verify-config', method: 'put', data, baseURL });
}

export function getEnterpriseVerifyRecords(params) {
  return request({ url: '/flowable/enterprise-verify-config/records', method: 'get', params, baseURL });
}

export function testEnterpriseVerify(params) {
  return request({ url: '/flowable/enterprise-verify-config/test', method: 'post', params, baseURL });
}
