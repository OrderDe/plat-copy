<template>
  <div class="goods-card">
    <div class="goods-cell-item">
      <div class="cell-title">服务</div>
      <div class="cell-cont">
        <div v-for="(it, i) in serveList" :key="i" class="serve-item">
          <i class="el-icon-circle-check" />
          <span>{{ it }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/** 商品服务 —— 画布预览。迁移自 PHP common/goods-service/preview.php，服务项由商品数据决定 */
export default {
  name: 'GoodsServicePreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      serveList: ['7天包退换', '全国包邮'],
    };
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
  .serve-item {
    margin-right: 20px;
    color: #535353;
  }
}
</style>
