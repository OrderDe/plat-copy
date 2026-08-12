import Layout from '@/layout';

const approvalCenterRouter = {
  path: '/approvalCenter',
  component: Layout,
  redirect: '/approvalCenter/todo',
  name: 'ApprovalCenter',
  meta: { title: '审批中心', icon: 'clipboard' },
  children: [
    {
      path: 'todo',
      name: 'ApprovalTodo',
      component: () => import('@/views/approvalCenter/todo'),
      meta: { title: '我的待办', noCache: true },
    },
    {
      path: 'cc',
      name: 'ApprovalCc',
      component: () => import('@/views/approvalCenter/cc'),
      meta: { title: '我收到的抄送', noCache: true },
    },
    {
      path: 'mine',
      name: 'ApprovalMine',
      component: () => import('@/views/approvalCenter/mine'),
      meta: { title: '我发起的', noCache: true },
    },
    {
      path: 'done',
      name: 'ApprovalDone',
      component: () => import('@/views/approvalCenter/done'),
      meta: { title: '已办结', noCache: true },
    },
    {
      path: 'records',
      name: 'ApprovalRecords',
      component: () => import('@/views/approvalCenter/records'),
      meta: { title: '审批记录', noCache: true },
    },
    {
      path: 'stat',
      name: 'ApprovalStat',
      component: () => import('@/views/approvalCenter/stat'),
      meta: { title: '审批统计', noCache: true },
    },
    {
      path: 'config',
      name: 'ApprovalConfig',
      component: () => import('@/views/approvalCenter/config'),
      meta: { title: '审批配置', noCache: true },
    },
    {
      path: 'config/detail/:flowKey',
      name: 'ApprovalConfigDetail',
      component: () => import('@/views/approvalCenter/configDetail'),
      hidden: true,
      meta: { title: '流程设计', noCache: true, activeMenu: '/approvalCenter/config' },
    },
    {
      // 场景配置已合并进「审批配置」，旧地址重定向，避免收藏/历史链接失效
      path: 'scene',
      redirect: '/approvalCenter/config',
      hidden: true,
      meta: { title: '审批配置', noCache: true, activeMenu: '/approvalCenter/config' },
    },
    {
      path: 'sms-config',
      name: 'ApprovalSmsConfig',
      component: () => import('@/views/approvalCenter/smsConfig'),
      meta: { title: '催办短信配置', noCache: true },
    },
    {
      path: 'detail/:id',
      name: 'ApprovalDetail',
      component: () => import('@/views/approvalCenter/detail'),
      hidden: true,
      meta: { title: '审批详情', noCache: true, activeMenu: '/approvalCenter/todo' },
    },
  ],
};

export default approvalCenterRouter;
