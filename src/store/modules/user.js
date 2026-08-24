
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

// 过滤已下线的菜单项
function removeHiddenMenus(routes) {
  if (!Array.isArray(routes)) return routes;
  const hiddenTitles = ['物料列表', '购销存数据', '统计管理', '装箱管理', '智能补货', '智能分仓', '循环盘点计划'];
  const hiddenPaths = [
    '/warehouse/material',
    'warehouse/material',
    'material',
    '/material',
    '/warehouse/jdl-logistics',
    '/warehouse/package',
    'warehouse/package',
    '/warehouse/replenish',
    'warehouse/replenish',
    '/warehouse/allocate',
    'warehouse/allocate',
    '/warehouse/stock-check-plan',
    'warehouse/stock-check-plan',
    // 已下线的流程模型、审批案例、消息事件、信号事件页面。
    '/ryFlowAble/activiti',
    '/ryFlowAble/activiti/leave',
    '/ryFlowAble/activiti/message',
    '/ryFlowAble/activiti/signal',
  ];
  return routes.reduce((result, route) => {
    if (!route || hiddenTitles.includes(route.title) || hiddenPaths.includes(route.path)) {
      return result;
    }
    const nextRoute = { ...route };
    if (Array.isArray(route.children)) {
      nextRoute.children = removeHiddenMenus(route.children);
    }
    result.push(nextRoute);
    return result;
  }, []);
}

