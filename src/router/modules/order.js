
import Layout from '@/layout';

const orderRouter = {
  path: '/order',
  component: Layout,
  redirect: '/order/list',
  name: 'Order',
  alwaysShow: true,
  meta: {
    title: '订单',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'list',
      component: () => import('@/views/order/index'),
      name: 'OrderIndex',
      meta: { title: '订单' },
    },
    {
      path: 'refund',
      component: () => import('@/views/order/refund'),
      name: 'refund',
      meta: { title: '退款单' },
    },
  ],
};

export default orderRouter;
