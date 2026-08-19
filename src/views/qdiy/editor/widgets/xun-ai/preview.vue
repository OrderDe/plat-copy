<template>
  <star-car-care-preview :active-item="activeItem" />
</template>

<script>
/**
 * AI 助手 —— 画布预览。迁移自 PHP common/xun-ai/preview.php
 *
 * 与 star-car-care 的 preview.php 逐行比对后完全一致（都是图片广告结构），直接复用。
 */
export default {
  name: 'XunAiPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
