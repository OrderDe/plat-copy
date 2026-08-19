<template>
  <div class="star-car-care-preview" :style="{ background: computedStyle.searchBox }">
    <div class="preview-model" :style="{ ...computedStyle.spaceStyle, display: imgAdData.typeIndex == 1 ? 'flex' : '' }">
      <div
        v-for="(item, index) in imgList"
        :key="index"
        :style="{ width: imgAdData.typeIndex == 1 ? '50%' : '', ...imgMarginStyle }"
      >
        <el-image v-if="item.imgUrl" :style="computedStyle.searchIpts" :src="item.imgUrl" />
        <div v-else class="img-holder" :style="computedStyle.searchIpts"><i class="el-icon-picture-outline" /></div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 星级洗车 —— 画布预览。迁移自 PHP common/star-car-care/preview.php
 *
 * 结构就是一组图片广告（单列 / 双列），与 xun-ai 的 preview.php 完全一致。
 */
export default {
  name: 'StarCarCarePreview',
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
    imgList() {
      const arr = this.imgAdData.imgAdArr || [];
      return arr.length ? arr : [{ imgUrl: '' }];
    },
    imgMarginStyle() {
      const spaceInfo = this.imgAdData.spaceInfo;
      if (!spaceInfo || !spaceInfo[0]) return {};
      const marginVal = spaceInfo[0].value || 0;
      const obj = { marginBottom: `${marginVal}px` };
      if (this.imgAdData.typeIndex == 1) obj.padding = `${marginVal * 0.5}px`;
      return obj;
    },
  },
};
</script>

<style scoped lang="scss">
.star-car-care-preview {
  overflow: hidden;
}
.img-holder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 24px;
}
</style>
