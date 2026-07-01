
import Layout from '@/layout';

const productRouter = {
  path: '/product',
  component: Layout,
  redirect: '/product/category',
  name: 'Product',
  meta: {
    title: '商品',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'list',
      component: () => import('@/views/product/index'),
      name: 'ProductIndex',
      meta: { title: '商品列表', icon: '' },
    },
    {
      path: 'category',
      component: () => import('@/views/product/category/index'),
      name: 'ProductCategory',
      meta: { title: '商品分类', icon: '' },
    },
    {
      path: 'library',
      component: () => import('@/views/product/library/index'),
      name: 'ProductLibrary',
      meta: { title: '商品库', icon: '' },
    },
    {
      path: 'comment',
      component: () => import('@/views/product/comment/index'),
      name: 'ProductComment',
      meta: { title: '商品评论', icon: '' },
    },
    {
      path: 'brand',
      component: () => import('@/views/product/brand/index'),
      name: 'ProductBrand',
      meta: { title: '品牌管理', icon: '' },
    },
    {
      path: 'guarantee',
      component: () => import('@/views/product/guarantee/index'),
      name: 'ProductGuarantee',
      meta: { title: '保障服务', icon: '' },
    },
    {
      path: 'platguarantee/index',
      component: () => import('@/views/product/platguarantee/index'),
      name: 'ProductPlatguarantee',
      meta: { title: '保障服务管理', icon: '' },
    },
    {
      path: 'tag',
      component: () => import('@/views/product/tag/index'),
      name: 'ProductTag',
      meta: { title: '商品标签', icon: '' },
    },
    {
      path: 'tag/creatTag/:id?',
      component: () => import('@/views/product/tag/creatTag'),
      name: 'CreatTag',
      meta: { title: '添加商品标签', icon: '', noCache: true, activeMenu: `/product/tag` },
    },
  ],
};

export default productRouter;
