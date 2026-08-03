import request from '@/utils/request';
import SettingMer from '@/utils/settingMer';

const flowableRequest = (config) => {
  return request({
    ...config,
    baseURL: SettingMer.apiBaseURL2,
  });
};

export default flowableRequest;
