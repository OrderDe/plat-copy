<template>
  <div class="carousel-img-preview" :style="{ background: computedStyle.searchBox, ...spaceStyle }">
    <div class="carousel-row" :style="{ background: computedStyle.iptBg }">
      <div
        v-if="searchData.buttonData && searchData.carouselImgArr && searchData.carouselImgArr.length"
        class="img-one-setyle img-two-setyle"
        :class="{ 'img-three-setyle': searchData.buttonData.typeIndex == 1 }"
      >
        <!-- 卡片式风格左右各露出一张 -->
        <el-image
          v-show="searchData.buttonData.typeIndex != 0"
          class="carousel-img"
          :class="{ 'img-two': searchData.buttonData.typeIndex != 0 }"
          :style="{ ...inputStyle, opacity: imgArr.length > 2 ? 1 : 0, ...marginStyle, ...computedStyle.searchIpts }"
          :src="lastImg"
        >
          <div slot="error" class="image-slot" />
        </el-image>

        <el-image
          class="carousel-img"
          :class="{ 'img-two': searchData.buttonData.typeIndex != 0 }"
          :style="{ ...inputStyle, ...marginStyle, ...computedStyle.searchIpts }"
          :src="imgArr[0].imgUrl"
        />

        <el-image
          v-show="searchData.buttonData.typeIndex != 0"
          class="carousel-img"
          :class="{ 'img-two': searchData.buttonData.typeIndex != 0 }"
          :style="{ ...inputStyle, opacity: imgArr.length > 1 ? 1 : 0, ...marginStyle, ...computedStyle.searchIpts }"
          :src="imgArr.length > 1 ? imgArr[1].imgUrl : ''"
        >
          <div slot="error" class="image-slot" />
        </el-image>

        <!-- 轮播点 -->
        <div v-if="searchData.buttonPointData && searchData.buttonPointData.open">
          <div
            v-if="searchData.buttonPointData.pointIndex != 3"
            class="point-style"
            :class="{
              'point-style-left': searchData.pointSiteIndex == 0,
              'point-style-right': searchData.pointSiteIndex == 2,
            }"
          >
            <span
              v-for="(item, index) in imgArr"
              :key="index"
              class="point"
              :class="{
                'point-sel': index === 0,
                'point-two-sel': index === 0 && searchData.buttonPointData.pointIndex == 1,
                'point-three': searchData.buttonPointData.pointIndex == 2,
              }"
            />
          </div>
          <div
            v-else
            class="point-style point-num"
            :class="{
              'point-style-left': searchData.pointSiteIndex == 0,
              'point-style-right': searchData.pointSiteIndex == 2,
            }"
          >
            1 / {{ imgArr.length }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 轮播图 —— 画布预览
 * 迁移自 PHP common/carousel-img/preview.php
 *
 * 原实现在 computed 里改写 activeItem.computedStyle.spaceStyle.height（在 computed 里写数据是副作用），
 * 这里改成只读地合成 spaceStyle，行为等价。
 */
export default {
  name: 'CarouselImgPreview',
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
    spaceStyle() {
      return { ...(this.computedStyle.spaceStyle || {}), height: '100%' };
    },
    imgArr() {
      return this.searchData.carouselImgArr || [];
    },
    lastImg() {
      return this.imgArr.length > 2 ? this.imgArr[this.imgArr.length - 1].imgUrl : '';
    },
    inputStyle() {
      const tabItem = this.computedStyle.tabItem;
      const style = { background: this.computedStyle.iptBg };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    // 卡片式风格下，图片间距折半分到左右
    marginStyle() {
      const d = this.searchData;
      if (d.spaceInfo && d.buttonData && d.buttonData.typeIndex != 0) {
        const marginVal = d.spaceInfo[0].value ? d.spaceInfo[0].value / 2 : 0;
        return { marginRight: `${marginVal}px`, marginLeft: `${marginVal}px` };
      }
      return {};
    },
  },
};
</script>

<style scoped lang="scss">
.carousel-img-preview {
  box-sizing: border-box;
  overflow: hidden;
  height: 210px;
}
.carousel-row {
  display: flex;
  align-items: center;
  height: 100%;
}
.img-one-setyle {
  position: relative;
  height: 100%;
  width: 100%;
}
.img-two-setyle {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
}
.carousel-img {
  height: 100%;
  overflow: hidden;
}
.img-three-setyle .carousel-img:nth-child(2n - 1) {
  height: 80%;
}
.img-two {
  width: 70%;
  flex-shrink: 0;
}
.point-style {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
}
.point-style-left {
  left: 10px;
  transform: translateX(0);
}
.point-style-right {
  right: 10px;
  left: auto;
  transform: translateX(0);
}
.point {
  display: inline-block;
  height: 6px;
  width: 6px;
  border-radius: 10px;
  background: #ccc;
  margin: 0 4px;
  &.point-three {
    height: 3px;
    width: 16px;
    border-radius: 0;
  }
  &.point-sel {
    background: #fff;
  }
  &.point-two-sel {
    height: 6px;
    width: 14px;
    border-radius: 6px;
  }
}
.point-num {
  display: inline-block;
  text-align: center;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 2px 6px;
}
</style>
