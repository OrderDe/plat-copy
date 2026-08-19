<template>
  <blindbox-goods-style :active-item="activeItem" pick-title="选择多人盲盒商品" v-on="$listeners" />
</template>

<script>
/**
 * 多人盲盒商品 —— 属性面板。迁移自 PHP common/blindboxs-goods/style.php
 *
 * 与 blindbox-goods 的 style.php 配置项完全一致，只是选品来源不同（blind_boxs_goods），
 * 直接复用 blindbox-goods 的面板，update 事件透传。
 */
export default {
  name: 'BlindboxsGoodsStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
