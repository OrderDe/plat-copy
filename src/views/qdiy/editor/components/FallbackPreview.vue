<template>
  <div class="fallback-preview">
    <div class="name">{{ title }}</div>
    <div class="hint">该组件尚未迁移（P6），配置数据可正常保存</div>
  </div>
</template>

<script>
export default {
  name: 'FallbackPreview',
  props: {
    // 画布项，结构为 {identify, site, data, computedStyle, params}
    item: {
      type: Object,
      default: () => ({}),
    },
    // 组件注册表信息
    component: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    title() {
      return (this.component && this.component.title) || (this.item.data && this.item.data.title) || this.item.identify;
    },
  },
};
</script>

<style scoped lang="scss">
.fallback-preview {
  padding: 24px 12px;
  text-align: center;
  background: #fafafa;
  border: 1px dashed #dcdfe6;
  .name {
    font-size: 14px;
    color: #606266;
  }
  .hint {
    margin-top: 6px;
    font-size: 12px;
    color: #c0c4cc;
  }
}
</style>
