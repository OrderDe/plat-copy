
import { login, logout, getInfo } from '@/api/user';
import { areasLoginApi, areasGetAdminInfoByTokenApi, areasLogoutApi, areasGetMenusApi } from '@/api/area';
import { getToken, setToken, removeToken } from '@/utils/auth';
import router, { resetRouter } from '@/router';
import { isLoginApi } from '@/api/sms';
import Cookies from 'js-cookie';
import { Loading } from 'element-ui';
import * as roleApi from '@/api/roleApi.js';
import { formatFlatteningRoutes } from '@/utils/system.js';
import { isPlatform } from '@/utils/settingMer';
function getMenusName() {
  return isPlatform
    ? JSON.parse(localStorage.getItem('MerPlatAdmin_MenuList')) || []
    : localStorage.getItem('Circle_Admin_MenuList')
    ? JSON.parse(localStorage.getItem('Circle_Admin_MenuList'))
    : [];
}
const state = {
  token: getToken(),
  circleToken: getToken(),
  name: '',
  avatar: '',
  introduction: '',
  roles: [],
  circleRoles: [],
  isLogin: Cookies.get('isLogin'),
  permissions: [],
  circlePermissions: [],
  userInfo: null, // 存储完整的用户信息
  circleUserInfo: null, // 存储完整的用户信息
  captcha: {
    captchaVerification: '',
    secretKey: '',
    token: '',
  }, //滑块验证token
  // 菜单数据
  menuList: getMenusName(),
  oneLvMenus: [],
  circleOneLvMenus: [],
  oneLvRoutes: JSON.parse(localStorage.getItem('MerPlatAdmin_oneLvRoutes')) || [],
  circleOneLvRoutes: JSON.parse(localStorage.getItem('Circle_Admin_oneLvRoutes')) || [],
  childMenuList: [],
  circleChildMenuList: [],
};

const mutations = {
  SET_TOKEN: (state, token) => {
    if (isPlatform) {
      state.token = token;
    } else {
      state.circleToken = token;
    }
  },
  SET_ISLOGIN: (state, isLogin) => {
    state.isLogin = isLogin;
    Cookies.set('isLogin', isLogin);
  },
  SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction;
  },
  SET_NAME: (state, name) => {
    state.name = name;
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar;
  },
  SET_ROLES: (state, roles) => {
    if (isPlatform) {
      state.roles = roles;
    } else {
      state.circleRoles = roles;
    }
  },
  SET_PERMISSIONS: (state, permissions) => {
    if (isPlatform) {
      state.permissions = permissions;
    } else {
      state.circlePermissions = permissions;
    }
  },
  SET_USER_INFO: (state, userInfo) => {
    if (isPlatform) {
      state.userInfo = userInfo;
    } else {
      state.circleUserInfo = userInfo;
    }
  },
  SET_CAPTCHA: (state, captcha) => {
    state.captcha = captcha;
  },
  SET_MENU_LIST: (state, menuList) => {
    if (isPlatform) {
      state.menuList = menuList;
      localStorage.setItem('MerPlatAdmin_MenuList', JSON.stringify(menuList));
    } else {
      for (let i = 0; i < menuList.length; i++) {
        menuList[i].path = '/circle' + menuList[i].path;
        if (!menuList[i].children) {
          continue;
        }
      }
      state.menuList = menuList;
      localStorage.setItem('Circle_Admin_MenuList', JSON.stringify(menuList));
    }
  },
  setOneLvMenus(state, oneLvMenus) {
    if (isPlatform) {
      state.oneLvMenus = oneLvMenus;
    } else {
      for (let i = 0; i < oneLvMenus.length; i++) {
        oneLvMenus[i].path = '/circle' + oneLvMenus[i].path;
      }
      state.circleOneLvMenus = oneLvMenus;
    }
  },
  setOneLvRoute(state, oneLvRoutes) {
    if (isPlatform) {
      state.oneLvRoutes = oneLvRoutes;
    } else {
      state.circleOneLvRoutes = oneLvRoutes;
    }
  },
  childMenuList(state, list) {
    if (isPlatform) {
      state.childMenuList = list;
    }else{
      state.circleChildMenuList = list;
    }
  },
};

