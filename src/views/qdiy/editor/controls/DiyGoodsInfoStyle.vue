<template>
  <DiyStyle
    :top-name="topName"
    :img-style="imgStyle"
    :count="count"
    :img-url="imgUrl"
    :def-index="defIndex"
    :img-info="imgInfo"
    @change="onChange"
  />
</template>

<script>
/**
 * 商品详情风格选择控件
 * 迁移自 PHP diy-goods-info-style.php
 *
 * 原 PHP 文件与 diy-style.php 逻辑完全一致（仅类名前缀与容器不同），
 * 这里保留组件名以便 P6 组件按原名引用，实现直接复用 DiyStyle。
 */
import DiyStyle from './DiyStyle';

export default {
  name: 'DiyGoodsInfoStyle',
  components: { DiyStyle },
  props: {
    topName: {
      type: String,
      default: '选择风格',
    },
    imgStyle: {
      type: Object,
      default: () => ({ width: '206px', height: 'auto' }),
    },
    count: {
      type: [String, Number],
      default: 4,
    },
    imgUrl: {
      type: String,
      default: '',
    },
    defIndex: {
      type: Number,
      default: 0,
    },
    imgInfo: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    onChange(index, item) {
      this.$emit('change', index, item);
    },
  },
};
</script>
