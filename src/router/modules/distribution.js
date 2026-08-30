
import Layout from '@/layout';

const distributionRouter = {
  path: '/distribution',
  component: Layout,
  redirect: '/distribution/distributionconfig',
  name: 'Distribution',
  meta: {
    title: '分销',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/distribution/index'),
      name: 'distributionIndex',
      meta: { title: '分销员管理', icon: '' },
    },
    {
      path: 'distributionconfig',
      component: () => import('@/views/distribution/config/index'),
      name: 'distributionConfig',
      meta: { title: '分销配置', icon: '' },
    },
    // 校园收益联盟。接口在 tjMall-alliance，走网关 /alliance；挂在分销路由下，不新开一级菜单
    {
      path: 'alliance/region',
      component: () => import('@/views/distribution/alliance/region/index'),
      name: 'allianceRegionAgent',
      meta: { title: '区域与代理', icon: '' },
    },
    {
      path: 'alliance/rule',
      component: () => import('@/views/distribution/alliance/rule/index'),
      name: 'allianceCommissionRule',
      meta: { title: '佣金规则', icon: '' },
    },
    {
      path: 'alliance/risk',
      component: () => import('@/views/distribution/alliance/risk/index'),
      name: 'allianceRisk',
      meta: { title: '联盟风控', icon: '' },
    },
    {
      path: 'alliance/config',
      component: () => import('@/views/distribution/alliance/config/index'),
      name: 'allianceConfig',
      meta: { title: '联盟配置', icon: '' },
    },
  ],
};

export default distributionRouter;
