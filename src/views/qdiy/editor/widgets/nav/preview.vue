<template>
  <div :class="{ abso: navData.styleChoose == 2 }">
    <div class="nav-preview" :style="containStyle">
      <div class="nav-contain" :style="containStyle1">
        <div class="nav-cont-title over1" :style="titleStyle">
          <img v-if="contentType" :src="src" alt="" class="logo-img" />
          <span v-else>{{ navData.name || '标题' }}</span>
        </div>
        <div v-if="searchSwitch" class="search-input over1" :style="serachStyle">
          <i class="search-icon el-icon-search" :style="iconStyle" />
          <span class="over1">{{ navData.placeholder || '请输入描述' }}</span>
        </div>
        <div v-if="searchSwitch" class="right-holder" />
      </div>
      <!-- 原实现这里放的是小程序胶囊按钮的位图（nav/light2.png、dark2.png），
           平台端没有这批资源，改用等价的 CSS 胶囊占位 -->
      <div class="mp-capsule" :class="capsuleType" />
    </div>
  </div>
</template>

<script>
/**
 * 导航组 —— 画布预览
 * 迁移自 PHP common/nav/preview.php
 *
 * 胶囊的明暗由状态栏背景色的明暗自动决定（getContrastYIQ），与原实现一致。
 */
import { getContrastYIQ } from '../../controls/utils';

export default {
  name: 'NavPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    navData() {
      return this.activeItem.data || {};
    },
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    searchSwitch() {
      return this.navData.isShowSearch == 1;
    },
    contentType() {
      return this.navData.contentType == 2;
    },
    src() {
      return this.navData.logoSrc;
    },
    containStyle() {
      return { backgroundColor: this.computedStyle.statusBarColor };
    },
    containStyle1() {
      const positionChoose = this.navData.positionChoose || 0;
      if (!this.searchSwitch) {
        return { 'justify-content': positionChoose == 0 ? 'flex-start' : 'center' };
      }
      return {};
    },
    capsuleType() {
      const rgbaColor = this.computedStyle.statusBarColor;
      return rgbaColor ? getContrastYIQ(rgbaColor) : 'light';
    },
    titleStyle() {
      const style = this.computedStyle.titleDistance || {};
      const positionChoose = this.navData.positionChoose || 0;
      const result = {
        color: this.navData.statusBar == 1 ? '#000' : '#fff',
        order: positionChoose,
        background: this.computedStyle.titleBgColor,
        fontSize: `${style.fontSize || 14}px`,
        height: `${style.height || 0}px`,
        lineHeight: `${style.height || 0}px`,
      };
      if (positionChoose != 1) result.marginRight = '10px';
      return result;
    },
    serachStyle() {
      const borderType = { 1: 'none', 2: '1px solid #000', 3: '2px solid #000' };
      const borderRadiusType = { 1: '30px', 2: '0' };
      const textAlignType = { 1: 'flex-start', 2: 'center', 3: 'flex-end' };
      const style = this.computedStyle.searchDistance || {};
      const positionChoose = this.navData.positionChoose || 0;
      const result = {
        backgroundColor: this.computedStyle.searchBgColor,
        fontSize: `${style.fontSize || 14}px`,
        height: `${style.height || 29}px`,
        borderRadius: borderRadiusType[this.computedStyle.searchBorder],
        border: borderType[this.computedStyle.border],
        justifyContent: textAlignType[this.computedStyle.searchPosition],
        color: this.computedStyle.searchColor,
      };
      if (positionChoose == 1) {
        result.width = '84px';
      } else {
        result.flex = '1';
      }
      return result;
    },
    iconStyle() {
      const style = this.computedStyle.iconSize || {};
      return { width: `${style.size || 14}px`, height: `${style.size || 14}px` };
    },
  },
};
</script>

<style scoped lang="scss">
.nav-preview {
  position: relative;
}
.nav-contain {
  position: relative;
  display: flex;
  box-sizing: border-box;
  height: 44px;
  padding: 0 10px;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}
.nav-cont-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #000;
  text-align: center;
}
.logo-img {
  display: block;
  max-width: 112px;
  height: 30px;
}
.right-holder {
  width: 98px;
  order: 2;
}
.mp-capsule {
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  right: 10px;
  width: 88px;
  height: 32px;
  border-radius: 16px;
  z-index: 999;
  &.light {
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  &.dark {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.25);
  }
}
.search-input {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 141px;
  background: #ddd;
  border-radius: 44px;
  padding: 0 10px;
  color: #fff;
  border: none;
  line-height: 1;
  font-size: 14px;
}
.search-icon {
  width: 14px;
  height: 14px;
  font-size: 16px;
  margin-right: 4px;
}
.abso {
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  z-index: 100;
}
.over1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
