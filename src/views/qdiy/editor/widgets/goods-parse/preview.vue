<template>
  <div class="goods-parse-preview">
    <div :style="parseStyle">
      <div class="goods-parse-title">
        <div class="title-line" />
        <div class="title-text">商品介绍</div>
        <div class="title-line" />
      </div>
      <div class="goods-parse-body">
        <i class="el-icon-picture-outline" />
        <span>商品详情图</span>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 商品介绍 —— 画布预览。迁移自 PHP common/goods-parse/preview.php
 *
 * PHP 侧用 resources/img/decorate/goods_banner.png 占位，平台端无该资源，改为占位块。
 */
export default {
  name: 'GoodsParsePreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    parseStyle() {
      const { marginTop, marginBottom, aroundMargin } = this.activeItem.computedStyle || {};
      return { margin: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}` };
    },
  },
};
</script>

<style scoped lang="scss">
.goods-parse-preview {
  box-sizing: border-box;
  overflow: hidden;
}
.goods-parse-title {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;

  .title-line {
    width: 17px;
    height: 1px;
    background-color: #999;
  }
  .title-text {
    margin: 0 10px;
    font-size: 12px;
    color: #666;
  }
}
.goods-parse-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 12px;

  i {
    font-size: 28px;
    margin-bottom: 6px;
  }
}
</style>
