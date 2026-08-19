<template>
  <div class="gift-goods-preview" :style="containerStyle">
    <div v-if="diyData.titleRadio" class="gift-header" :style="headerStyle">
      <div class="gift-title">{{ diyData.title || '赠送商品' }}</div>
      <div class="gift-more">更多 ></div>
    </div>
    <div class="gift-content" :style="{ background: computedStyle.goodsBg }">
      <div v-for="(item, index) in goodsList" :key="index" class="store-item" :style="storeItemStyle">
        <div class="store-logo">
          <el-image v-if="item.img" style="width: 100%; height: 100%" :src="item.img" fit="cover" />
          <div v-else class="img-holder"><i class="el-icon-present" /></div>
          <div class="shop-img-num">赠送数:{{ item.gift_num }}</div>
        </div>
        <div class="store-name">{{ item.goods_name }}</div>
        <div class="store-price">￥{{ item.price }}</div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 赠送商品 —— 画布预览。迁移自 PHP common/gift-goods/preview.php
 *
 * PHP 侧直接用已选项的 params 渲染，Java 侧 params 只有 id（无图无名），
 * 因此名称/价格/赠送数用示例值，图有则显示。
 */
export default {
  name: 'GiftGoodsPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    diyData() {
      return this.activeItem.data || {};
    },
    goodsList() {
      const goods = this.diyData.goods || [];
      if (!goods.length) return [{ goods_name: '商品名称', price: 100, gift_num: 1, img: '' }];
      return goods.map((it) => ({
        goods_name: (it.params && it.params.name) || '商品名称',
        price: (it.params && it.params.price) || 100,
        gift_num: (it.params && it.params.gift_num) || 1,
        img: (it.params && it.params.img) || '',
      }));
    },
    containerStyle() {
      const { marginTop, marginBottom, aroundMargin, boxBg, searchIpts, tabItem } = this.computedStyle;
      const style = {
        margin: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}`,
        background: boxBg,
        ...searchIpts,
      };
      if (tabItem) {
        if (tabItem.value === 'border') style.border = `1px solid ${tabItem.color || 'transparent'}`;
        if (tabItem.value === 'shadow' || tabItem.value === 'shandow') {
          style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
        }
      }
      return style;
    },
    headerStyle() {
      const { paddingTop, paddingBottom } = this.diyData;
      return {
        paddingTop: paddingTop >= 0 ? `${paddingTop}px` : '10px',
        paddingBottom: paddingBottom >= 0 ? `${paddingBottom}px` : '10px',
      };
    },
    storeItemStyle() {
      return { marginRight: this.computedStyle.spacing || '12px' };
    },
  },
};
</script>

<style scoped lang="scss">
.gift-goods-preview {
  position: relative;
  overflow: hidden;
  padding: 16px;
}
.gift-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}
.gift-title {
  font-size: 14px;
  font-weight: 800;
  color: #333;
}
.gift-more {
  font-size: 12px;
  color: #666;
}
.gift-content {
  display: flex;
  width: 100%;
  background-color: #fff;
  overflow: hidden;
}
.store-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  flex-shrink: 0;
}
.store-logo {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
}
.img-holder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 22px;
}
.shop-img-num {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 80px;
  height: 19px;
  line-height: 19px;
  text-align: center;
  background: rgba(51, 51, 51, 0.6);
  border-radius: 0 0 10px 10px;
  font-size: 11px;
  color: #fff;
}
.store-name {
  font-size: 12px;
  padding-top: 4px;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.store-price {
  font-size: 12px;
  color: #db0505;
}
</style>
