import Layout from '@/layout';

/**
 * QDiy 装修路由
 * 与现有 pagediy 路由并存，互不影响
 */
const qdiyRouter = {
  path: '/qdiy',
  component: Layout,
  redirect: '/qdiy/page',
  name: 'QDiy',
  meta: {
    title: '七件事装修',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'page',
      name: 'qdiyPage',
      component: () => import('@/views/qdiy/page/index'),
      meta: { title: '页面装修', noCache: true },
    },
    {
      path: 'editor/:id',
      name: 'qdiyEditor',
      hidden: true,
      component: () => import('@/views/qdiy/editor/index'),
      meta: { title: '页面编辑', noCache: true, activeMenu: '/qdiy/page' },
    },
    {
      path: 'bottomnav',
      name: 'qdiyBottomNav',
      component: () => import('@/views/qdiy/bottomnav/index'),
      meta: { title: '底部导航', noCache: true },
    },
    {
      path: 'setting',
      name: 'qdiySetting',
      component: () => import('@/views/qdiy/setting/index'),
      meta: { title: '全局配置', noCache: true },
    },
    {
      path: 'poster',
      name: 'qdiyPoster',
      component: () => import('@/views/qdiy/poster/index'),
      meta: { title: '海报列表', noCache: true },
    },
    {
      path: 'material',
      name: 'qdiyMaterial',
      component: () => import('@/views/qdiy/material/index'),
      meta: { title: '素材管理', noCache: true },
    },
    {
      path: 'mytemplate',
      name: 'qdiyMyTemplate',
      component: () => import('@/views/qdiy/mytemplate/index'),
      meta: { title: '我的模板', noCache: true },
    },
    {
      path: 'market',
      name: 'qdiyMarket',
      component: () => import('@/views/qdiy/market/index'),
      meta: { title: '模板市场', noCache: true },
    },
  ],
};

export default qdiyRouter;
