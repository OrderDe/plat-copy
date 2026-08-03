
import Layout from '@/layout';

const merchantRouter = {
  path: '/merchant',
  component: Layout,
  redirect: '/merchant/classify',
  name: 'Merchant',
  meta: {
    title: '商户',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'classify',
      name: 'MerchantAlassify',
      component: () => import('@/views/merchant/classify'),
      meta: { title: '商户分类', icon: '' },
    },
    {
      path: 'list',
      name: 'MerchantList',
      component: () => import('@/views/merchant/list'),
      meta: { title: '商户列表', icon: '' },
    },
    {
      path: 'system',
      name: 'MerchantAystem',
      component: () => import('@/views/merchant/system'),
      meta: { title: '商户菜单管理', icon: '' },
    },
    {
      path: 'application',
      name: 'MerchantApplication',
      component: () => import('@/views/merchant/application'),
      meta: { title: '商户入驻申请', icon: '' },
    },
    {
      path: 'type',
      name: 'MerchantType',
      component: () => import('@/views/merchant/type'),
      meta: {
        title: '店铺类型',
        icon: 'clipboard',
      },
      children: [
        {
          path: 'list',
          component: () => import('@/views/merchant/type/list'),
          name: 'MerchantTypeList',
          meta: { title: '店铺类型', icon: '' },
        },
      ],
    },
    {
      path: 'roleTemplate',
      name: 'RoleTemplate',
      component: () => import('@/views/merchant/roleTemplate/index'),
      meta: { title: '角色管理', icon: '' },
    },
  ],
};

export default merchantRouter;
