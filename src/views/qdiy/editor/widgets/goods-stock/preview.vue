<template>
  <div class="goods-card">
    <div class="goods-express">
      <div class="express-item">库存：22</div>
    </div>
  </div>
</template>

<script>
/** 商品库存 —— 画布预览。迁移自 PHP common/goods-stock/preview.php */
export default {
  name: 'GoodsStockPreview',
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
.goods-express {
  display: flex;
  position: relative;
  line-height: 36px;
  color: #b0b3bf;
  font-size: 12px;

  .express-item {
    width: 33.3%;
  }

  &::before {
    position: absolute;
    content: '';
    left: -12px;
    right: -12px;
    top: 0;
    border-top: 1px dashed #ededed;
  }
}
</style>
