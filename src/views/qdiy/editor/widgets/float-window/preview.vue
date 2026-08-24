<template>
  <div class="diy-float-window" :style="[broadcastStyle, sizeStyle, { opacity: opacity }]">
    <el-image v-if="imgUrl" class="fw-img" :src="imgUrl" fit="cover" />
    <div v-else class="fw-empty">
      <i class="el-icon-picture-outline" />
    </div>
    <div v-if="closable" class="fw-close">
      <i class="el-icon-close" />
    </div>
  </div>
</template>

<script>
/**
 * 悬浮窗 —— 画布预览
 *
 * 与 bg-music 一样用 absolute 浮在手机壳里，位置取装修端算好的 broadcastStyle。
 * 没配图时给个占位方块，否则组件加进来后画布上什么都看不见，像是没添加成功。
 */
export default {
  name: 'FloatWindowPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    data() {
      return this.activeItem.data || {};
    },
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    imgUrl() {
      const list = this.data.imgInfos || [];
      return (list[0] && list[0].imgUrl) || '';
    },
    broadcastStyle() {
      return this.computedStyle.broadcastStyle || { bottom: '10px', right: '10px' };
    },
    sizeStyle() {
      return this.computedStyle.floatSize || { width: '60px', height: '60px' };
    },
    closable() {
      return this.data.closable !== 0;
    },
    opacity() {
      const val = Number(this.data.opacity);
      return val > 0 ? val / 100 : 1;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-float-window {
  position: absolute;
  z-index: 999;
}
.fw-img {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}
.fw-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  border: 1px dashed #d5d5d5;
  color: #c0c4cc;
  font-size: 20px;
}
.fw-close {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 14px;
  height: 14px;
  line-height: 14px;
  text-align: center;
  font-size: 10px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
}
</style>
