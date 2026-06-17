
import Layout from '@/layout';

const invoiceRouter = {
  path: '/invoice',
  component: Layout,
  redirect: '/invoice/record',
  name: 'Invoice',
  meta: {
    title: '发票管理',
    icon: 'document',
  },
  children: [
    {
      path: 'record',
      component: () => import('@/views/invoiceRecord/index'),
      name: 'InvoiceRecord',
      meta: { title: '发票记录', icon: '' },
    },
  ],
};

export default invoiceRouter;
