<template>
  <div class="img-ad-preview" :style="{ background: computedStyle.searchBox }">
    <div
      class="img-ad-preview-model"
      :style="{ ...computedStyle.spaceStyle, display: imgAdData.typeIndex == 1 ? 'flex' : '' }"
    >
      <div
        v-for="(item, index) in imgAdData.imgAdArr"
        :key="index"
        :style="{ width: imgAdData.typeIndex == 1 ? '50%' : '', ...imgAdMarginStyle }"
      >
        <el-image :style="{ ...computedStyle.searchIpts }" :src="item.imgUrl" />
      </div>
    </div>
  </div>
</template>

<script>
/** 图片广告 —— 画布预览。迁移自 PHP common/img-ad/preview.php */
export default {
  name: 'ImgAdPreview',
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
    // 图片间距取 spaceInfo 的第一项，两列布局时折半作为内边距
    imgAdMarginStyle() {
      const spaceInfo = this.imgAdData.spaceInfo;
      if (!spaceInfo || !spaceInfo[0]) return {};
      const marginVal = spaceInfo[0].value || 0;
      const obj = { marginBottom: `${marginVal}px` };
      if (this.imgAdData.typeIndex == 1) {
        obj.padding = `${marginVal * 0.5}px`;
      }
      return obj;
    },
  },
};
</script>

<style scoped lang="scss">
.img-ad-preview {
  box-sizing: border-box;
  overflow: hidden;
  ::v-deep .el-image {
    display: block;
  }
}
.img-ad-preview-model {
  flex-wrap: wrap;
}
</style>
