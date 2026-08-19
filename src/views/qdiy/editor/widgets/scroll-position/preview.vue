<template>
  <div class="anchor-tip">
    <span>锚点ID:({{ searchData.name }}) —— 锚点在前端不显示</span>
  </div>
</template>

<script>
/** 锚点 —— 画布预览。迁移自 PHP common/scroll-position/preview.php */
export default {
  name: 'ScrollPositionPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    searchData() {
      return this.activeItem.data || {};
    },
  },
};
</script>

<style scoped lang="scss">
.anchor-tip {
  height: 30px;
  text-align: center;
  line-height: 30px;
  color: #999;
  font-size: 12px;
}
</style>
