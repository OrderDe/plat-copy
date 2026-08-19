<template>
  <div class="diy-style-contain" :style="containStyle">
    <div class="dsc-head" :style="defaultStyle">
      <div v-if="showTitle" class="dsc-title" :style="titleStyle">{{ title }}</div>
      <div><slot name="right" /></div>
    </div>
    <slot />
  </div>
</template>

<script>
/**
 * 样式容器 —— 所有基础控件的外壳，统一标题与内边距
 * 迁移自 PHP diy-style-contain.php
 */
export default {
  name: 'DiyStyleContain',
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: '标题',
    },
    titleStyle: {
      type: Object,
      default: () => ({}),
    },
    containStyle: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    defaultStyle() {
      return this.showTitle ? { margin: '0 0 20px' } : {};
    },
  },
};
</script>

<style scoped lang="scss">
.diy-style-contain {
  position: relative;
  padding: 20px;
}
.dsc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dsc-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}
</style>
