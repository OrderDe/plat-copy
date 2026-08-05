import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

const baseURL = SettingMer.apiBaseURL2;

export function getSmsConfig() {
  return request({ url: '/flowable/sms-config', method: 'get', baseURL });
}

export function saveSmsConfig(data) {
  return request({ url: '/flowable/sms-config', method: 'put', data, baseURL });
}

export function testSms(phone) {
  return request({ url: '/flowable/sms-config/test', method: 'post', params: { phone }, baseURL });
}
