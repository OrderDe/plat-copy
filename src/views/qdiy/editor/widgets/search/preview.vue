<template>
  <div class="search-box" :style="{ background: computedStyle.searchBox }">
    <div class="search-ipt" :style="{ ...inputStyle, height: boxHeight }">
      <i class="el-icon-search search-icons" :style="{ color: computedStyle.iconsStyle }" />
      <div class="placeholder" :style="{ color: computedStyle.textStyle }">{{ searchData.name || '请输入关键字' }}</div>
    </div>
  </div>
</template>

<script>
/** 搜索框 —— 画布预览。迁移自 PHP common/search/preview.php */
export default {
  name: 'SearchPreview',
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
    searchData() {
      return this.activeItem.data || {};
    },
    boxHeight() {
      const h = this.computedStyle.heightInfos;
      return h && h[0] ? h[0].value + h[0].unit : '30px';
    },
    // tabItem 决定描边 / 投影两种样式
    inputStyle() {
      const tabItem = this.computedStyle.tabItem;
      const style = {
        background: this.computedStyle.iptBg,
        ...this.computedStyle.searchIpts,
      };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
  },
};
</script>

<style scoped lang="scss">
.search-box {
  padding: 1px;
}
.search-ipt {
  display: flex;
  align-items: center;
  background-color: #f3f3f3;
  padding: 0 17px;
  box-sizing: border-box;
}
.placeholder {
  font-size: 11px;
  color: #999;
  font-weight: 700;
  padding-left: 10px;
}
.search-icons {
  color: #f00;
}
</style>
