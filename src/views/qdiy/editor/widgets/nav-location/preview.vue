<template>
  <div :class="{ abso: searchData.styleChoose == 2 }">
    <!-- 定位条：风格 1 不显示 -->
    <div :style="getLocationStyle">
      <div v-if="locationStyle == 2" class="location-center">
        <span class="location-style-2-span"><i class="el-icon-location location-icon" /></span>
        <span class="location-city">广州</span>
        <span class="location-direction"><i class="el-icon-arrow-down location-icon" /></span>
      </div>
      <div v-if="locationStyle == 3" class="location-center">
        <span class="location-style-3-span">明日达超市</span>
        <span class="location-style-3-middle-span">云天大厦-美佳宜</span>
        <span class="location-direction"><i class="el-icon-arrow-right location-icon" /></span>
      </div>
      <div v-if="locationStyle == 4" class="location-center">
        <span class="location-style-2-span"><i class="el-icon-location location-icon" /></span>
        <span class="location-city">云天大厦-美佳宜</span>
        <span class="location-direction"><i class="el-icon-arrow-right location-icon" /></span>
      </div>
      <div v-if="locationStyle != 1" class="mp-capsule mp-location-capsule" :class="capsuleTheme" />
    </div>

    <div class="nav-location-preview" :style="containStyle">
      <div class="nav-contain" :style="containStyle1">
        <div v-if="isShowName" class="nav-cont-title over1" :style="titleStyle">
          <img v-if="contentType" :src="src" class="title-img-logo" >
          <span v-else>{{ searchData.name || '标题' }}</span>
        </div>

        <div v-if="searchSwitch" class="search-input over1" :style="serachStyle">
          <i class="search-icon el-icon-search" :style="iconStyle" />
          <span class="over1">{{ searchData.placeholder || '请输入描述' }}</span>
        </div>
        <div v-if="searchSwitch && statusCapsule == 1" class="capsule-placeholder" />

        <div :style="positionContainerStyle">
          <img v-if="contentType" :src="src" class="title-img-logo" >
          <span v-else>{{ searchData.name || '标题' }}</span>
        </div>
      </div>
      <div v-if="statusCapsule == 1" class="mp-capsule" :class="capsuleTheme" />
    </div>
  </div>
</template>

<script>
/**
 * 定位导航 —— 画布预览。迁移自 PHP common/nav-location/preview.php
 *
 * PHP 侧小程序胶囊用 nav/light2.png、dark2.png 两张图，平台端无该资源，
 * 改用 CSS 画的胶囊，明暗按 getContrastYIQ(背景色) 切换，与原逻辑一致。
 */
import { getContrastYIQ } from '../../controls/utils';

const BORDER_TYPE = { 1: 'none', 2: '1px solid #000', 3: '2px solid #000' };
const BORDER_RADIUS_TYPE = { 1: '30px', 2: '0' };
const TEXT_ALIGN_TYPE = { 1: 'flex-start', 2: 'center', 3: 'flex-end' };

export default {
  name: 'NavLocationPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    searchData() {
      return this.activeItem.data || {};
    },
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    locationStyle() {
      return this.searchData.locationStyle || 1;
    },
    getLocationStyle() {
      if (this.locationStyle == 1) return { display: 'none' };
      return { display: 'flex', height: '44px', position: 'relative' };
    },
    capsuleTheme() {
      const color = this.computedStyle.statusBarColor;
      return color ? getContrastYIQ(color) : 'light';
    },
    positionContainerStyle() {
      const result = { display: 'none', opacity: 0 };
      const positionChoose = this.searchData.positionChoose || 0;
      if ([2, 3].includes(Number(this.locationStyle)) && positionChoose == 1) {
        result.display = 'block';
        result.order = 3;
      }
      return result;
    },
    containStyle1() {
      const positionChoose = this.searchData.positionChoose || 0;
      const result = {};
      if (!this.searchSwitch) {
        result['justify-content'] = positionChoose == 0 ? 'flex-start' : 'center';
      }
      return result;
    },
    contentType() {
      return this.searchData.contentType == 2;
    },
    containStyle() {
      return { backgroundColor: this.computedStyle.statusBarColor };
    },
    titleStyle() {
      const style = this.computedStyle.titleDistance || {};
      const color = this.computedStyle.statusBar == 1 ? '#000' : '#fff';
      const positionChoose = this.searchData.positionChoose || 0;
      const result = {
        color,
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
      const cs = this.computedStyle;
      const style = cs.searchDistance || {};
      const positionChoose = this.searchData.positionChoose || 0;
      const result = {
        backgroundColor: cs.searchBgColor,
        fontSize: `${style.fontSize || 14}px`,
        height: `${style.height || 29}px`,
        borderRadius: BORDER_RADIUS_TYPE[cs.searchBorder] || BORDER_RADIUS_TYPE[1],
        border: BORDER_TYPE[cs.border] || BORDER_TYPE[1],
        justifyContent: TEXT_ALIGN_TYPE[cs.searchPosition] || TEXT_ALIGN_TYPE[1],
        color: cs.searchColor,
      };
      if (positionChoose == 1) {
        result.width = '84px';
      } else {
        result.flex = '1';
      }
      return result;
    },
    src() {
      return this.searchData.logoSrc;
    },
    iconStyle() {
      const style = this.computedStyle.iconSize || {};
      return { width: `${style.size || 14}px`, height: `${style.size || 14}px` };
    },
    searchSwitch() {
      return this.searchData.isShowSearch == 1;
    },
    isShowName() {
      return this.searchData.isShowName == 1;
    },
    statusCapsule() {
      return this.computedStyle.statusCapsule || 1;
    },
  },
};
</script>

<style scoped lang="scss">
.nav-location-preview {
  position: relative;
}
.nav-contain {
  display: flex;
  position: relative;
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
.title-img-logo {
  display: block;
  max-width: 112px;
  height: 30px;
}
.over1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.capsule-placeholder {
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
    border: 1px solid rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.15);
  }
  &.dark {
    border: 1px solid rgba(0, 0, 0, 0.25);
    background: rgba(0, 0, 0, 0.08);
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
  font-size: 16px;
  margin-right: 4px;
}
.abso {
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  z-index: 100;
}
.location-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
.location-icon {
  font-size: 14px;
  font-weight: bolder;
}
.location-style-2-span {
  padding: 2px 10px 0 12px;
}
.location-city {
  font-weight: bolder;
}
.location-direction {
  padding-left: 6px;
  padding-top: 2px;
}
.location-style-3-span {
  padding-left: 12px;
  font-weight: bolder;
}
.location-style-3-middle-span {
  padding-left: 10px;
  font-weight: bolder;
}
</style>
