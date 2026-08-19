<template>
  <div class="position-preview-box" :style="[boxStyle]">
    <div class="position-iconaddr">
      <i class="el-icon-location-outline" :style="{ color: computedStyle.iconColor }" />
    </div>
    <div class="position-store-info">
      <div class="store-info-name">
        <div class="info-sname" :style="{ color: computedStyle.storeNameColor }">慕思国际专卖店</div>
        <i class="el-icon-arrow-down info-arrow-icon" :style="{ color: computedStyle.arrowColor }" />
      </div>
      <div class="store-info-distance" :style="{ color: computedStyle.storeDistanceColor }">距离您21.6km</div>
    </div>
    <div class="position-reload">
      <i class="el-icon-aim reload-aim-icon" :style="{ color: computedStyle.iconColor }" />
      <span class="reload-text" :style="{ color: computedStyle.btnColor }">重新定位</span>
    </div>
  </div>
</template>

<script>
/**
 * 定位 —— 画布预览
 * 迁移自 PHP common/position/preview.php
 *
 * 原实现用的是自带字体图标 iconfont（icon-location / icon-arrow-down / icon-aim），
 * Java 平台端没有这套字体，改用 Element 的等价图标。
 */
export default {
  name: 'PositionPreview',
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
    boxStyle() {
      const sizeObj = this.computedStyle.sizeObj || {};
      const radius = this.computedStyle.searchIpts || {};
      return {
        background: this.computedStyle.background,
        margin: `${sizeObj.marginTop || 0} ${sizeObj.aroundMargin || 0} ${sizeObj.marginBottom || 0}`,
        borderRadius: [
          radius['border-top-left-radius'],
          radius['border-top-right-radius'],
          radius['border-bottom-right-radius'],
          radius['border-bottom-left-radius'],
        ]
          .map((v) => v || 0)
          .join(' '),
      };
    },
  },
};
</script>

<style scoped lang="scss">
.position-preview-box {
  display: flex;
  padding: 19px 12px 12px;
  border-radius: 4px;
  background-color: #fff;
}
.position-iconaddr {
  margin-right: 3px;
  line-height: 1;
  font-size: 18px;
  color: #8599ae;
}
.position-store-info {
  flex: 1;
}
.store-info-name {
  display: flex;
  align-items: center;
  font-size: 14px;
  max-width: 275px;
  line-height: 20px;
  margin-bottom: 9px;
  font-weight: 700;
  .info-sname {
    margin-right: 2px;
    color: #2f3033;
  }
}
.info-arrow-icon {
  color: #8599ae;
  font-weight: 500;
}
.store-info-distance {
  font-size: 11px;
  color: #989ba6;
}
.position-reload {
  display: flex;
  align-items: center;
  font-size: 12px;
}
.reload-aim-icon {
  color: #8599ae;
  margin-right: 2px;
}
.reload-text {
  color: #676769;
}
</style>
