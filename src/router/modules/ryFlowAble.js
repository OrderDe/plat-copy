// 从 ruo-yi-activiti 移植的流程/系统/监控/工具模块（除登录注册）
// 所有视图均包裹在 views/ryFlowAble 下，路由统一加 /ryFlowAble 前缀，避免与平台原有功能冲突
import Layout from '@/layout'

export default [
  // ===================== 系统管理 =====================
  {
    path: '/ryFlowAble/system',
    component: Layout,
    redirect: '/ryFlowAble/system/user',
    alwaysShow: true,
    name: 'RuyiSystem',
    meta: { title: '系统管理(R)', icon: 'system' },
    children: [
      {
        path: 'user',
        component: () => import('@/views/ryFlowAble/system/user/index'),
        name: 'RuyiUser',
        meta: { title: '用户管理', icon: 'user', activeMenu: '/ryFlowAble/system/user' }
      },
      {
        path: 'role',
        component: () => import('@/views/ryFlowAble/system/role/index'),
        name: 'RuyiRole',
        meta: { title: '角色管理', icon: 'peoples', activeMenu: '/ryFlowAble/system/role' }
      },
      {
        path: 'menu',
        component: () => import('@/views/ryFlowAble/system/menu/index'),
        name: 'RuyiMenu',
        meta: { title: '菜单管理', icon: 'tree', activeMenu: '/ryFlowAble/system/menu' }
      },
      {
        path: 'dept',
        component: () => import('@/views/ryFlowAble/system/dept/index'),
        name: 'RuyiDept',
        meta: { title: '部门管理', icon: 'tree', activeMenu: '/ryFlowAble/system/dept' }
      },
      {
        path: 'post',
        component: () => import('@/views/ryFlowAble/system/post/index'),
        name: 'RuyiPost',
        meta: { title: '岗位管理', icon: 'post', activeMenu: '/ryFlowAble/system/post' }
      },
      {
        path: 'dict',
        component: () => import('@/views/ryFlowAble/system/dict/index'),
        name: 'RuyiDict',
        meta: { title: '字典管理', icon: 'dict', activeMenu: '/ryFlowAble/system/dict' }
      },
      {
        path: 'config',
        component: () => import('@/views/ryFlowAble/system/config/index'),
        name: 'RuyiConfig',
        meta: { title: '参数设置', icon: 'edit', activeMenu: '/ryFlowAble/system/config' }
      },
      {
        path: 'notice',
        component: () => import('@/views/ryFlowAble/system/notice/index'),
        name: 'RuyiNotice',
        meta: { title: '通知公告', icon: 'message', activeMenu: '/ryFlowAble/system/notice' }
      },
      // 个人中心
      {
        path: 'profile',
        component: () => import('@/views/ryFlowAble/system/user/profile/index'),
        name: 'RuyiProfile',
        meta: { title: '个人中心', icon: 'user', activeMenu: '/ryFlowAble/system/user' }
      }
    ]
  },
  // 系统管理 - 隐藏的动态路由（分配角色 / 分配用户 / 字典数据）
  {
    path: '/ryFlowAble/system/user-auth',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/ryFlowAble/system/user/authRole'),
        name: 'RuyiAuthRole',
        meta: { title: '分配角色', activeMenu: '/ryFlowAble/system/user' }
      }
    ]
  },
  {
    path: '/ryFlowAble/system/role-auth',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/ryFlowAble/system/role/authUser'),
        name: 'RuyiAuthUser',
        meta: { title: '分配用户', activeMenu: '/ryFlowAble/system/role' }
      }
    ]
  },
  {
    path: '/ryFlowAble/system/dict-data',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/ryFlowAble/system/dict/data'),
        name: 'RuyiData',
        meta: { title: '字典数据', activeMenu: '/ryFlowAble/system/dict' }
      }
    ]
  },

  // ===================== 系统监控 =====================
  {
    path: '/ryFlowAble/monitor',
    component: Layout,
    redirect: '/ryFlowAble/monitor/server',
    alwaysShow: true,
    name: 'RuyiMonitor',
    meta: { title: '系统监控(R)', icon: 'monitor' },
    children: [
      {
        path: 'server',
        component: () => import('@/views/ryFlowAble/monitor/server/index'),
        name: 'RuyiServer',
        meta: { title: '服务监控', icon: 'server', activeMenu: '/ryFlowAble/monitor/server' }
      },
      {
        path: 'cache',
        component: () => import('@/views/ryFlowAble/monitor/cache/index'),
        name: 'RuyiCache',
        meta: { title: '缓存监控', icon: 'redis', activeMenu: '/ryFlowAble/monitor/cache' }
      },
      {
        path: 'online',
        component: () => import('@/views/ryFlowAble/monitor/online/index'),
        name: 'RuyiOnline',
        meta: { title: '在线用户', icon: 'online', activeMenu: '/ryFlowAble/monitor/online' }
      },
      {
        path: 'job',
        component: () => import('@/views/ryFlowAble/monitor/job/index'),
        name: 'RuyiJob',
        meta: { title: '定时任务', icon: 'job', activeMenu: '/ryFlowAble/monitor/job' }
      },
      {
        path: 'logininfor',
        component: () => import('@/views/ryFlowAble/monitor/logininfor/index'),
        name: 'RuyiLogininfor',
        meta: { title: '登录日志', icon: 'logininfor', activeMenu: '/ryFlowAble/monitor/logininfor' }
      },
      {
        path: 'operlog',
        component: () => import('@/views/ryFlowAble/monitor/operlog/index'),
        name: 'RuyiOperlog',
        meta: { title: '操作日志', icon: 'operlog', activeMenu: '/ryFlowAble/monitor/operlog' }
      },
      {
        path: 'druid',
        component: () => import('@/views/ryFlowAble/monitor/druid/index'),
        name: 'RuyiDruid',
        meta: { title: '数据监控', icon: 'druid', activeMenu: '/ryFlowAble/monitor/druid' }
      }
    ]
  },
  {
    path: '/ryFlowAble/monitor/job-log',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/ryFlowAble/monitor/job/log'),
        name: 'RuyiJobLog',
        meta: { title: '调度日志', activeMenu: '/ryFlowAble/monitor/job' }
      }
    ]
  },

  // ===================== 系统工具 =====================
  {
    path: '/ryFlowAble/tool',
    component: Layout,
    redirect: '/ryFlowAble/tool/gen',
    alwaysShow: true,
    name: 'RuyiTool',
    meta: { title: '系统工具(R)', icon: 'tool' },
    children: [
      {
        path: 'gen',
        component: () => import('@/views/ryFlowAble/tool/gen/index'),
        name: 'RuyiGen',
        meta: { title: '代码生成', icon: 'code', activeMenu: '/ryFlowAble/tool/gen' }
      },
      {
        path: 'build',
        component: () => import('@/views/ryFlowAble/tool/build/index'),
        name: 'RuyiBuild',
        meta: { title: '表单构建', icon: 'build', activeMenu: '/ryFlowAble/tool/build' }
      },
      {
        path: 'swagger',
        component: () => import('@/views/ryFlowAble/tool/swagger/index'),
        name: 'RuyiSwagger',
        meta: { title: '系统接口', icon: 'swagger', activeMenu: '/ryFlowAble/tool/swagger' }
      }
    ]
  },
  {
    path: '/ryFlowAble/tool/gen-edit',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/ryFlowAble/tool/gen/editTable'),
        name: 'RuyiGenEdit',
        meta: { title: '修改生成配置', activeMenu: '/ryFlowAble/tool/gen' }
      }
    ]
  },

  // ===================== 工作流(Activiti) =====================
  {
    path: '/ryFlowAble/activiti',
    component: Layout,
    redirect: '/ryFlowAble/activiti/model',
    alwaysShow: true,
    name: 'RuyiActiviti',
    meta: { title: '工作流(R)', icon: 'flow' },
    children: [
      {
        path: 'model',
        component: () => import('@/views/ryFlowAble/activiti/model/list'),
        name: 'RuyiActModel',
        meta: { title: '流程模型', icon: 'model'}
      },
      {
        path: 'leave',
        component: () => import('@/views/ryFlowAble/activiti/leave/myStart'),
        name: 'RuyiLeave',
        meta: { title: '我发起的', icon: 'leave' }
      },
      {
        path: 'leave/myTodo',
        component: () => import('@/views/ryFlowAble/activiti/leave/myTodo'),
        name: 'RuyiLeaveTodo',
        hidden: true,
        meta: { title: '待办任务'}
      },
      {
        path: 'leave/myDone',
        component: () => import('@/views/ryFlowAble/activiti/leave/myDone'),
        name: 'RuyiLeaveDone',
        hidden: true,
        meta: { title: '已办任务'}
      },
      {
        path: 'leave/myCopy',
        component: () => import('@/views/ryFlowAble/activiti/leave/myCopy'),
        name: 'RuyiLeaveCopy',
        hidden: true,
        meta: { title: '抄送给我'}
      },
      {
        path: 'gateway',
        component: () => import('@/views/ryFlowAble/activiti/gateway/exclusive'),
        name: 'RuyiGateway',
        meta: { title: '网关事件', icon: 'gateway'}
      },
      {
        path: 'gateway/parallel',
        component: () => import('@/views/ryFlowAble/activiti/gateway/parallel'),
        name: 'RuyiGatewayParallel',
        hidden: true,
        meta: { title: '并行网关'}
      },
      {
        path: 'gateway/include',
        component: () => import('@/views/ryFlowAble/activiti/gateway/include'),
        name: 'RuyiGatewayInclude',
        hidden: true,
        meta: { title: '包容网关' }
      },
      {
        path: 'gateway/event-base',
        component: () => import('@/views/ryFlowAble/activiti/gateway/event-base'),
        name: 'RuyiGatewayEvent',
        hidden: true,
        meta: { title: '事件网关'}
      },
      {
        path: 'signal',
        component: () => import('@/views/ryFlowAble/activiti/signal/start'),
        name: 'RuyiSignal',
        meta: { title: '信号事件', icon: 'signal'}
      },
      {
        path: 'signal/boundary',
        component: () => import('@/views/ryFlowAble/activiti/signal/boundary'),
        name: 'RuyiSignalBoundary',
        hidden: true,
        meta: { title: '边界事件'}
      },
      {
        path: 'timer',
        component: () => import('@/views/ryFlowAble/activiti/timer/start'),
        name: 'RuyiTimer',
        meta: { title: '定时事件', icon: 'timer'}
      },
      {
        path: 'timer/middle',
        component: () => import('@/views/ryFlowAble/activiti/timer/middle'),
        name: 'RuyiTimerMiddle',
        hidden: true,
        meta: { title: '中间定时'}
      },
      {
        path: 'timer/boundary',
        component: () => import('@/views/ryFlowAble/activiti/timer/boundary'),
        name: 'RuyiTimerBoundary',
        hidden: true,
        meta: { title: '定时边界' }
      },
      {
        path: 'message',
        component: () => import('@/views/ryFlowAble/activiti/message/start'),
        name: 'RuyiMessage',
        meta: { title: '消息事件', icon: 'message'}
      },
      {
        path: 'message/middle',
        component: () => import('@/views/ryFlowAble/activiti/message/middle'),
        name: 'RuyiMessageMiddle',
        hidden: true,
        meta: { title: '中间事件'}
      },
      {
        path: 'message/boundary',
        component: () => import('@/views/ryFlowAble/activiti/message/boundary'),
        name: 'RuyiMessageBoundary',
        hidden: true,
        meta: { title: '边界事件'}
      }
    ]
  },
  // 流程模型 - 隐藏的动态路由（新建/编辑/历史/高亮）
  {
    path: '/ryFlowAble/activiti/model-create',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'index',
        component: () => import('@/views/ryFlowAble/activiti/model/create'),
        name: 'RuyiModelCreate',
        meta: { title: '新建模型' }
      }
    ]
  },
  {
    path: '/ryFlowAble/activiti/model-edit',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'index/:modelId',
        component: () => import('@/views/ryFlowAble/activiti/model/edit'),
        name: 'RuyiModelEdit',
        meta: { title: '编辑模型' }
      }
    ]
  },
  {
    path: '/ryFlowAble/activiti/model-history',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'index',
        component: () => import('@/views/ryFlowAble/activiti/model/history'),
        name: 'RuyiModelHistory',
        meta: { title: '模型历史' }
      }
    ]
  },
  {
    path: '/ryFlowAble/activiti/model-highlight',
    component: Layout,
    hidden: true,
    children: [
      {
        path: 'index',
        component: () => import('@/views/ryFlowAble/activiti/model/highlight'),
        name: 'RuyiModelHighlight',
        meta: { title: '流程高亮' }
      }
    ]
  },

]
