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
          meta: { title: '波次管理' },
        },
        {
          path: '/warehouse/pick',
          component: () => import('@/views/warehouse/pick/index'),
          name: 'WarehousePick',
          meta: { title: '拣货管理' },
        },
        {
          path: '/warehouse/review',
          component: () => import('@/views/warehouse/review/index'),
          name: 'WarehouseReview',
          meta: { title: '复核管理' },
        },
        {
          path: '/warehouse/package',
          component: () => import('@/views/warehouse/package/index'),
          name: 'WarehousePackage',
          meta: { title: '装箱管理' },
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
        {
          path: '/warehouse/replenish',
          component: () => import('@/views/warehouse/replenish/index'),
          name: 'WarehouseReplenish',
          meta: { title: '智能补货' },
        },
        {
          path: '/warehouse/allocate',
          component: () => import('@/views/warehouse/allocate/index'),
          name: 'WarehouseAllocate',
          meta: { title: '智能分仓' },
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
        {
          path: '/warehouse/stock-check-plan',
          component: () => import('@/views/warehouse/stockCheckPlan/index'),
          name: 'WarehouseStockCheckPlan',
          meta: { title: '循环盘点计划' },
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
          meta: { title: '成本核算' },
        },
      ],
    },
  ],
};

export default warehouseRouter;
