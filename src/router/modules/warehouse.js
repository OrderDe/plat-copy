import Layout from '@/layout';
import ParentView from '@/views/warehouse/ParentView';

/**
 * 仓储菜单按业务域分组为二级菜单。
 * 子路由一律使用「绝对路径」(/warehouse/xxx)，因此实际 URL 与分组前保持一致，
 * 已有的收藏、外部链接和代码里的 $router.push 都不受影响。
 */
const warehouseRouter = {
  path: '/warehouse',
  component: Layout,
  redirect: '/warehouse/dashboard',
  name: 'Warehouse',
  meta: {
    title: '仓库管理',
    icon: 'shopping',
  },
  children: [
    // ---------- 基础配置 ----------
    {
      path: 'basic',
      component: ParentView,
      redirect: '/warehouse/warehouse-list',
      name: 'WarehouseBasic',
      meta: { title: '基础配置' },
      children: [
        {
          path: '/warehouse/warehouse-list',
          component: () => import('@/views/warehouse/warehouseList/index'),
          name: 'WarehouseList',
          meta: { title: '仓库列表' },
        },
        {
          path: '/warehouse/shelf',
          component: () => import('@/views/warehouse/shelf/index'),
          name: 'WarehouseShelf',
          meta: { title: '货架管理' },
        },
        {
          path: '/warehouse/batch',
          component: () => import('@/views/warehouse/batch/index'),
          name: 'WarehouseBatch',
          meta: { title: '批次管理' },
        },
        {
          path: '/warehouse/no-rule',
          component: () => import('@/views/warehouse/noRule/index'),
          name: 'WarehouseNoRule',
          meta: { title: '单据编号规则' },
        },
        {
          path: '/warehouse/print',
          component: () => import('@/views/warehouse/print/index'),
          name: 'WarehousePrintTemplate',
          meta: { title: '打印模板' },
        },
        {
          path: '/warehouse/dict',
          component: () => import('@/views/warehouse/dict/index'),
          name: 'WarehouseDict',
          meta: { title: '仓储字典' },
        },
      ],
    },

    // ---------- 入库业务 ----------
    {
      path: 'in',
      component: ParentView,
      redirect: '/warehouse/inbound',
      name: 'WarehouseInGroup',
      meta: { title: '入库业务' },
      children: [
        {
          path: '/warehouse/deliver',
          component: () => import('@/views/warehouse/deliver/index'),
          name: 'WarehouseDeliver',
          meta: { title: '采购发货单' },
        },
        {
          path: '/warehouse/inbound',
          component: () => import('@/views/warehouse/inbound/index'),
          name: 'WarehouseInbound',
          meta: { title: '入库管理' },
        },
        {
          path: '/warehouse/inspect',
          component: () => import('@/views/warehouse/inspect/index'),
          name: 'WarehouseInspect',
          meta: { title: '质检管理' },
        },
      ],
    },

    // ---------- 出库业务 ----------
    {
      path: 'out',
      component: ParentView,
      redirect: '/warehouse/outbound',
      name: 'WarehouseOutGroup',
      meta: { title: '出库业务' },
      children: [
        {
          path: '/warehouse/outbound',
          component: () => import('@/views/warehouse/outbound/index'),
          name: 'WarehouseOutbound',
          meta: { title: '出库管理' },
        },
        {
          path: '/warehouse/wave',
          component: () => import('@/views/warehouse/wave/index'),
          name: 'WarehouseWave',
          meta: { title: '波次与拣货' },
        },
        {
          // 拣货管理已并入波次页（主从布局），旧链接/收藏重定向过去
          path: '/warehouse/pick',
          redirect: '/warehouse/wave',
          hidden: true,
        },
        {
          /*
           * 复核的日常入口在「波次与拣货」的拣货单操作列（拣完即复核，同一个人同一屏完成），
           * 所以这里 hidden，不占菜单。
           *
           * 但只留波次内入口的话，差异单跟进得一个波次一个波次翻 —— 跨波次的全局视图没了。
           * 所以把这个页面保留为「下钻目标」：仓储看板的「待复核单」卡片点进来，
           * 老链接 / 收藏也仍然可用（之前是 redirect 到 wave，等于把这个能力丢了）。
           */
          path: '/warehouse/review',
          component: () => import('@/views/warehouse/review/index'),
          name: 'WarehouseReview',
          meta: { title: '待复核（跨波次）' },
          hidden: true,
        },
        {
          // 出库交接：快递员上门取件时当面确认，解决「货有没有真的被带走」
          path: '/warehouse/handover',
          component: () => import('@/views/warehouse/handover/index'),
          name: 'WarehouseHandover',
          meta: { title: '出库交接' },
        },
        {
          // 人工交接与承运商揽收状态对不上的异常清单
          path: '/warehouse/handover-exception',
          component: () => import('@/views/warehouse/handover/exception'),
          name: 'WarehouseHandoverException',
          meta: { title: '交接异常' },
        },
        {
          // 商城↔仓储两个服务之间的同步失败记录（发货没扣账、退货没入库）
          path: '/warehouse/sync-fail',
          component: () => import('@/views/warehouse/syncFail/index'),
          name: 'WarehouseSyncFail',
          meta: { title: '仓储同步异常' },
        },
        {
          // 发货记录 + 运单号反查：一个运单号对应哪个仓、发了什么货、谁操作的
          path: '/warehouse/ship-record',
          component: () => import('@/views/warehouse/shipRecord/index'),
          name: 'WarehouseShipRecord',
          meta: { title: '发货记录' },
        },
      ],
    },

    // ---------- 库内作业 ----------
    {
      path: 'operation',
      component: ParentView,
      redirect: '/warehouse/relocate',
      name: 'WarehouseOperationGroup',
      meta: { title: '库内作业' },
      children: [
        {
          path: '/warehouse/relocate',
          component: () => import('@/views/warehouse/relocate/index'),
          name: 'WarehouseRelocate',
          meta: { title: '上架/移库/补货' },
        },
      ],
    },

    // ---------- 库存与盘点 ----------
    {
      path: 'stock-group',
      component: ParentView,
      redirect: '/warehouse/stock',
      name: 'WarehouseStockGroup',
      meta: { title: '库存与盘点' },
      children: [
        {
          path: '/warehouse/stock',
          component: () => import('@/views/warehouse/stock/index'),
          name: 'WarehouseStock',
          meta: { title: '库存管理' },
        },
        {
          path: '/warehouse/stock-record',
          component: () => import('@/views/warehouse/record/index'),
          name: 'WarehouseStockRecord',
          meta: { title: '库存流水' },
        },
        {
          path: '/warehouse/stock-check',
          component: () => import('@/views/warehouse/stockCheck/index'),
          name: 'WarehouseStockCheck',
          meta: { title: '盘点列表' },
        },
      ],
    },

    // ---------- 单据审批 ----------
    {
      path: 'apply',
      component: ParentView,
      redirect: '/warehouse/damage',
      name: 'WarehouseApplyGroup',
      meta: { title: '单据审批' },
      children: [
        {
          path: '/warehouse/damage',
          component: () => import('@/views/warehouse/damage/index'),
          name: 'WarehouseDamage',
          meta: { title: '报损管理' },
        },
        {
          path: '/warehouse/receive',
          component: () => import('@/views/warehouse/receive/index'),
          name: 'WarehouseReceive',
          meta: { title: '领用申请单' },
        },
        {
          path: '/warehouse/transfer',
          component: () => import('@/views/warehouse/transfer/index'),
          name: 'WarehouseTransfer',
          meta: { title: '调拨申请单' },
        },
        {
          path: '/warehouse/return',
          component: () => import('@/views/warehouse/return/index'),
          name: 'WarehouseReturn',
          meta: { title: '退库申请单' },
        },
      ],
    },

    // ---------- 统计分析 ----------
    {
      path: 'report',
      component: ParentView,
      redirect: '/warehouse/dashboard',
      name: 'WarehouseReportGroup',
      meta: { title: '统计分析' },
      children: [
        {
          path: '/warehouse/dashboard',
          component: () => import('@/views/warehouse/dashboard/index'),
          name: 'WarehouseDashboard',
          meta: { title: '总览看板' },
        },
        {
          path: '/warehouse/aging',
          component: () => import('@/views/warehouse/aging/index'),
          name: 'WarehouseAging',
          meta: { title: '库龄分析' },
        },
        {
          path: '/warehouse/slow-moving',
          component: () => import('@/views/warehouse/slowMoving/index'),
          name: 'WarehouseSlowMoving',
          meta: { title: '呆滞库存' },
        },
        {
          path: '/warehouse/turnover',
          component: () => import('@/views/warehouse/turnover/index'),
          name: 'WarehouseTurnover',
          meta: { title: '周转率分析' },
        },
        {
          path: '/warehouse/cost',
          component: () => import('@/views/warehouse/cost/index'),
          name: 'WarehouseCost',
          meta: { title: '库存流动明细' },
        },
      ],
    },
  ],
};

export default warehouseRouter;
