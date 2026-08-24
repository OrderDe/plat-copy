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
    /**
     * 装修工作台：所有装修入口的总览。
     * 底部导航 / 全局配置 / 个人中心 / 商品分类 / 购物车原本各占一个菜单，
     * 六个平级入口很难看出「App 哪些地方能装修」，收进这里统一进。
     * 它们的路由都保留着，旧链接和收藏仍然直达。
     */
    {
      path: 'workbench',
      name: 'qdiyWorkbench',
      component: () => import('@/views/qdiy/workbench/index'),
      meta: { title: '装修工作台', noCache: true },
    },
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
      path: 'usercenter',
      name: 'qdiyUserCenter',
      component: () => import('@/views/qdiy/usercenter/index'),
      meta: { title: '个人中心', noCache: true },
    },
    /**
     * 商品分类、购物车是「一个类型只有一个页面」，页面由 SQL 预置、不能新建也不能删。
     * 给它们各开一个菜单直接进编辑器，和「个人中心」的组织方式保持一致，
     * 不用去「页面装修」列表里翻。meta.template 指明进哪个页面。
     */
    {
      path: 'goods-cate',
      name: 'qdiyGoodsCate',
      component: () => import('@/views/qdiy/fixedpage/index'),
      meta: { title: '商品分类', noCache: true, template: 'goods_cate' },
    },
    {
      path: 'shopping-cart',
      name: 'qdiyShoppingCart',
      component: () => import('@/views/qdiy/fixedpage/index'),
      meta: { title: '购物车', noCache: true, template: 'shopping_cart' },
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
