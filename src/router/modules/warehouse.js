import Layout from '@/layout';

const warehouseRouter = {
  path: '/warehouse',
  component: Layout,
  redirect: '/warehouse/warehouse-list',
  name: 'Warehouse',
  meta: {
    title: '仓库管理',
    icon: 'shopping',
  },
  children: [
    {
      path: 'warehouse-list',
      component: () => import('@/views/warehouse/warehouseList/index'),
      name: 'WarehouseList',
      meta: { title: '仓库列表' },
    },
    {
      path: 'inbound',
      component: () => import('@/views/warehouse/inbound/index'),
      name: 'WarehouseInbound',
      meta: { title: '入库管理' },
    },
    {
      path: 'outbound',
      component: () => import('@/views/warehouse/outbound/index'),
      name: 'WarehouseOutbound',
      meta: { title: '出库管理' },
    },
    {
      path: 'material',
      component: () => import('@/views/warehouse/material/index'),
      name: 'WarehouseMaterial',
      meta: { title: '物料列表' },
    },
    {
      path: 'stock',
      component: () => import('@/views/warehouse/stock/index'),
      name: 'WarehouseStock',
      meta: { title: '库存管理' },
    },
    {
      path: 'damage',
      component: () => import('@/views/warehouse/damage/index'),
      name: 'WarehouseDamage',
      meta: { title: '报损管理' },
    },
    {
      path: 'receive',
      component: () => import('@/views/warehouse/receive/index'),
      name: 'WarehouseReceive',
      meta: { title: '领用申请单' },
    },
    {
      path: 'transfer',
      component: () => import('@/views/warehouse/transfer/index'),
      name: 'WarehouseTransfer',
      meta: { title: '调拨申请单' },
    },
    {
      path: 'return',
      component: () => import('@/views/warehouse/return/index'),
      name: 'WarehouseReturn',
      meta: { title: '退库申请单' },
    },
    {
      path: 'deliver',
      component: () => import('@/views/warehouse/deliver/index'),
      name: 'WarehouseDeliver',
      meta: { title: '采购发货单' },
    },
    {
      path: 'expiry',
      component: () => import('@/views/warehouse/expiry/index'),
      name: 'WarehouseExpiry',
      meta: { title: '效期预警' },
    },
    {
      path: 'pss',
      component: () => import('@/views/warehouse/pss/index'),
      name: 'WarehousePss',
      meta: { title: '购销存数据' },
    },
    {
      path: 'stock-check',
      component: () => import('@/views/warehouse/stockCheck/index'),
      name: 'WarehouseStockCheck',
      meta: { title: '盘点列表' },
    },
    {
      path: 'stats',
      component: () => import('@/views/warehouse/stats/index'),
      name: 'WarehouseStats',
      meta: { title: '统计管理' },
    },
  ],
};

export default warehouseRouter;
