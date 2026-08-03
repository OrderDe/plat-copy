
import Layout from '@/layout';

const flowableRouter = {
  path: '/flowable/',
  component: Layout,
  redirect: '/flowable/definition',
  name: 'flowable',
  meta: {
    title: '流程',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'expression',
      name: 'Expression',
      meta: {
        title: '表达式',
        noCache: true,
      },
      component: () => import('@/views/flowable/expression/index'),
    },
    {
      path: 'definition',
      component: () => import('@/views/flowable/definition/index'),
      name: 'FlowableDefinition',
      meta: { title: '流程定义', icon: '' },
    },
    {
      path: 'definition/model',
      component: () => import('@/views/flowable/definition/model'),
      name: 'FlowableDefinitionModel',
      meta: { title: '流程模型', icon: '' },
    },
    {
      path: 'listener',
      component: () => import('@/views/flowable/listener/index'),
      name: 'FlowableListener',
      meta: { title: '监听器配置', icon: '' },
    },
    {
      path: 'task/finished',
      component: () => import('@/views/flowable/task/finished/index'),
      name: 'FinishedTask',
      meta: { title: '已完成任务', icon: '' },
    },
    {
      path: 'task/finishedDetail',
      component: () => import('@/views/flowable/task/finished/detail/index'),
      name: 'FinishedTaskDetail',
      meta: { title: '已完成任务详情', icon: '' },
    },
    {
      path: 'task/flowForm',
      component: () => import('@/views/flowable/task/flowForm/index'),
      name: 'FlowForm',
      meta: { title: '流程表单', icon: '' },
    },
    {
      path: 'task/form',
      component: () => import('@/views/flowable/task/form/index'),
      name: 'Form',
      meta: { title: '表单', icon: '' },
    },
    {
      path: 'task/myProcess',
      component: () => import('@/views/flowable/task/myProcess/index'),
      name: 'MyProcess',
      meta: { title: '我的流程', icon: '' },
    },
    {
      path: 'task/send',
      component: () => import('@/views/flowable/task/myProcess/send/index'),
      name: 'SendProcess',
      meta: { title: '发送流程', icon: '' },
    },
    {
      path: 'task/processDetail',
      component: () => import('@/views/flowable/task/myProcess/detail/index'),
      name: 'ProcessDetail',
      meta: { title: '流程详情', icon: '' },
    },
    {
      path: 'task/todo',
      component: () => import('@/views/flowable/task/todo/index'),
      name: 'TodoTask',
      meta: { title: '待办任务', icon: '' },
    },
    {
      path: 'task/todoDetail',
      component: () => import('@/views/flowable/task/todo/detail/index'),
      name: 'TodoTaskDetail',
      meta: { title: '待办任务详情', icon: '' },
    },
  ],
};

export default flowableRouter;