function getMenusName() {
  const raw = isPlatform
    ? JSON.parse(localStorage.getItem('MerPlatAdmin_MenuList')) || []
    : localStorage.getItem('Circle_Admin_MenuList')
    ? JSON.parse(localStorage.getItem('Circle_Admin_MenuList'))
    : [];
  return removeHiddenMenus(raw);
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
          // qdiy 的菜单是前端注入的，后端 eb_system_menu 里没有对应记录，
          // permissionsList 自然不含 platform:qdiy:*，页面上的按钮会被 v-hasPermi 全部摘掉
          // （表现为「新建页面」「新增海报」「保存」按钮凭空消失）。这里补齐权限标识。
          const qdiyPerms = [];
          ['page', 'nav', 'setting', 'poster', 'material', 'market', 'mytemplate'].forEach((mod) => {
            ['list', 'info', 'save', 'update', 'delete', 'copy', 'sethome', 'setshownav', 'setdefault', 'move', 'receive', 'use'].forEach((act) => {
              qdiyPerms.push(`platform:qdiy:${mod}:${act}`);
            });
          });
          const permissionsList = Array.isArray(data.permissionsList) ? data.permissionsList.concat(qdiyPerms) : qdiyPerms;
          commit('SET_PERMISSIONS', permissionsList); //权限标识
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
          { id: 9010, pid: 9001, title: '审批记录',    icon: '', perms: '', path: '/approvalCenter/records', menuType: 'C', sort: 5, children: [] },
          { id: 9006, pid: 9001, title: '审批统计',    icon: '', perms: '', path: '/approvalCenter/stat', menuType: 'C', sort: 6, children: [] },
          { id: 9007, pid: 9001, title: '审批配置',    icon: '', perms: '', path: '/approvalCenter/config', menuType: 'C', sort: 7, children: [] },
          { id: 9009, pid: 9001, title: '催办短信配置', icon: '', perms: '', path: '/approvalCenter/sms-config',  menuType: 'C', sort: 9, children: [] },
        ],
      };
      if (Array.isArray(accessRoutes) && !accessRoutes.find(r => r && r.path === '/approvalCenter')) {
        accessRoutes.push(approvalCenterMenu);
      }

      // ===== 手动注入「企业四要素核验」到「商户」菜单下 =====
      // 商户入驻时校验企业名称/信用代码/法人姓名/法人身份证,对接阿里云号码百科
      const merchantMenu = Array.isArray(accessRoutes)
        ? accessRoutes.find((r) => r && r.path === '/merchant')
        : null;
      if (merchantMenu && Array.isArray(merchantMenu.children)
        && !merchantMenu.children.find((c) => c && c.path === '/merchant/enterprise-verify')) {
        merchantMenu.children.push({
          id: 9301, pid: merchantMenu.id, title: '企业四要素核验', icon: '',
          perms: '', path: '/merchant/enterprise-verify', menuType: 'C', sort: 900, children: [],
        });
      }

      // ===== 手动注入「字典列表」到「设置」菜单下 =====
      // eb_system_config 里有一批不属于任何设置表单的开关，之前只能改库，这里给个可维护入口
      const settingMenu = Array.isArray(accessRoutes)
        ? accessRoutes.find((r) => r && r.path === '/operation')
        : null;
      if (settingMenu && Array.isArray(settingMenu.children)
        && !settingMenu.children.find((c) => c && c.path === '/operation/dict')) {
        settingMenu.children.push({
          id: 9201, pid: settingMenu.id, title: '字典列表', icon: '',
          perms: '', path: '/operation/dict', menuType: 'C', sort: 900, children: [],
        });
      }

      // 过滤已下线的菜单（物料列表、购销存数据、统计管理）
      accessRoutes = removeHiddenMenus(accessRoutes);

      const warehouseMenu = {
        id: 9101, pid: 0, title: '仓库管理', icon: 'shopping',
        perms: '', path: '/warehouse', menuType: 'M', sort: 998,
        children: [
          // ============ 基础配置 ============
          {
            id: 9140, pid: 9101, title: '基础配置', icon: 'setting', perms: '',
            path: '/warehouse/basic', menuType: 'M', sort: 1, children: [
              { id: 9102, pid: 9140, title: '仓库列表',     icon: '', perms: '', path: '/warehouse/warehouse-list', menuType: 'C', sort: 1, children: [] },
              { id: 9120, pid: 9140, title: '货架管理',     icon: '', perms: '', path: '/warehouse/shelf',          menuType: 'C', sort: 2, children: [] },
              { id: 9121, pid: 9140, title: '批次管理',     icon: '', perms: '', path: '/warehouse/batch',          menuType: 'C', sort: 3, children: [] },
              { id: 9136, pid: 9140, title: '单据编号规则', icon: '', perms: '', path: '/warehouse/no-rule',        menuType: 'C', sort: 4, children: [] },
              { id: 9137, pid: 9140, title: '打印模板',     icon: '', perms: '', path: '/warehouse/print',          menuType: 'C', sort: 5, children: [] },
              { id: 9138, pid: 9140, title: '仓储字典',     icon: '', perms: '', path: '/warehouse/dict',           menuType: 'C', sort: 6, children: [] },
            ],
          },
          // ============ 入库业务 ============
          {
            id: 9141, pid: 9101, title: '入库业务', icon: 'download', perms: '',
            path: '/warehouse/in', menuType: 'M', sort: 2, children: [
              { id: 9103, pid: 9141, title: '入库管理',   icon: '', perms: '', path: '/warehouse/inbound', menuType: 'C', sort: 2, children: [] },
              { id: 9110, pid: 9141, title: '质检管理',   icon: '', perms: '', path: '/warehouse/inspect', menuType: 'C', sort: 3, children: [] },
            ],
          },
          // ============ 出库业务 ============
          {
            id: 9142, pid: 9101, title: '出库业务', icon: 'upload', perms: '',
            path: '/warehouse/out', menuType: 'M', sort: 3, children: [
              { id: 9104, pid: 9142, title: '出库管理', icon: '', perms: '', path: '/warehouse/outbound', menuType: 'C', sort: 1, children: [] },
              { id: 9125, pid: 9142, title: '波次与拣货', icon: '', perms: '', path: '/warehouse/wave',    menuType: 'C', sort: 2, children: [] },
              // 复核管理已并入「波次与拣货」的拣货单操作列（拣完当场复核），不再单列菜单
              // { id: 9127, pid: 9142, title: '复核管理', icon: '', perms: '', path: '/warehouse/review',  menuType: 'C', sort: 4, children: [] },
              { id: 9147, pid: 9142, title: '出库交接', icon: '', perms: '', path: '/warehouse/handover', menuType: 'C', sort: 6, children: [] },
              { id: 9148, pid: 9142, title: '交接异常', icon: '', perms: '', path: '/warehouse/handover-exception', menuType: 'C', sort: 7, children: [] },
              { id: 9149, pid: 9142, title: '仓储同步异常', icon: '', perms: '', path: '/warehouse/sync-fail', menuType: 'C', sort: 8, children: [] },
            ],
          },
          // ============ 库内作业 ============
          {
            id: 9143, pid: 9101, title: '库内作业', icon: 'operation', perms: '',
            path: '/warehouse/operation', menuType: 'M', sort: 4, children: [
              { id: 9122, pid: 9143, title: '上架/移库/补货', icon: '', perms: '', path: '/warehouse/relocate', menuType: 'C', sort: 1, children: [] },
            ],
          },
          // ============ 库存与盘点 ============
          {
            id: 9144, pid: 9101, title: '库存与盘点', icon: 'list', perms: '',
            path: '/warehouse/stock-group', menuType: 'M', sort: 5, children: [
              { id: 9106, pid: 9144, title: '库存管理',       icon: '', perms: '', path: '/warehouse/stock',            menuType: 'C', sort: 1, children: [] },
              { id: 9114, pid: 9144, title: '盘点列表',       icon: '', perms: '', path: '/warehouse/stock-check',      menuType: 'C', sort: 2, children: [] },
            ],
          },
          // ============ 单据审批 ============
          {
            id: 9145, pid: 9101, title: '单据审批', icon: 'document', perms: '',
            path: '/warehouse/apply', menuType: 'M', sort: 6, children: [
              { id: 9107, pid: 9145, title: '报损管理',   icon: '', perms: '', path: '/warehouse/damage',   menuType: 'C', sort: 1, children: [] },
              { id: 9108, pid: 9145, title: '领用申请单', icon: '', perms: '', path: '/warehouse/receive',  menuType: 'C', sort: 2, children: [] },
              { id: 9109, pid: 9145, title: '调拨申请单', icon: '', perms: '', path: '/warehouse/transfer', menuType: 'C', sort: 3, children: [] },
              { id: 9110, pid: 9145, title: '退库申请单', icon: '', perms: '', path: '/warehouse/return',   menuType: 'C', sort: 4, children: [] },
            ],
          },
          // ============ 统计分析 ============
          {
            id: 9146, pid: 9101, title: '统计分析', icon: 'chart', perms: '',
            path: '/warehouse/report', menuType: 'M', sort: 7, children: [
              { id: 9131, pid: 9146, title: '总览看板',   icon: '', perms: '', path: '/warehouse/dashboard',   menuType: 'C', sort: 1, children: [] },
              { id: 9132, pid: 9146, title: '库龄分析',   icon: '', perms: '', path: '/warehouse/aging',       menuType: 'C', sort: 2, children: [] },
              { id: 9133, pid: 9146, title: '呆滞库存',   icon: '', perms: '', path: '/warehouse/slow-moving', menuType: 'C', sort: 3, children: [] },
              { id: 9134, pid: 9146, title: '周转率分析', icon: '', perms: '', path: '/warehouse/turnover',    menuType: 'C', sort: 4, children: [] },
              { id: 9135, pid: 9146, title: '成本核算',   icon: '', perms: '', path: '/warehouse/cost',        menuType: 'C', sort: 5, children: [] },
            ],
          },
        ],
      };
      if (Array.isArray(accessRoutes) && !accessRoutes.find(r => r && r.path === '/warehouse')) {
        accessRoutes.push(warehouseMenu);
      }

      // ===== 京东物流：从“仓库管理/出库业务”迁移为平台一级父目录 =====
      const jdlLogisticsMenu = {
        id: 9250, pid: 0, title: '京东物流', icon: 'shopping',
        perms: '', path: '/jdl-logistics', menuType: 'M', sort: 996,
        children: [
          { id: 9251, pid: 9250, title: '物流工作台', icon: '', perms: '', path: '/jdl-logistics/workbench', menuType: 'C', sort: 1, children: [] },
        ],
      };
      if (Array.isArray(accessRoutes) && !accessRoutes.find(r => r && r.path === '/jdl-logistics')) {
        accessRoutes.push(jdlLogisticsMenu);
      }

      // ===== 手动注入 "推荐管理" 菜单 =====
      // 和审批中心、仓库管理一样：后端菜单表里没有这几项，菜单接口自然不会返回，
      // 只加 router/modules 里的静态路由的话页面能直接访问但侧边栏看不到。
      const recommendMenu = {
        id: 9201, pid: 0, title: '推荐管理', icon: 'clipboard',
        perms: '', path: '/recommend', menuType: 'M', sort: 997,
        children: [
          { id: 9202, pid: 9201, title: '猜你喜欢设置', icon: '', perms: '', path: '/recommend/config', menuType: 'C', sort: 1, children: [] },
        ],
      };
      if (Array.isArray(accessRoutes) && !accessRoutes.find(r => r && r.path === '/recommend')) {
        accessRoutes.push(recommendMenu);
      }

      // ===== 手动注入 "商城装修" (qdiy) 菜单 =====
      // 同推荐管理：eb_system_menu 里没有 qdiy 记录，只加 router/modules/qdiy.js
      // 的话页面能直接访问但侧边栏不显示。与旧的 pagediy「装修」并存。
      const qdiyMenu = {
        id: 9400, pid: 0, title: '七件事装修', icon: 'clipboard',
        perms: '', path: '/qdiy', menuType: 'M', sort: 995,
        children: [
          // 装修入口的总览页。底部导航 / 全局配置 / 个人中心 / 商品分类 / 购物车
          // 原本各占一个菜单，六个平级入口看不出「App 哪些地方能装修、现在生效的是哪套」，
          // 统一收进工作台。下面被注释掉的那几条路由都还在，旧链接和收藏仍可直达。
          { id: 9411, pid: 9400, title: '装修工作台', icon: '', perms: '', path: '/qdiy/workbench', menuType: 'C', sort: 1, children: [] },
          { id: 9401, pid: 9400, title: '页面装修', icon: '', perms: '', path: '/qdiy/page',       menuType: 'C', sort: 2, children: [] },
          // { id: 9402, pid: 9400, title: '底部导航', icon: '', perms: '', path: '/qdiy/bottomnav',  menuType: 'C', sort: 2, children: [] },
          // { id: 9403, pid: 9400, title: '全局配置', icon: '', perms: '', path: '/qdiy/setting',    menuType: 'C', sort: 3, children: [] },
          // { id: 9408, pid: 9400, title: '个人中心', icon: '', perms: '', path: '/qdiy/usercenter', menuType: 'C', sort: 4, children: [] },
          // 商品分类、购物车：主体写死、只能在上下加装修，页面由 SQL 预置，
          // 菜单点进去直接跳对应页面的编辑器（views/qdiy/fixedpage）
          // { id: 9409, pid: 9400, title: '商品分类', icon: '', perms: '', path: '/qdiy/goods-cate',    menuType: 'C', sort: 5, children: [] },
          // { id: 9410, pid: 9400, title: '购物车',   icon: '', perms: '', path: '/qdiy/shopping-cart', menuType: 'C', sort: 6, children: [] },
          { id: 9404, pid: 9400, title: '海报列表', icon: '', perms: '', path: '/qdiy/poster',     menuType: 'C', sort: 7, children: [] },
          { id: 9405, pid: 9400, title: '素材管理', icon: '', perms: '', path: '/qdiy/material',   menuType: 'C', sort: 8, children: [] },
          { id: 9406, pid: 9400, title: '我的模板', icon: '', perms: '', path: '/qdiy/mytemplate', menuType: 'C', sort: 9, children: [] },
          { id: 9407, pid: 9400, title: '模板市场', icon: '', perms: '', path: '/qdiy/market',     menuType: 'C', sort: 10, children: [] },
        ],
      };
      if (Array.isArray(accessRoutes) && !accessRoutes.find(r => r && r.path === '/qdiy')) {
        accessRoutes.push(qdiyMenu);
      }

      // ===== 手动注入 "发货记录" 到订单菜单下 =====
      // 同上：静态路由只保证 /order/shipRecord 能直接访问，侧边栏得自己挂。
      // 挂在订单菜单下而不是顶级——它记录的是订单的发货决策，不是仓储作业。
      if (Array.isArray(accessRoutes)) {
        const shipRecordItem = {
          id: 9301, pid: 0, title: '发货记录', icon: '',
          perms: 'platform:order:ship:record:list',
          path: '/order/shipRecord', menuType: 'C', sort: 99, children: [],
        };
        const flat = [];
        accessRoutes.forEach(r => { flat.push(r); (r && r.children || []).forEach(c => flat.push(c)); });
        if (!flat.find(m => m && m.path === '/order/shipRecord')) {
          // 订单菜单的 path 由后端菜单表决定，匹配不到就退而挂成顶级，
          // 宁可位置不理想，也好过菜单静默消失
          const orderMenu = accessRoutes.find(r => r && (r.path === '/order' || r.title === '订单'));
          if (orderMenu) {
            if (!Array.isArray(orderMenu.children)) orderMenu.children = [];
            shipRecordItem.pid = orderMenu.id;
            orderMenu.children.push(shipRecordItem);
          } else {
            accessRoutes.push({
              id: 9300, pid: 0, title: '发货记录', icon: 'clipboard',
              perms: '', path: '/order', menuType: 'M', sort: 996,
              children: [shipRecordItem],
            });
          }
        }
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
