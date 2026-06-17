
import Layout from '@/layout';

const yytRouter = {
  path: '/yyt',
  component: Layout,
  redirect: '/yyt/goods',
  name: 'Yyt',
  meta: {
    title: '怡亚通管理',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'category',
      name: 'YytCategory',
      component: () => import('@/views/yyt/category/index.vue'),
      meta: { title: '分类管理', noCache: true },
    },
    {
      path: 'yytcategory',
      name: 'YytNewCategory',
      component: () => import('@/views/yyt/category/category.vue'),
      meta: { title: '分类管理(接口2)', noCache: true },
    },
    {
      path: 'goods',
      name: 'YytGoods',
      component: () => import('@/views/yyt/goods'),
      meta: { title: '商品列表', noCache: true },
    },
    {
      path: 'selection',
      name: 'YytSelection',
      component: () => import('@/views/yyt/selection'),
      meta: { title: '选品列表', noCache: true },
    },
    {
      path: 'order',
      name: 'YytOrder',
      component: () => import('@/views/yyt/order'),
      meta: { title: '订单管理', noCache: true },
    },
    {
      path: 'afterSale',
      name: 'YytAfterSale',
      component: () => import('@/views/yyt/afterSale'),
      meta: { title: '售后管理', noCache: true },
    },
    {
      path: 'notifyLog',
      name: 'YytNotifyLog',
      component: () => import('@/views/yyt/notifyLog'),
      meta: { title: '通知日志', noCache: true },
    },
    {
      path: 'shipTemplate',
      name: 'YytShipTemplate',
      component: () => import('@/views/yyt/shipTemplate'),
      meta: { title: '运费模板', noCache: true },
    },
  ],
};

export default yytRouter;
