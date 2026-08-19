<template>
  <div class="scroll-nav-preview" :style="{ background: computedStyle.bgColor }">
    <div class="scroll-wrapper">
      <div class="tab-contain">
        <div
          class="tab-list"
          :class="{ 'tab-flex': catList.length <= 5 }"
          :style="{ background: computedStyle.titleBgColor }"
        >
          <div v-for="(item, index) in catList" :key="index" class="tab-item" :style="{ color: computedStyle.titleColor }">
            {{ item.title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/** 滚动导航 —— 画布预览。迁移自 PHP common/scroll-nav/preview.php */
export default {
  name: 'ScrollNavPreview',
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
    catList() {
      return (this.activeItem.data && this.activeItem.data.catList) || [];
    },
  },
};
</script>

<style scoped lang="scss">
.scroll-wrapper {
  height: 35px;
}
.tab-contain {
  overflow: hidden;
}
.tab-list {
  // 超过 5 个时横向滚动，与 PHP 侧 w-9000 的效果一致
  white-space: nowrap;
  overflow: hidden;
}
.tab-flex {
  display: flex;
  width: 100%;
}
.tab-item {
  display: inline-block;
  position: relative;
  padding: 0 20px;
  text-align: center;
  flex: 1;
  height: 35px;
  line-height: 35px;
}
</style>
