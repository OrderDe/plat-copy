<template>
  <div class="fallback-style">
    <el-alert
      :title="`「${title}」的专属配置面板尚未迁移`"
      type="info"
      :closable="false"
      description="以下为通用样式配置，保存后数据结构与正式组件一致。"
      show-icon
    />

    <el-form label-width="80px" size="small" class="mt20">
      <el-form-item label="组件标题">
        <el-input v-model="item.data.title" placeholder="请输入组件标题" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'FallbackStyle',
  props: {
    item: {
      type: Object,
      default: () => ({ data: {} }),
    },
    component: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    title() {
      return (this.component && this.component.title) || this.item.identify;
    },
  },
};
</script>

<style scoped lang="scss">
.mt20 {
  margin-top: 20px;
}
</style>
