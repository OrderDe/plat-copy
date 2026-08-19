<template>
  <div class="diy-line" :style="{ background: computedStyle.searchBox }">
    <div :style="{ ...computedStyle.searchIpts, border: computedBorder }" />
  </div>
</template>

<script>
/** 辅助线 —— 画布预览。迁移自 PHP common/auxiliary-line/preview.php */
export default {
  name: 'AuxiliaryLinePreview',
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
    computedBorder() {
      const getType = { 0: 'solid', 1: 'dashed' };
      const type = getType[this.computedStyle.type || 0];
      return `${type} 1px ${this.computedStyle.lineColor}`;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-line {
  box-sizing: border-box;
  background: #fff;
  overflow: hidden;
}
</style>
