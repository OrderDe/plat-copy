import Layout from '@/layout';

const channelRouter = {
  path: '/channel',
  component: Layout,
  redirect: '/channel/order',
  name: 'Channel',
  alwaysShow: true,
  meta: {
    title: '私域渠道',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'order',
      component: () => import('@/views/channel/order/index'),
      name: 'ChannelOrder',
      meta: { title: '渠道订单', icon: '' },
    },
    {
      path: 'list',
      component: () => import('@/views/channel/list/index'),
      name: 'ChannelList',
      meta: { title: '渠道管理', icon: '' },
    },
    {
      path: 'import',
      component: () => import('@/views/channel/import/index'),
      name: 'ChannelImportRecord',
      meta: { title: '导入记录', icon: '' },
    },
  ],
};

export default channelRouter;
