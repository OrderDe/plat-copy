<template>
  <div class="no-config-box">该模块内容由商品数据自动填充，无需编辑</div>
</template>

<script>
/**
 * 无配置项的属性面板
 *
 * 商品详情页的一批组件（goods-attr / goods-stock / goods-service / goods-coupon 等）
 * 在 PHP 侧的 style.php 就是一个空 div，内容全部由商品数据决定。
 * 这些组件的 style.vue 直接复用本组件，避免抄多份空面板。
 */
export default {
  name: 'NoConfigStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style scoped lang="scss">
.no-config-box {
  display: block;
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 13px;
}
</style>
