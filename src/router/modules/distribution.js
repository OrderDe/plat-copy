
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
    {
      // 产品分享菜单来自数据库，平台端必须注册同名路由，否则点击会进入 404。
      path: 'product-share',
      component: () => import('@/views/distribution/product-share/ParentView'),
      name: 'productShare',
      meta: { title: '产品分享', icon: '' },
      children: [
        {
          path: 'distributor',
          component: () => import('@/views/distribution/index'),
          name: 'productShareDistributor',
          meta: { title: '分销商列表', icon: '' },
        },
        {
          path: 'settings',
          component: () => import('@/views/distribution/config/index'),
          name: 'productShareSettings',
          meta: { title: '分销设置', icon: '' },
        },
        {
          path: 'withdraw',
          component: () => import('@/views/distribution/product-share/withdraw/index'),
          name: 'productShareWithdraw',
          meta: { title: '分销商提现', icon: '' },
        },
        {
          path: 'makers',
          component: () => import('@/views/distribution/product-share/makers/index'),
          name: 'productShareMakers',
          meta: { title: '创客', icon: '' },
        },
        {
          path: 'maker-withdraw',
          component: () => import('@/views/distribution/product-share/withdraw/index'),
          name: 'productShareMakerWithdraw',
          meta: { title: '创客提现申请', icon: '' },
        },
      ],
    },
    // 校园收益联盟。接口在 tjMall-alliance，走网关 /alliance；挂在分销路由下，不新开一级菜单
    {
      path: 'alliance/region',
      component: () => import('@/views/distribution/alliance/region/index'),
      name: 'allianceRegionAgent',
      meta: { title: '区域与代理', icon: '' },
    },
    {
      // 成为团长的条件。条件还没定下来，所以做成规则表而不是几个写死的配置项，
      // 运营自由增删改，不用等发版
      path: 'alliance/leader-apply-rule',
      component: () => import('@/views/distribution/alliance/leader-apply-rule/index'),
      name: 'allianceLeaderApplyRule',
      meta: { title: '团长申请条件', icon: '' },
    },
    {
      path: 'alliance/leader',
      component: () => import('@/views/distribution/alliance/leader/index'),
      name: 'allianceLeader',
      meta: { title: '团长业绩', icon: '' },
    },
    {
      // 平台端分销商品总览：跨商户只读 + 强制停用。菜单是既有的 3151，
      // 它指向的旧「平台给商户配分销」页删掉后一直是隐藏状态，这次按新用途重建
      path: 'alliance/distribution-product',
      component: () => import('@/views/distribution/alliance/distribution-product/index'),
      name: 'allianceDistributionProduct',
      meta: { title: '分销商品', icon: '' },
    },
    {
      path: 'alliance/commission',
      component: () => import('@/views/distribution/alliance/commission/index'),
      name: 'allianceCommission',
      meta: { title: '分账明细', icon: '' },
    },
    {
      path: 'alliance/withdraw',
      component: () => import('@/views/distribution/alliance/withdraw/index'),
      name: 'allianceWithdraw',
      meta: { title: '团长提现', icon: '' },
    },
    {
      path: 'alliance/verify-limit',
      component: () => import('@/views/distribution/alliance/verify-limit/index'),
      name: 'allianceVerifyLimit',
      meta: { title: '核销限额', icon: '' },
    },
    {
      path: 'alliance/points',
      component: () => import('@/views/distribution/alliance/points/index'),
      name: 'alliancePoints',
      meta: { title: '积分对账', icon: '' },
    },
    {
      path: 'alliance/verify',
      component: () => import('@/views/distribution/alliance/verify/index'),
      name: 'allianceVerifyRecords',
      meta: { title: '核销记录', icon: '' },
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
