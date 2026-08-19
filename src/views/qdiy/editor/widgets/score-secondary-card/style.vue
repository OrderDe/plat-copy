<template>
  <secondary-card-style
    :active-item="activeItem"
    pick-tip="按积分次卡 ID 添加，真实次卡信息由 App 端按 ID 获取"
    v-on="$listeners"
  />
</template>

<script>
/**
 * 积分次卡 —— 属性面板。迁移自 PHP common/score-secondary-card/style.php
 *
 * 与 secondary-card 的 style.php 配置项完全一致，只是次卡来源不同，直接复用其面板。
 */
export default {
  name: 'ScoreSecondaryCardStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
