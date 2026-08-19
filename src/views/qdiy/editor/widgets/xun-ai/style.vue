<template>
  <star-car-care-style
    :active-item="activeItem"
    :show-pattern="true"
    suggest-text="建议图片宽度750，高度200-950，支持jpg、png"
    v-on="$listeners"
  />
</template>

<script>
/**
 * AI 助手 —— 属性面板。迁移自 PHP common/xun-ai/style.php
 *
 * 与 star-car-care 同源，只多了「选择风格 + 热区开关」，
 * 复用 star-car-care 的面板并打开 showPattern。
 */
export default {
  name: 'XunAiStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
