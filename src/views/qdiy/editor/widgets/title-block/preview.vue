<template>
  <div class="title-block-preview" :style="tpStyle">
    <!-- 风格 1：两侧短线居中 -->
    <div v-if="styleType === 1" class="title-block-style1">
      <div class="title-block-line" :style="{ background: computedStyle.titleColor }" />
      <div class="tb-title" :style="{ color: computedStyle.titleColor }">{{ title }}</div>
      <div class="title-block-line" :style="{ background: computedStyle.titleColor }" />
    </div>

    <!-- 风格 2：左侧竖条 -->
    <div v-else-if="styleType === 2" class="title-block-style2">
      <div class="line-left" :style="{ background: computedStyle.titleColor }" />
      <div class="tb-title" :style="{ color: computedStyle.titleColor }">{{ title }}</div>
    </div>

    <!-- 风格 3：两侧短线 + 菱形图标 -->
    <div v-else class="title-block-style3">
      <div class="title-block-line" :style="{ background: computedStyle.titleColor }" />
      <div class="title-block-icon" :style="{ color: computedStyle.titleColor }">◆</div>
      <div class="tb-title" :style="{ color: computedStyle.titleColor }">{{ title }}</div>
      <div class="title-block-icon" :style="{ color: computedStyle.titleColor }">◆</div>
      <div class="title-block-line" :style="{ background: computedStyle.titleColor }" />
    </div>
  </div>
</template>

<script>
/**
 * 标题栏 —— 画布预览
 * 迁移自 PHP common/title-block/preview.php + style-components/title-block/style1~3.php
 *
 * 原实现把三种风格拆成三个全局组件，这里合并进同一个 SFC，逻辑与样式保持一致。
 * 风格 3 的菱形原本用的是字体图标 `cust-icon icon-sijiaoxing`，
 * Java 平台端没有这套字体，改用 ◆ 字符，视觉等价。
 */
import { getObjValue } from '../../controls/utils';

export default {
  name: 'TitleBlockPreview',
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
    styleType() {
      const styleItem = (this.activeItem.data && this.activeItem.data.titleStyle) || {};
      return styleItem.type || 1;
    },
    tpStyle() {
      return {
        background: this.computedStyle.bgColor,
        paddingTop: getObjValue(this.computedStyle, ['searchIpts', 'marginTop'], 0),
        paddingBottom: getObjValue(this.computedStyle, ['searchIpts', 'marginBottom'], 0),
      };
    },
    title() {
      return (this.activeItem.data && this.activeItem.data.title) || '标题';
    },
  },
};
</script>

<style scoped lang="scss">
.title-block-style1 {
  display: flex;
  align-items: center;
  height: 33px;
  justify-content: center;
  .title-block-line {
    width: 29px;
    height: 1px;
    background-color: #000;
  }
  .tb-title {
    margin: 0 10px;
    font-size: 14px;
  }
}
.title-block-style2 {
  display: flex;
  align-items: center;
  position: relative;
  height: 33px;
  .line-left {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 10px;
    margin: auto;
    width: 2px;
    height: 14px;
    background: #000;
  }
  .tb-title {
    margin: 0 20px;
    font-size: 14px;
  }
}
.title-block-style3 {
  display: flex;
  align-items: center;
  height: 33px;
  justify-content: center;
  .title-block-line {
    width: 29px;
    height: 1px;
    background-color: #eb3534;
  }
  .title-block-icon {
    font-size: 10px;
    transform: scale(0.8, 0.8);
    color: #eb3534;
    margin: 0 4px;
  }
  .tb-title {
    margin: 0 10px;
    font-size: 14px;
  }
}
</style>
