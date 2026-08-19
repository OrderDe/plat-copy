<template>
  <div class="goods-card">
    <div class="goods-cell-item">
      <div class="cell-title">已选</div>
      <div class="cell-cont">默认</div>
      <i class="el-icon-arrow-right" />
    </div>
  </div>
</template>

<script>
/** 商品规格 —— 画布预览。迁移自 PHP common/goods-attr/preview.php，内容固定由商品数据决定 */
export default {
  name: 'GoodsAttrPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style scoped lang="scss">
.goods-card {
  position: relative;
  width: 100%;
  background-color: #fff;
  padding: 10px 12px 5px;
  box-sizing: border-box;
}
.goods-cell-item {
  display: flex;
  align-items: center;

  .cell-title {
    color: #808080;
    font-size: 12px;
    font-weight: 700;
  }
  .cell-cont {
    flex: 1;
    margin-left: 20px;
    padding: 15px 0;
    font-size: 14px;
  }
}
</style>
