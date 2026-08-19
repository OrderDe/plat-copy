<template>
  <div class="goods-card">
    <div class="goods-cell-item">
      <div class="cell-title">领券</div>
      <div class="cell-cont">
        <div class="cell-coupon">满25立减9.9元</div>
        <div class="cell-coupon">满50立减10元</div>
      </div>
    </div>
  </div>
</template>

<script>
/** 商品优惠券 —— 画布预览。迁移自 PHP common/goods-coupon/preview.php，券由商品数据决定 */
export default {
  name: 'GoodsCouponPreview',
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
    flex-shrink: 0;
  }
  .cell-cont {
    display: flex;
    flex: 1;
    margin-left: 20px;
    padding: 15px 0;
    font-size: 14px;
  }
  .cell-coupon {
    padding: 2px 12px;
    font-size: 12px;
    color: #fff;
    border-radius: 12px;
    margin-right: 8px;
    flex-shrink: 0;
    background-color: #db0505;
  }
}
</style>
