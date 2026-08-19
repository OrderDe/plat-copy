<template>
  <div class="diy-tab">
    <div v-for="(item, index) in value" :key="index" class="diy-tab-cell" @click="select(item, index)">
      <slot :item="item" :index="index" :is-select="index === current" />
    </div>
  </div>
</template>

<script>
/**
 * 通用 tab 容器 —— 只负责选中态与事件，外观完全交给默认插槽
 * 迁移自 PHP diy-tab.php
 */
export default {
  name: 'DiyTab',
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    defaultIndex: {
      type: [Number, String],
      default: -1,
    },
  },
  data() {
    return {
      current: -1,
    };
  },
  watch: {
    defaultIndex: {
      immediate: true,
      handler(val) {
        this.current = val;
      },
    },
  },
  methods: {
    select(item, index) {
      this.current = index;
      this.$emit('change', item, index);
    },
  },
};
</script>

<style scoped lang="scss">
.diy-tab {
  display: flex;
  align-items: center;
}
.diy-tab-cell {
  cursor: pointer;
}
</style>
