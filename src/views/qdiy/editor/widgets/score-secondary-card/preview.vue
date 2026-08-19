<template>
  <secondary-card-preview :active-item="activeItem" />
</template>

<script>
/**
 * 积分次卡 —— 画布预览。迁移自 PHP common/score-secondary-card/preview.php
 *
 * 与 secondary-card 的 preview.php 逐行比对后只有 class 名不同，直接复用其预览组件。
 */
export default {
  name: 'ScoreSecondaryCardPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
