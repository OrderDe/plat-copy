<template>
  <div class="goods-info-style1">
    <div class="goods-card">
      <div class="price-box">
        <div style="flex: 1">
          <div v-if="getShowTags('price')" class="price-line">
            <div class="price">￥<span class="amount">88</span></div>
            <div class="origin-price">￥99</div>
          </div>
        </div>
        <div class="goods-share">
          <div v-if="getShowTags('share')" class="share-item">
            <i class="el-icon-share" />
            <div class="share-title">分享</div>
          </div>
          <div v-if="getShowTags('collect')" class="share-item">
            <i class="el-icon-star-off" />
            <div class="share-title">收藏</div>
          </div>
        </div>
      </div>

      <div v-if="getShowTags('memberPrice')" class="member-price-container">
        <span class="member-badge">VIP</span>
        <span class="member-price-title">会员价</span>
        <span class="member-price-title">￥73</span>
      </div>

      <div v-if="getShowTags('title')" class="goods-title">商品标题</div>
      <div v-if="getShowTags('subtitle')" class="goods-subtitle">商品副标题</div>

      <div v-if="getShowTags('scoreDeduct')" class="addons-fields-style">可用积分抵扣25元</div>

      <div class="goods-express">
        <div v-if="getShowTags('sale')" class="express-item">销量：22</div>
        <div v-if="getShowTags('stock')" class="express-item">库存：22</div>
      </div>

      <div v-if="getShowTags('coupon')" class="goods-cell-item goods-line-item">
        <div class="cell-title">领券</div>
        <div class="cell-cont">
          <div class="cell-coupon">满25立减9.9元</div>
          <div class="cell-coupon">满50立减10元</div>
        </div>
      </div>

      <div class="goods-cell-item">
        <div class="cell-title">已选</div>
        <div class="cell-cont">默认</div>
        <i class="el-icon-arrow-right" />
      </div>

      <div v-if="getShowTags('shopTag')" class="goods-cell-item">
        <div class="cell-title">商品标签</div>
        <div class="shopLabelContent">
          <div v-for="(item, index) in shopTags" :key="index" class="shopLabel">
            <span class="label-text">{{ item }}</span>
          </div>
        </div>
      </div>

      <div v-if="getShowTags('serve')" class="goods-cell-item">
        <div class="cell-title">服务</div>
        <div class="cell-cont">
          <div v-for="(it, i) in serveList" :key="i" class="serve-item">
            <i class="el-icon-circle-check cell-color-r" />
            <span>{{ it }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 商品信息 风格1 —— 画布预览子组件
 * 迁移自 PHP style-components/goods-info/style1.php
 *
 * 原实现另外请求了两个 PHP 接口：
 *   mall/decorate/setting        取 global_goods_need（是否全局商品，控制库存/领券/服务是否显示）
 *   mall/diy/get-addons-fields   取插件扩展字段
 * Java 侧无对应接口，这两处按「不隐藏、无扩展字段」处理，只影响画布示意，不影响保存的数据。
 */
export default {
  name: 'GoodsInfoStyle1',
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
  data() {
    return {
      shopTags: ['标签1', '标签2', '标签3', '标签4', '标签5'],
      serveList: ['7天包退换', '全国包邮'],
    };
  },
  methods: {
    getShowTags(name) {
      const arr = this.goodsData.checkList || [];
      return arr.indexOf(name) > -1;
    },
  },
};
</script>

<style scoped lang="scss">
.cell-color-r {
  color: #db0505;
}
.goods-card {
  position: relative;
  width: 100%;
  background-color: #fff;
  padding: 10px 12px 5px;
  box-sizing: border-box;
}
.price-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.price-line {
  display: flex;
  align-items: flex-end;
  font-size: 16px;

  .price {
    font-weight: 700;
    color: #db0505;
  }
  .amount {
    font-size: 28px;
  }
  .origin-price {
    color: #999;
    text-decoration: line-through;
    padding-left: 10px;
    padding-bottom: 5px;
  }
}
.goods-title {
  font-size: 16px;
  font-weight: 700;
  padding: 8px 0;
}
.goods-subtitle {
  font-size: 14px;
  color: #b0b3bf;
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
  .serve-item {
    margin-right: 20px;
    color: #535353;
  }
}
.goods-line-item {
  position: relative;

  &::before {
    position: absolute;
    content: '';
    left: -12px;
    right: -12px;
    bottom: 0;
    border-top: 1px solid #ededed;
  }
}
.shopLabelContent {
  display: flex;
  margin-left: 2.5px;
  max-width: 300px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
  .shopLabel {
    font-size: 12px;
    color: #db0505;
    padding: 2px 4px;
    border-radius: 5px;
    border: 0.5px solid #db0505;
    margin: 0 2.5px;
  }
}
.goods-share {
  display: flex;
  align-items: center;

  .share-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 45px;
    width: 45px;
    color: #333;
    border-radius: 50%;
    background: #f5f5f5;
    margin-right: 5px;
  }
  .share-title {
    font-size: 11px;
    transform: scale(0.7);
  }
}
.member-price-container {
  display: flex;
  align-items: center;
}
.member-badge {
  background: #f0c14b;
  color: #7a4b00;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
}
.member-price-title {
  font-size: 16px;
  padding-left: 3px;
}
.addons-fields-style {
  color: gray;
  padding-top: 6px;
}
</style>
