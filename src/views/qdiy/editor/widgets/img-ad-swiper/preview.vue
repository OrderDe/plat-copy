<template>
  <div class="img-ad-swiper-preview" :style="{ background: computedStyle.searchBox }">
    <div class="img-ad-swiper-preview-model" :style="computedStyle.spaceStyle">
      <!-- 画布上只展示第一张，真实轮播由 App 端渲染 -->
      <div v-if="firstImg">
        <el-image :style="{ ...computedStyle.searchIpts }" :src="firstImg.imgUrl" />
      </div>
      <div v-if="dotList.length" class="dots">
        <span v-for="(d, i) in dotList" :key="i" class="dot" :class="dotClass" />
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 轮播图片 —— 画布预览
 * 迁移自 PHP common/img-ad-swiper/preview.php
 *
 * 原实现用 `v-if="index==0" v-for=...` 只渲染首图（Vue 里 v-for 与 v-if 同元素是反模式），
 * 这里改成直接取首图，行为一致；并按 dotType 画出指示点，便于所见即所得。
 */
export default {
  name: 'ImgAdSwiperPreview',
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
    imgAdData() {
      return this.activeItem.data || {};
    },
    dotList() {
      return this.imgAdData.imgAdArr || [];
    },
    firstImg() {
      return this.dotList[0];
    },
    dotClass() {
      return { 0: 'dot-circle', 1: 'dot-square', 2: 'dot-rect' }[this.imgAdData.dotType || 0];
    },
  },
};
</script>

<style scoped lang="scss">
.img-ad-swiper-preview {
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  ::v-deep .el-image {
    display: block;
  }
}
.img-ad-swiper-preview-model {
  flex-wrap: wrap;
  position: relative;
}
.dots {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dot {
  background: rgba(255, 255, 255, 0.8);
  margin: 0 3px;
  &.dot-circle {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  &.dot-square {
    width: 6px;
    height: 6px;
  }
  &.dot-rect {
    width: 12px;
    height: 4px;
    border-radius: 2px;
  }
}
</style>
