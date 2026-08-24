<template>
  <div class="page-body-holder">
    <div class="line" />
    <span class="label">页面主体（此处显示页面原有内容）</span>
    <div class="line" />
  </div>
</template>

<script>
/**
 * 页面主体位置 —— 画布预览
 *
 * 分类页、购物车的主体（分类树、商品列表、购物车列表、结算栏）是写死的功能区，
 * 装修改不了，只能在它上下加内容。这个组件就是主体的占位标记：
 * 它上面的组件渲染到主体上方，下面的渲染到主体下方。
 * App 端不渲染它本身（见 components/qdiy/index.vue 的 PAGE_BODY）。
 */
export default {
  name: 'PageBodyPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style scoped lang="scss">
.page-body-holder {
  display: flex;
  align-items: center;
  padding: 18px 12px;
  background: #f7f8fa;

  .line {
    flex: 1;
    height: 0;
    border-top: 1px dashed #c0c4cc;
  }

  .label {
    padding: 0 10px;
    color: #909399;
    font-size: 12px;
    white-space: nowrap;
  }
}
</style>
