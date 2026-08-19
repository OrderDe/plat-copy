<template>
  <div class="video-preview-box" :style="{ background: computedStyle.searchBox }">
    <div class="video-preview-img" :style="{ ...computedSize, ...inputStyle }">
      <div class="video-preview-icon">
        <i class="el-icon-video-play" />
      </div>
      <img v-if="imageUrl" :src="imageUrl" class="cover-img" alt="" />
    </div>
  </div>
</template>

<script>
/**
 * 视频 —— 画布预览
 * 迁移自 PHP common/video/preview.php
 *
 * 封面图缺省时原实现指向 resources/img/decorate/default_img.png，
 * 平台端没有该资源，改为不渲染 img，只留播放图标与背景。
 */
import { getObjValue } from '../../controls/utils';

export default {
  name: 'VideoPreview',
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
    imageUrl() {
      return (this.activeItem.data && this.activeItem.data.imageUrl) || '';
    },
    // 比例：1 = 16:9，2 = 4:3，3 = 1:1
    computedSize() {
      const width = 375;
      const type = getObjValue(this.activeItem, ['computedStyle', 'proportion'], 1);
      const ratio = [0, 0.5625, 0.75, 1];
      return { height: `${width * ratio[type]}px` };
    },
    inputStyle() {
      const tabItem = this.computedStyle.tabItem;
      const style = {
        background: this.computedStyle.iptBg,
        ...(this.computedStyle.searchIpts || {}),
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
.video-preview-box {
  overflow: hidden;
}
.video-preview-img {
  position: relative;
  font-size: 0;
  overflow: hidden;
  background: #ddd;
}
.video-preview-icon {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 50px;
  height: 50px;
  margin: auto;
  font-size: 50px;
  color: #fff;
  z-index: 1;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
