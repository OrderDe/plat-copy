import Layout from '@/layout';

export default {
  path: '/definition',
  component: Layout,
  redirect: '/definition/index',
  name: 'Definition',
  meta: { title: '流程定义', icon: 'clipboard' },
  children: [
    {
      path: 'index',
      component: () => import('@/views/definition/index'),
      name: 'DefinitionIndex',
      meta: { title: '流程定义列表' },
    },
    {
      path: 'model/:deployId?',
      component: () => import('@/views/definition/model'),
      name: 'DefinitionModel',
      meta: {
        title: '流程定义维护',
        activeMenu: '/definition/model',
        noCache: true
      },
      hidden: true,
    }
  ]
};