const actions = {
  // user login
  login({ commit, dispatch }, userInfo) {
    const { account, pwd, key, code, wxCode } = userInfo;
    Loading.service();
    return new Promise((resolve, reject) => {
      // 根据环境变量判断调用不同的登录API
      const loginApi = isPlatform ? login : areasLoginApi;

      loginApi(userInfo)
        .then((data) => {
          let loadingInstance = Loading.service();
          loadingInstance.close();
          commit('SET_TOKEN', data.token);
          if (isPlatform) {
            Cookies.set('JavaPlatInfo', JSON.stringify(data));
          } else {
            Cookies.set('CircleJavaPlatInfo', JSON.stringify(data));
          }
          setToken(data.token);
          // 清空之前用户的tab缓存，避免权限冲突
          commit('menu/clearAll', null, { root: true });
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // 短信是否登录
  isLogin({ commit }, userInfo) {
    return new Promise((resolve, reject) => {
      isLoginApi()
        .then(async (res) => {
          commit('SET_ISLOGIN', res.isLogin);
          resolve(res);
        })
        .catch((res) => {
          commit('SET_ISLOGIN', false);
          reject(res);
        });
    });
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      // 根据环境变量判断调用不同的获取用户信息API
      const getUserInfoApi = isPlatform ? () => getInfo(state.token) : areasGetAdminInfoByTokenApi;

      getUserInfoApi()
        .then((data) => {
          if (!data) {
            reject('Verification failed, please Login again.');
          }
          const { roles, account } = data;
          // roles must be a non-empty array
          if (!roles || roles.length <= 0) {
            reject('getInfo: roles must be a non-null array!');
          }

          commit('SET_ROLES', roles);
          // commit('SET_ROLES', ['admin'])
          commit('SET_NAME', account);
          // commit('SET_AVATAR', avatar)
          commit('SET_AVATAR', '');
          commit('SET_INTRODUCTION', '');
          commit('SET_PERMISSIONS', data.permissionsList); //权限标识
          commit('SET_USER_INFO', data); // 存储完整的用户信息
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // user logout
  handleLogout({ commit, state, dispatch }) {
    Loading.service();
    return new Promise((resolve, reject) => {
      // 根据环境变量判断调用不同的退出登录API
      const logoutApi = isPlatform ? () => logout(state.token) : areasLogoutApi;

      logoutApi()
        .then(() => {
          let loadingInstance = Loading.service();
          loadingInstance.close();
          commit('SET_TOKEN', '');
          commit('SET_ROLES', []);
          commit('SET_PERMISSIONS', []);
          removeToken();
          // localStorage.clear();
          Cookies.remove('storeStaffList');
          dispatch('tagsView/delAllViews', null, { root: true });
          if (isPlatform) {
            Cookies.remove('JavaPlatInfo');
            sessionStorage.removeItem('token');
            // reset visited views and cached views
            // to fixed https://github.com/PanJiaChen/vue-element-admin/issues/2485
            resetRouter();
            resolve();
          } else {
            Cookies.remove('CircleJavaPlatInfo');
            resetRouter();
            resolve();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // remove token
  resetToken({ commit, dispatch }) {
    return new Promise((resolve) => {
      commit('SET_TOKEN', '');
      commit('SET_ROLES', []);
      removeToken();
      // 清空tab缓存，避免无权限的菜单残留
      commit('menu/clearAll', null, { root: true });
      resolve();
    });
  },
  // 设置token
  setToken({ commit }, state) {
    return new Promise((resolve) => {
      commit('SET_TOKEN', state.token);
      if (isPlatform) {
        Cookies.set('JavaPlatInfo', JSON.stringify(state));
      } else {
        Cookies.set('CircleJavaPlatInfo', JSON.stringify(state));
      }
      setToken(data.token);
      resolve();
    });
  },
  getMenus({ commit }) {
    function formatTwoStageRoutes(arr) {
      if (arr.length <= 0) return false;
      const newArr = [];
      const cacheList = [];
      arr.forEach((v) => {
        if (v && v.meta && v.meta.keepAlive) {
          newArr.push({ ...v });
          cacheList.push(v.name);
          this.$store.dispatch('keepAliveNames/setCacheKeepAlive', cacheList);
        }
      });
      return newArr;
    }

    return new Promise(async (resolve, reject) => {
      // 根据环境变量判断调用不同的获取菜单API
      const getMenuApi = isPlatform ? roleApi.menuListApi : areasGetMenusApi;
      let accessRoutes = await getMenuApi();

      // ===== 手动注入 "审批中心" 菜单 (与 MenusResponse 结构对齐) =====
      const approvalCenterMenu = {
        id: 9001, pid: 0, title: '审批中心', icon: 'clipboard',
        perms: '', path: '/approvalCenter', menuType: 'M', sort: 999,
        children: [
          { id: 9002, pid: 9001, title: '我的待办',    icon: '', perms: '', path: '/approvalCenter/todo', menuType: 'C', sort: 1, children: [] },
          { id: 9003, pid: 9001, title: '我收到的抄送', icon: '', perms: '', path: '/approvalCenter/cc',   menuType: 'C', sort: 2, children: [] },
          { id: 9004, pid: 9001, title: '我发起的',    icon: '', perms: '', path: '/approvalCenter/mine', menuType: 'C', sort: 3, children: [] },
          { id: 9005, pid: 9001, title: '已办结',      icon: '', perms: '', path: '/approvalCenter/done', menuType: 'C', sort: 4, children: [] },
          { id: 9006, pid: 9001, title: '审批统计',    icon: '', perms: '', path: '/approvalCenter/stat', menuType: 'C', sort: 5, children: [] },
          { id: 9007, pid: 9001, title: '审批流配置',  icon: '', perms: '', path: '/approvalCenter/config', menuType: 'C', sort: 6, children: [] },
          { id: 9008, pid: 9001, title: '审批场景配置', icon: '', perms: '', path: '/approvalCenter/scene',  menuType: 'C', sort: 7, children: [] },
          { id: 9009, pid: 9001, title: '催办短信配置', icon: '', perms: '', path: '/approvalCenter/sms-config',  menuType: 'C', sort: 8, children: [] },
        ],
      };
      if (Array.isArray(accessRoutes) && !accessRoutes.find(r => r && r.path === '/approvalCenter')) {
        accessRoutes.push(approvalCenterMenu);
      }

      // ===== 手动注入 "仓储物流" 菜单 =====
      const warehouseMenu = {
        id: 9101, pid: 0, title: '仓库管理', icon: 'shopping',
        perms: '', path: '/warehouse', menuType: 'M', sort: 998,
        children: [
          { id: 9102, pid: 9101, title: '仓库列表',     icon: '', perms: '', path: '/warehouse/warehouse-list', menuType: 'C', sort: 1, children: [] },
          { id: 9103, pid: 9101, title: '入库管理',     icon: '', perms: '', path: '/warehouse/inbound',        menuType: 'C', sort: 2, children: [] },
          { id: 9104, pid: 9101, title: '出库管理',     icon: '', perms: '', path: '/warehouse/outbound',       menuType: 'C', sort: 3, children: [] },
          { id: 9105, pid: 9101, title: '物料列表',     icon: '', perms: '', path: '/warehouse/material',       menuType: 'C', sort: 4, children: [] },
          { id: 9106, pid: 9101, title: '库存管理',     icon: '', perms: '', path: '/warehouse/stock',          menuType: 'C', sort: 5, children: [] },
          { id: 9107, pid: 9101, title: '报损管理',     icon: '', perms: '', path: '/warehouse/damage',         menuType: 'C', sort: 6, children: [] },
          { id: 9108, pid: 9101, title: '领用申请单',   icon: '', perms: '', path: '/warehouse/receive',        menuType: 'C', sort: 7, children: [] },
          { id: 9109, pid: 9101, title: '调拨申请单',   icon: '', perms: '', path: '/warehouse/transfer',       menuType: 'C', sort: 8, children: [] },
          { id: 9110, pid: 9101, title: '退库申请单',   icon: '', perms: '', path: '/warehouse/return',         menuType: 'C', sort: 9, children: [] },
          { id: 9111, pid: 9101, title: '采购发货单',   icon: '', perms: '', path: '/warehouse/deliver',        menuType: 'C', sort: 10, children: [] },
          { id: 9112, pid: 9101, title: '效期预警',     icon: '', perms: '', path: '/warehouse/expiry',         menuType: 'C', sort: 11, children: [] },
          { id: 9113, pid: 9101, title: '购销存数据',   icon: '', perms: '', path: '/warehouse/pss',            menuType: 'C', sort: 12, children: [] },
          { id: 9114, pid: 9101, title: '盘点列表',     icon: '', perms: '', path: '/warehouse/stock-check',    menuType: 'C', sort: 13, children: [] },
          { id: 9115, pid: 9101, title: '统计管理',     icon: '', perms: '', path: '/warehouse/stats',          menuType: 'C', sort: 14, children: [] },
        ],
      };
      if (Array.isArray(accessRoutes) && !accessRoutes.find(r => r && r.path === '/warehouse')) {
        accessRoutes.push(warehouseMenu);
      }
      // ===== 注入结束 =====

      // let accessRoutes = formatRoutes(menusAll);
      // const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true });
      commit('SET_MENU_LIST', accessRoutes);
      if (isPlatform) {
        let arr = formatFlatteningRoutes(router.options.routes);
        formatTwoStageRoutes(arr);
        let routes = formatFlatteningRoutes(accessRoutes);
        localStorage.setItem('MerPlatAdmin_oneLvRoutes', JSON.stringify(routes));
        commit('setOneLvMenus', arr);
        commit('setOneLvRoute', routes);
      } else {
        let arr = formatFlatteningRoutes(router.options.routes);
        formatTwoStageRoutes(arr);
        let routes = formatFlatteningRoutes(accessRoutes);
        for (let i = 0; i < routes.length; i++) {
          // 第一个/后的单词不为circle，添加/circle
          if (routes[i].path && routes[i].path.split('/')[1] !== 'circle') {
            routes[i].path = '/circle' + routes[i].path;
          }
        }
        localStorage.setItem('Circle_Admin_oneLvRoutes', JSON.stringify(routes));
      }
      resolve(resolve);
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
