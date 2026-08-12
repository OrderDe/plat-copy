

import router from './router';
import store from './store';
import { Message } from 'element-ui';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style
import { getToken } from '@/utils/auth'; // get token from cookie
import getPageTitle from '@/utils/get-page-title';
import { isPlatform } from './utils/settingMer';

NProgress.configure({ showSpinner: false }); // NProgress Configuration

const whiteList = ['/login', '/circle/login', '/auth-redirect']; // no redirect whitelist

// 无需权限校验的公共路由（基础页面、错误页、上传组件等）
const publicPaths = [
  // '/dashboard',
  // '/circle/dashboard',
  '/404',
  '/401',
  '/redirect',
  '/setting/uploadPicture',
  '/page/design/creatDevise',
];

// 已下线的流程案例页面；审批中心不在此列表中，继续保留。
const removedPlatformPaths = [
  '/ryFlowAble/activiti',
  '/ryFlowAble/activiti/leave',
  '/ryFlowAble/activiti/message',
  '/ryFlowAble/activiti/signal',
];

/**
 * 路由前缀 → 所需权限标识映射
 * 当菜单数据不完整时，通过用户 permissions 数组兜底校验
 */
const routePermsMap = {
  '/user': ['platform:user:page:list'],
  '/product': ['platform:product:page:list'],
  '/merchant': ['platform:merchant:page:list'],
  '/order': ['platform:order:page:list'],
  '/marketing': [], // 子路由各自判断
  '/marketing/sign': ['platform:sign:get:config'],
  '/marketing/seckill': ['platform:seckill:list'],
  '/marketing/coupon': ['platform:coupon:list'],
  '/operation/setting': ['platform:system:form:info'],
  '/distribution': ['platform:retail:store:config:get'],
  '/finance': ['platform:finance:daily:statement:page:list'],
};

/**
 * 从菜单树中递归提取所有可访问的路径
 * @param {Array} menuList - 菜单树数据
 * @returns {Array} 路径数组
 */
function getAccessiblePaths(menuList) {
  if (!menuList || !Array.isArray(menuList)) return [];
  const paths = [];
  function traverse(items) {
    items.forEach((item) => {
      if (item.path) paths.push(item.path);
      if (item.children && item.children.length) {
        traverse(item.children);
      }
    });
  }
  traverse(menuList);
  return paths;
}

/**
 * 检查用户 permissions 数组中是否包含指定路由所需的权限
 * @param {string} toPath - 目标路径
 * @param {Array} permissions - 用户权限标识数组
 * @returns {boolean}
 */
function checkPermsForRoute(toPath, permissions) {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes('*:*:*')) return true;

  // 按路径长度降序匹配，优先精确匹配
  const sortedKeys = Object.keys(routePermsMap).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (toPath === key || toPath.startsWith(key + '/') || toPath.startsWith(key + '?')) {
      const requiredPerms = routePermsMap[key];
      if (!requiredPerms || requiredPerms.length === 0) return true;
      return requiredPerms.some((p) => permissions.includes(p));
    }
  }
  // 未命中映射表的路径不拦截（可能是未收录的新路由）
  return true;
}

/**
 * 路由级权限校验（菜单路径 + permissions 双重校验）
 * @param {string} toPath - 目标路径
 * @param {Array} accessiblePaths - 菜单中的可访问路径
 * @param {Array} permissions - 用户权限标识数组
 * @returns {boolean}
 */
function checkRoutePermission(toPath, accessiblePaths, permissions) {
  // 公共页面直接放行
  if (publicPaths.some((p) => toPath === p || toPath.startsWith(p + '/'))) {
    return true;
  }

  // 菜单路径匹配
  const inMenu = accessiblePaths && accessiblePaths.length > 0 &&
    accessiblePaths.some((path) =>
      toPath === path || toPath.startsWith(path + '/') ||
      (path.startsWith(toPath + '/') && toPath !== '/')
    );

  if (inMenu) return true;

  // 菜单数据为空时不拦截（首次加载）
  if (!accessiblePaths || accessiblePaths.length === 0) return true;

  // 菜单中未匹配 → 通过 permissions 数组兜底校验
  return checkPermsForRoute(toPath, permissions);
}

router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start();

  // set page title
  document.title = getPageTitle(to.meta.title);

  // determine whether the user has logged in
  const hasToken = getToken();
  if (isPlatform && removedPlatformPaths.some((path) => to.path === path || to.path.startsWith(path + '/'))) {
    Message.warning('该流程页面已下线');
    next('/dashboard');
    NProgress.done();
    return;
  }
  if (hasToken) {
    if (to.path === '/login' || to.path === '/circle/login') {
      // if is logged in, redirect to the home page
      next({ path: isPlatform ? '/dashboard' : '/circle/dashboard' });
      NProgress.done();
    } else {
      const hasRoles = isPlatform
        ? store.getters.roles && store.getters.roles.length > 0
        : store.getters.circleRoles && store.getters.circleRoles.length > 0;
      if (hasRoles) {
        // --- 路由级权限校验（菜单路径 + permissions 双重校验）---
        const menuList = store.state.user.menuList;
        const accessiblePaths = getAccessiblePaths(menuList);
        const permissions = isPlatform
          ? store.getters.permissions
          : store.getters.circlePermissions;
        if (checkRoutePermission(to.path, accessiblePaths, permissions)) {
          next();
        } else {
          Message.error('没有权限访问该页面');
          next({ path: '/401', replace: true });
        }
        NProgress.done();
      } else {
        try {
          // 获取用户信息（角色 + 权限标识）
          await store.dispatch('user/getInfo');
          // 获取菜单数据用于路由级权限校验
          try {
            await store.dispatch('user/getMenus');
          } catch (e) {
            // 菜单加载失败不阻断导航
          }
          next({ ...to, replace: true });
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken');
          Message.error(error || 'Has Error');
          next(isPlatform ? `/login` : `/circle/login`);
          NProgress.done();
        }
      }
    }
  } else {
    /* has no token*/
    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next();
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(isPlatform ? `/login` : `/circle/login`);
      NProgress.done();
    }
  }
});

router.afterEach((to, from) => {
  // finish progress bar
  NProgress.done();
});
