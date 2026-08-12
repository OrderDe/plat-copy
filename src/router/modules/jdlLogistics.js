import Layout from '@/layout';

const jdlLogisticsRouter = {
  path: '/jdl-logistics',
  component: Layout,
  redirect: '/jdl-logistics/workbench',
  name: 'JdlLogistics',
  meta: {
    title: '京东物流',
    icon: 'shopping',
  },
  children: [
    {
      path: 'workbench',
      component: () => import('@/views/warehouse/jdlLogistics'),
      name: 'JdlLogisticsWorkbench',
      meta: { title: '物流工作台', noCache: true },
    },
    {
      path: '/warehouse/jdl-logistics',
      redirect: '/jdl-logistics/workbench',
      hidden: true,
    },
  ],
};

export default jdlLogisticsRouter;
