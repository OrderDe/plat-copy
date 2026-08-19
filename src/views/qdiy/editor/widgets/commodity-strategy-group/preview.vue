<template>
  <commodity-group-preview :active-item="activeItem" />
</template>

<script>
/**
 * 推荐策略商品组 —— 画布预览。迁移自 PHP common/commodity-strategy-group/preview.php
 *
 * 与 commodity-group 的预览实现逐行比对后只有会员价排版差异，直接复用。
 * 「推荐策略」只影响 App 端取数（data.strategyData），画布上仍是占位卡片。
 */
export default {
  name: 'CommodityStrategyGroupPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
