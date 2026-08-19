<template>
  <blindbox-goods-preview :active-item="activeItem" />
</template>

<script>
/**
 * 多人盲盒商品 —— 画布预览。迁移自 PHP common/blindboxs-goods/preview.php
 *
 * 与 blindbox-goods 的 preview.php 逐行比对后完全一致（只有组件名与选品来源不同），
 * 直接复用 blindbox-goods 的预览组件。
 */
export default {
  name: 'BlindboxsGoodsPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
