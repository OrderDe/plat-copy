<template>
  <div class="diy-bg-music" :style="broadcastStyle">
    <div class="bg-music-box">
      <i class="el-icon-headset bg-music-inner" />
    </div>
  </div>
</template>

<script>
/**
 * 背景音乐 —— 画布预览。迁移自 PHP common/bg-music/preview.php
 *
 * PHP 侧用 /diy/bg-music/bgm-bg.png + bgm-inner.png 两张图做圆形唱片，
 * 平台端无该素材，改用 CSS 圆形底 + Element 耳机图标等价呈现。
 */
export default {
  name: 'BgMusicPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    broadcastStyle() {
      const style = (this.activeItem.computedStyle || {}).broadcastStyle;
      return style || { top: '10px', right: '10px' };
    },
  },
};
</script>

<style scoped lang="scss">
.diy-bg-music {
  position: absolute;
  z-index: 999;

  .bg-music-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
  }

  .bg-music-inner {
    font-size: 16px;
    color: #fff;
  }
}
</style>
