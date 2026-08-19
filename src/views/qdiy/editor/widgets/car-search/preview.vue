<template>
  <div class="car-search-preview" :style="{ background: computedStyle.searchBox }">
    <div :style="{ marginTop: inputStyle.marginTop, marginBottom: inputStyle.marginBottom }">
      <div class="car-search-head">
        <span class="head-left" :style="{ color: computedStyle.titleStyle }">
          {{ searchData.title_text || '快速匹配机油' }}
        </span>
        <span class="head-right">
          <span class="text-icon" :style="{ background: computedStyle.markBgStyle, color: computedStyle.markStyle }">
            {{ searchData.mark_text || 'seo' }}
          </span>
          <span :style="{ color: computedStyle.moreStyle }">{{ searchData.more_text || '按车型查询>>' }}</span>
        </span>
      </div>

      <div class="search-ipt" :style="iptBoxStyle">
        <i class="el-icon-camera search-icons" :style="{ color: computedStyle.iconsStyle }" />
        <div class="scan-text" :style="{ color: computedStyle.scanStyle }">{{ searchData.scan_text || '拍VIN码' }}</div>
        <div class="split">|</div>
        <div class="placeholder" :style="{ color: computedStyle.textStyle }">
          {{ searchData.name || '请输入17位VIN码，如"LHGGE88198398"' }}
        </div>
        <div class="search-btn" :style="{ color: computedStyle.btnTextStyle, background: computedStyle.btnTextBg }">
          {{ searchData.btn_text || '搜索' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/** 车型搜索 —— 画布预览。迁移自 PHP common/car-search/preview.php */
export default {
  name: 'CarSearchPreview',
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
    // 外层只取边距，内框只取背景 + 圆角，与 PHP 侧拆法一致
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
    iptBoxStyle() {
      const s = this.inputStyle;
      return {
        background: s.background,
        border: s.border,
        boxShadow: s.boxShadow,
        'border-top-left-radius': s['border-top-left-radius'],
        'border-top-right-radius': s['border-top-right-radius'],
        'border-bottom-left-radius': s['border-bottom-left-radius'],
        'border-bottom-right-radius': s['border-bottom-right-radius'],
      };
    },
  },
};
</script>

<style scoped lang="scss">
.car-search-preview {
  padding: 8px 12px;
  font-size: 12px;
}
.car-search-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .head-right {
    display: flex;
    align-items: center;
  }
}
.text-icon {
  padding: 0 5px;
  border-radius: 2px;
  margin-right: 5px;
  line-height: 18px;
  background-color: #00a65a;
  color: #fff;
}
.search-ipt {
  display: flex;
  align-items: center;
  background-color: #f3f3f3;
  height: 30px;
  padding: 0 17px;
  margin-top: 8px;
  box-sizing: border-box;
}
.search-icons {
  color: #f00;
  font-size: 20px;
}
.scan-text {
  width: 70px;
  white-space: nowrap;
}
.split {
  margin-left: 10px;
}
.placeholder {
  flex: 1;
  font-size: 11px;
  color: #999;
  font-weight: 700;
  padding-left: 10px;
  white-space: nowrap;
  overflow: hidden;
}
.search-btn {
  white-space: nowrap;
  text-align: center;
  padding: 3px 8px;
  border-radius: 3px;
}
</style>
