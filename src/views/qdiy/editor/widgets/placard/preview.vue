<template>
  <div class="diy-placard" :style="{ background: colorAt(0, '') }">
    <div class="diy-placard-c" :style="boxStyle">
      <el-image v-if="iconImg" class="placard-preview-img" :src="iconImg" fit="contain" />
      <i v-else class="el-icon-bell placard-preview-icon" :style="{ color: colorAt(2, '#000') }" />
      <div class="line-style" :style="{ borderLeft: `1.5px solid ${colorAt(2, '#000')}` }" />
      <div class="placard-text" :style="textStyle">{{ placardText }}</div>
    </div>
  </div>
</template>

<script>
/**
 * 公告 —— 画布预览。迁移自 PHP common/placard/preview.php
 *
 * 系统图标 resources/img/decorate/horn.png 平台端无此资源，
 * 未选自定义图片时用 Element 的 el-icon-bell 顶替。
 */
export default {
  name: 'PlacardPreview',
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
    iconImg() {
      const data = this.searchData.iconSel;
      if (!data || data.selected === 1) return '';
      const img = data.diy && data.diy.img && data.diy.img[0];
      return (img && img.imgUrl) || '';
    },
    placardText() {
      const data = this.searchData.dataShow;
      if (!data) return '';
      return data.selected === 1 ? data.system.text : data.diy.text;
    },
    boxStyle() {
      const cs = this.computedStyle;
      const tabItem = cs.tabItem;
      const style = {
        ...cs.searchIpts,
        background: this.colorAt(1, cs.iptBg),
      };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    textStyle() {
      const cs = this.computedStyle;
      const font = cs.fontSizeInfos && cs.fontSizeInfos[0];
      return {
        color: this.colorAt(3, '#666'),
        fontWeight: cs.fontWeight || 'normal',
        fontSize: font ? font.value + font.unit : '14px',
      };
    },
  },
  methods: {
    colorAt(index, def) {
      const arr = this.computedStyle.colorArr;
      return (arr && arr[index]) || def;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-placard {
  display: flow-root;
}
.diy-placard-c {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 10px;
  box-sizing: border-box;
}
.line-style {
  height: 15px;
  margin: 5px;
}
.placard-preview-img {
  width: 22px;
  height: 22px;
  min-width: 22px;
}
.placard-preview-icon {
  font-size: 18px;
}
.placard-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
