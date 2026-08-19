<template>
  <div class="blindbox-goods-preview">
    <div class="title" :style="titleStyle">{{ blindData.title }}</div>
    <div class="blindbox-goods-box" :style="boxStyle">
      <div v-for="(it, i) in goodsList" :key="i" class="shop-box-blind" :style="goodsStyle">
        <div class="blind-shop-img">
          <el-image v-if="it.img" style="width: 100%; height: 100%" :src="it.img" fit="cover" />
          <div v-else class="img-holder"><i class="el-icon-box" /></div>
        </div>
        <div class="blind-goods-name">{{ it.goods_name }}</div>
        <div class="goods-info">
          <div class="goods-price"><span class="size1">¥</span><span class="size2">{{ it.price }}</span></div>
          <i class="el-icon-shopping-cart-2 cart-icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 盲盒商品 —— 画布预览。迁移自 PHP common/blindbox-goods/preview.php
 *
 * PHP 侧的加购图标来自盲盒插件静态资源，平台端换成 Element 图标；
 * 商品数据按已选活动数量渲染示例卡片（Java 侧无盲盒模块接口）。
 */
export default {
  name: 'BlindboxGoodsPreview',
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
    blindData() {
      return this.activeItem.data || {};
    },
    goodsList() {
      const goods = this.blindData.goods || [];
      const count = goods.length || 2;
      return new Array(count).fill(null).map(() => ({ goods_name: '商品名称', price: 100, img: '' }));
    },
    titleStyle() {
      const { paddingTop, paddingBottom, paddingLeft, paddingRight } = this.blindData;
      const px = (v) => (v >= 0 ? `${v}px` : '10px');
      return {
        paddingTop: px(paddingTop),
        paddingRight: px(paddingRight),
        paddingBottom: px(paddingBottom),
        paddingLeft: px(paddingLeft),
      };
    },
    boxStyle() {
      const { marginTop, marginBottom, aroundMargin, boxBg } = this.computedStyle;
      return {
        padding: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}`,
        background: boxBg,
      };
    },
    goodsStyle() {
      const { tabItem, searchIpts, goodsBg, spacing } = this.computedStyle;
      const style = { marginRight: spacing, background: goodsBg, ...searchIpts };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
  },
};
</script>

<style scoped lang="scss">
.blindbox-goods-preview {
  overflow: hidden;
}
.title {
  font-size: 15px;
  font-weight: bold;
}
.blindbox-goods-box {
  display: flex;
  overflow: hidden;
}
.shop-box-blind {
  width: 120px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
.blind-shop-img {
  width: 100%;
  height: 120px;
}
.img-holder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 24px;
}
.blind-goods-name {
  font-size: 12px;
  padding: 4px 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goods-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px 6px;
}
.goods-price {
  color: #db0505;

  .size1 {
    font-size: 11px;
  }
  .size2 {
    font-size: 15px;
    font-weight: bold;
  }
}
.cart-icon {
  font-size: 18px;
  color: #db0505;
}
</style>
