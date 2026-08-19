<template>
  <div class="diy-template" :style="{ background: computedStyle.searchBox }">
    <div class="template-box" :style="{ ...computedStyle.searchIpts, background: computedStyle.iptBg, ...computedSize }">
      <span class="tip">模板占位组件</span>
    </div>
  </div>
</template>

<script>
/**
 * 模板占位 —— 画布预览。迁移自 PHP common/template/preview.php
 *
 * PHP 侧本就是一个空壳（内容区留了「图片位置」的注释），只提供背景/边距/圆角/比例四类样式，
 * 这里补一行占位文案，方便在画布上识别。
 */
import { getObjValue } from '../../controls/utils';

export default {
  name: 'TemplatePreview',
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
    // 比例：1=16:9，2=4:3，3=1:1
    computedSize() {
      const width = 331;
      const type = getObjValue(this.activeItem, ['computedStyle', 'proportion'], 1);
      const ratio = [0, 0.5625, 0.75, 1];
      return { height: `${width * ratio[type]}px` };
    },
  },
};
</script>

<style scoped lang="scss">
.diy-template {
  box-sizing: border-box;
  background: #fff;
  overflow: hidden;
}
.template-box {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 12px;
}
</style>
