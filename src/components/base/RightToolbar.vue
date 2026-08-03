<template>
  <div class="top-right-btn">
    <el-tooltip :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
      <el-button
        size="mini"
        circle
        icon="el-icon-search"
        @click="toggleSearch"
      />
    </el-tooltip>
  </div>
</template>

<script>
export default {
  name: 'RightToolbar',
  props: {
    showSearch: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    toggleSearch() {
      this.$emit('update:showSearch', !this.showSearch)
      this.$emit('queryTable')
    }
  }
}
</script>

<style scoped>
.top-right-btn {
  float: right;
  margin-right: 10px;
}
</style>
