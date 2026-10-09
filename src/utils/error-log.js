
import Vue from 'vue';
import store from '@/store';
import { isString, isArray } from '@/utils/validate';
import settings from '@/settings';

// you can set in settings.js
// errorLog:'production' | ['production', 'development']
const { errorLog: needErrorLog } = settings;

function checkNeed() {
  const env = process.env.NODE_ENV;
  if (isString(needErrorLog)) {
    return env === needErrorLog;
  }
  if (isArray(needErrorLog)) {
    return needErrorLog.includes(env);
  }
  return false;
}

if (checkNeed()) {
  Vue.config.errorHandler = function (err, vm, info) {
    // Don't ask me why I use Vue.nextTick, it just a hack.
    // detail see https://forum.vuejs.org/t/dispatch-in-vue-config-errorhandler-has-some-problem/23500
    Vue.nextTick(() => {
      // 只存纯数据，不能把 err / vm 原样放进 Vuex：state 会被递归改成响应式，
      // 一个组件实例连着整棵组件树，主线程直接卡死 —— 提示不消失、按钮点不动，只能刷新（#1422）。
      // async 按钮方法里接口报错（如质检提交库位容量不足）在 Vue 2.6 下也会走到这里。
      store.dispatch('errorLog/addErrorLog', Object.freeze({
        message: (err && (err.message || err.msg)) || String(err),
        stack: (err && err.stack) || '',
        component: (vm && vm.$options && vm.$options.name) || '',
        info,
        url: window.location.href,
      }));
    });
  };
}
