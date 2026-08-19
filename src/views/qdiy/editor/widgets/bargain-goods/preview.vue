<template>
  <div class="bargain-goods-preview" :style="{ background: computedStyle.bgColor }">
    <div :style="bargainBox">
      <div v-if="showTitle" class="bargain-goods-title" :style="titleStyle">{{ comData.title || '砍价商品' }}</div>
      <div v-for="(item, index) in goodsList" :key="index" class="bargain-goods-item" :style="goodsStyle">
        <div class="goods-img"><i class="el-icon-picture-outline" /></div>
        <div class="goods-content">
          <div class="goods-name">{{ item.goods_name }}</div>
          <div class="goods-row">
            <div class="goods-price">
              <div class="goods-origin-price">￥{{ item.price }}</div>
              <div class="goods-min-price">
                最低￥<span :style="{ color: computedStyle.priceColor }">{{ item.group_buy_price }}</span>
              </div>
            </div>
            <div class="goods-btn" :style="btnStyle">{{ btnName }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 砍价商品 —— 画布预览。迁移自 PHP common/bargain-goods/preview.php
 *
 * PHP 侧按活动 id 请求砍价模块接口取真实数据，Java 侧无该模块，按已选数量渲染示例卡片。
 */
const DEMO_ITEM = { goods_name: '商品名称', price: 300, group_buy_price: 100 };

export default {
  name: 'BargainGoodsPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
    btnName: {
      type: String,
      default: '立即参与',
    },
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    comData() {
      return this.activeItem.data || {};
    },
    showTitle() {
      return this.comData.titleRadio || 0;
    },
    goodsList() {
      const count = (this.comData.goods || []).length || 1;
      return new Array(count).fill(null).map(() => ({ ...DEMO_ITEM }));
    },
    titleStyle() {
      const { paddingTop, paddingBottom } = this.comData;
      return {
        paddingTop: paddingTop >= 0 ? `${paddingTop}px` : '10px',
        paddingBottom: paddingBottom >= 0 ? `${paddingBottom}px` : '10px',
      };
    },
    bargainBox() {
      const { marginTop, marginBottom, aroundMargin } = this.computedStyle;
      return { margin: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}`, overflow: 'hidden' };
    },
    goodsStyle() {
      const { tabItem, searchIpts, spacing } = this.computedStyle;
      const style = { marginTop: spacing, ...searchIpts };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    btnStyle() {
      return { color: this.computedStyle.btnTextColor, background: this.computedStyle.btnBackground };
    },
  },
};
</script>

<style scoped lang="scss">
.bargain-goods-preview {
  overflow: hidden;
}
.bargain-goods-title {
  font-size: 16px;
  font-weight: bold;
  padding-left: 10px;
}
.bargain-goods-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 8px;
  box-sizing: border-box;
}
.goods-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background: #f5f5f5;
  color: #c0c4cc;
  flex-shrink: 0;
}
.goods-content {
  flex: 1;
  padding-left: 8px;
  overflow: hidden;
}
.goods-name {
  font-size: 13px;
  line-height: 18px;
  max-height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.goods-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
}
.goods-origin-price {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}
.goods-min-price {
  font-size: 12px;
  color: #333;
}
.goods-btn {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: #db0505;
  color: #fff;
  white-space: nowrap;
}
</style>
