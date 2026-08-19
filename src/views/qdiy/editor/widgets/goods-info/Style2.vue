<template>
  <div class="goods-info-style2">
    <div class="goods-card">
      <div class="goods-price">
        ￥
        <span v-if="goodsData.price == 1" class="amount">88-100</span>
        <span v-else class="amount">88</span>
      </div>
      <div class="goods-cont">
        <div class="goods-cont-left">
          <div class="goods-title">商品标题</div>
          <div class="goods-subtitle">商品副标题</div>
        </div>
        <div v-if="goodsData.share == 1" class="goods-cont-right">
          <i class="el-icon-share" />
        </div>
      </div>
      <div class="goods-express">
        <div>
          快递：￥
          <span v-if="goodsData.delivery == 1">10-22</span>
          <span v-else>10</span>
        </div>
        <div>销量：22</div>
        <div>库存：22</div>
      </div>
      <div v-if="goodsData.commission" class="goods-commison">
        <span>预计佣金</span>
        <span class="commison-money">￥12.4</span>
      </div>
    </div>
  </div>
</template>

<script>
/** 商品信息 风格2 —— 画布预览子组件。迁移自 PHP style-components/goods-info/style2.php */
export default {
  name: 'GoodsInfoStyle2',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
    goodsData: {
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
.goods-price {
  color: #db0505;
  font-weight: 700;

  .amount {
    font-size: 24px;
  }
}
.goods-cont {
  display: flex;
  justify-content: space-between;
  padding-top: 6px;
}
.goods-title {
  font-size: 16px;
  font-weight: 700;
}
.goods-subtitle {
  font-size: 14px;
  color: #b0b3bf;
}
.goods-cont-right {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  color: #666;
}
.goods-express {
  display: flex;
  justify-content: space-between;
  line-height: 36px;
  color: #b0b3bf;
  font-size: 12px;
}
.goods-commison {
  font-size: 12px;
  color: #666;

  .commison-money {
    color: #db0505;
    padding-left: 4px;
  }
}
</style>
