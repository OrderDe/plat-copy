<template>
  <DiyStyleContain
    :show-title="showTitle"
    :title="title"
    :title-style="titleStyle"
    :contain-style="containStyle"
  >
    <template #right><slot name="right" /></template>
    <slot />
  </DiyStyleContain>
</template>

<script>
/**
 * 商品详情样式容器
 * 迁移自 PHP diy-goods-info-style-contain.php
 *
 * 原 PHP 文件与 diy-style-contain.php 内容完全一致（复制而来），
 * 这里保留组件名以便 P6 组件按原名引用，实现直接复用 DiyStyleContain。
 */
import DiyStyleContain from './DiyStyleContain';

export default {
  name: 'DiyGoodsInfoStyleContain',
  components: { DiyStyleContain },
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: '标题',
    },
    titleStyle: {
      type: Object,
      default: () => ({}),
    },
    containStyle: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
