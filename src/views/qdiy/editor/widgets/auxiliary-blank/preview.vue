<template>
  <div :style="{ background: computedStyle.searchBox }">
    <div :style="{ height: computedStyle.height }" />
  </div>
</template>

<script>
/** 辅助空白 —— 画布预览。迁移自 PHP common/auxiliary-blank/preview.php */
export default {
  name: 'AuxiliaryBlankPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
  },
};
</script>
