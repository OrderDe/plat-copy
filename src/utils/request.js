
import axios from 'axios';
import { MessageBox, Message } from 'element-ui';
import store from '@/store';
import { getToken } from '@/utils/auth';
import SettingMer from '@/utils/settingMer';
import { isPhone } from '@/libs/wechat';
import { isPlatform } from '@/utils/settingMer';

const service = axios.create({
  baseURL: '',
  timeout: 60000, // 过期时间
});

// request interceptor
service.interceptors.request.use(
  (config) => {
    // 发送请求之前做的
    const token = !store.getters.token ? getToken() : store.getters.token;
    if (token) {
      config.headers['Authori-zation'] = token;
    }
    if (/get/i.test(config.method)) {
      config.params = config.params || {};
      config.params.temp = Date.parse(new Date()) / 1000;
    }
    // console.log(config)
    // debugger
    if(!config.baseURL){
      config.baseURL = SettingMer.apiBaseURL;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// response interceptor
service.interceptors.response.use(
  (response) => {
    // 如果是文件下载（blob类型），直接返回
    if (response.config.responseType === 'blob') {
      return response;
    }
    // console.log(response)
    const res = response.data ;
    // if the custom code is not 20000, it is judged as an error.
    if (res.code === 401) {
      // to re-login
      Message.error('无效的会话，或者登录已过期，请重新登录。');
      if (isPlatform) {
        if (window.location.pathname !== '/login') location.href = '/login';
      } else {
        if (window.location.pathname !== '/circle/login') location.href = '/circle/login';
      }
    } else if (res.code === 403) {
      Message.error('没有权限访问。');
    }
    if (res.code !== 200 && res.code !== 401) {
      if (isPhone()) {
        //移动端
        return Promise.reject(res || 'Error');
      }
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000,
      });
      /*
       * reject 必须带上响应体：不少调用方写的是 .catch((res) => res.message)，
       * 空 reject 会让它们在 catch 里再抛一个
       * 「Cannot read properties of undefined (reading 'message')」，
       * 真正的接口错误反而被这条噪音盖住。
       */
      return Promise.reject(res || new Error('Error'));
    } else {
      /*
       * 不能用 res.data || res：data 是 0 / '' / false 这些假值时会整个响应对象漏出去，
       * 调用方拿到的就不是数字而是 {code,message,data}。
       * 批量生成库位一个都没生成（返回 0）时提示「已生成 [object Object] 个库位」，
       * 就是这么来的。只在 data 确实缺席时才回退到整个响应体。
       */
      return res.data === undefined || res.data === null ? res : res.data;
    }
  },
  (error) => {
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000,
    });
    return Promise.reject(error);
  },
);

export default service;
