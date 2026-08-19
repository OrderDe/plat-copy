<template>
  <commodity-group-style :active-item="activeItem" v-on="$listeners" />
</template>

<script>
/**
 * 门店商品组 —— 属性面板。迁移自 PHP common/commodity-location-group/style.php
 *
 * 与 commodity-group 的配置项完全一致（PHP 侧两个文件逐行比对后只有排版差异），
 * 直接复用 commodity-group 的面板，update 事件透传给编辑器。
 */
export default {
  name: 'CommodityLocationGroupStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
