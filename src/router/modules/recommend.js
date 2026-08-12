import Layout from '@/layout';

const recommendRouter = {
  path: '/recommend',
  component: Layout,
  redirect: '/recommend/config',
  name: 'Recommend',
  meta: {
    title: '推荐管理',
    icon: 'clipboard',
  },
  children: [
    {
      // 子路由用绝对路径，和仓储/审批中心的写法保持一致，
      // 注入菜单里的 path 就是这个值，两边必须对得上
      path: '/recommend/config',
      name: 'RecommendConfig',
      component: () => import('@/views/recommend/config'),
      meta: { title: '猜你喜欢设置', noCache: true },
    },
  ],
};

export default recommendRouter;
