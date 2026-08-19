<template>
  <div class="rubik-cube-preview" :style="{ background: computedStyle.searchBox }">
    <div :style="{ height: modelHeight, ...computedStyle.spaceStyle }">
      <div class="cube-wrap">
        <div v-for="(item, index) in cubeListInfo" :key="index" class="cube-model" :style="{ ...item.style }">
          <el-image v-if="item.img" :style="{ width: '100%', ...computedStyle.searchIpts }" :src="item.img" fit="cover" />
          <div v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 图片魔方 —— 画布预览
 * 迁移自 PHP common/rubik-cube/preview.php
 *
 * 每块区域的定位来自 style（top/left/width/height），再按边距与图片间距做二次校正，
 * 校正公式与原实现一致。
 */
export default {
  name: 'RubikCubePreview',
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
    data() {
      return this.activeItem.data || {};
    },
    cubeListInfo() {
      const list = this.data.cubeListInfo ? JSON.parse(JSON.stringify(this.data.cubeListInfo)) : [];
      const spaceStyle = this.computedStyle.spaceStyle;
      if (!spaceStyle) return list;

      const num = (v) => Number(String(v || 0).split('px')[0]) || 0;
      const marginLeft = num(spaceStyle.marginLeft);
      // 图片间距按 25% 折算，与原实现一致
      const space = this.data.spaceInfo ? this.data.spaceInfo[0].value * 0.25 : 0;

      list.forEach((v) => {
        const top = num(v.style.top);
        const left = num(v.style.left);
        const width = num(v.style.width);
        const height = num(v.style.height);
        v.style = {
          top: `${top + space}px`,
          left: left === 0 ? `${space}px` : `${left - marginLeft + space}px`,
          width: `${width - marginLeft - space * 2}px`,
          height: `${height - marginLeft - space * 2}px`,
        };
      });
      return list;
    },
    // 整体高度取魔方最高的一行，再减去左右边距
    modelHeight() {
      const cubeHeight = this.computedStyle.cubeHeight;
      const spaceStyle = this.computedStyle.spaceStyle;
      if (cubeHeight && spaceStyle) {
        const height = Number(String(cubeHeight.height).split('px')[0]) || 0;
        const marginLeft = Number(String(spaceStyle.marginLeft || 0).split('px')[0]) || 0;
        return `${height - marginLeft}px`;
      }
      if (cubeHeight) return cubeHeight.height;
      return '0px';
    },
  },
};
</script>

<style scoped lang="scss">
.rubik-cube-preview {
  display: flow-root;
  position: relative;
  min-height: 6px;
}
.cube-wrap {
  position: relative;
}
.cube-model {
  position: absolute;
  display: flex;
  justify-content: center;
}
</style>
