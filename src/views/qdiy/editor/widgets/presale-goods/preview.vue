<template>
  <div class="presale-goods-preview" :style="{ background: computedStyle.bgColor }">
    <div :style="groupBox">
      <div v-if="isShowTitle" class="presale-title" :style="titleStyle">{{ comData.title || '预售商品' }}</div>

      <div class="presale-list" :class="`style-${styleVal}`">
        <div v-for="(it, i) in goodsList" :key="i" class="presale-item" :style="goodsStyle">
          <div class="goods-img">
            <div v-if="isShowHot" class="goods-hot" :style="hotStyle">{{ hotName }}</div>
            <i class="el-icon-picture-outline" />
          </div>
          <div class="goods-content">
            <div v-if="permession[1].show" class="goods-name" :style="{ color: permession[1].color }">{{ it.goods_name }}</div>
            <div v-if="permession[3].show" class="goods-price" :style="{ color: permession[3].color }">￥{{ it.price }}</div>
            <div v-if="permession[4].show" class="goods-presale" :style="{ color: permession[4].color }">
              预售价 ￥{{ it.presale_price }}
            </div>
            <div v-if="permession[5].show" class="goods-count" :style="{ color: permession[5].color }">
              {{ it.pay_num }}人已付定金
            </div>
            <div v-if="isShowBtn" class="goods-btn" :style="btnStyle">{{ btnText }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 预售商品 —— 画布预览
 * 迁移自 PHP common/presale-goods/preview.php + style-components/presale-goods/style1.php
 *
 * PHP 侧按活动 id 请求预售模块接口取真实数据，Java 侧无该模块，按已选数量渲染示例卡片。
 */
const DEMO_ITEM = { goods_name: '商品名称', price: 300, presale_price: 100, pay_num: 12 };

export default {
  name: 'PresaleGoodsPreview',
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
    comData() {
      return this.activeItem.data || {};
    },
    styleVal() {
      return this.comData.style || 1;
    },
    goodsList() {
      const count = (this.comData.goods || []).length || 2;
      return new Array(count).fill(null).map(() => ({ ...DEMO_ITEM }));
    },
    isShowTitle() {
      return this.comData.titleRadio || 0;
    },
    titleStyle() {
      const { paddingTop, paddingBottom } = this.comData;
      return {
        paddingTop: paddingTop >= 0 ? `${paddingTop}px` : '10px',
        paddingBottom: paddingBottom >= 0 ? `${paddingBottom}px` : '10px',
      };
    },
    groupBox() {
      const { marginTop, marginBottom, aroundMargin } = this.computedStyle;
      return { margin: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}`, overflow: 'hidden' };
    },
    goodsStyle() {
      const { tabItem, searchIpts, spacing, goodsBgColor } = this.computedStyle;
      const style = { marginBottom: spacing, background: goodsBgColor, ...searchIpts };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    /** 显示内容：未配置时全显示，label 与 style.vue 的 showContentList 对应 */
    permession() {
      const def = {
        1: { show: true, color: '#fff' },
        3: { show: true, color: '#fff' },
        4: { show: true, color: '#fff' },
        5: { show: true, color: '#fff' },
      };
      const list = this.comData.showContent;
      if (!list || !list.length) return def;
      Object.keys(def).forEach((k) => {
        def[k].show = false;
      });
      list.forEach((it) => {
        if (def[it.label]) {
          def[it.label].show = true;
          def[it.label].color = it.color;
        }
      });
      return def;
    },
    isShowBtn() {
      return this.comData.showShopCart != 2;
    },
    btnText() {
      const cart = this.comData.shopCartStyle || {};
      return cart.text || '付定金';
    },
    btnStyle() {
      const cs = this.computedStyle.shopCartStyle || {};
      const size = ['', '3px 7px', '6px 10px', '10px 16px'];
      return {
        borderRadius: `${cs.borderReduis || 0}px`,
        backgroundColor: cs.backgroundColor || '#fd463e',
        color: cs.color || '#fff',
        border: `1px solid ${cs.borderColor}`,
        padding: size[cs.sizeType] || size[1],
      };
    },
    angleMark() {
      return this.comData.angleMark || null;
    },
    isShowHot() {
      return !!this.angleMark && this.angleMark.label != 1;
    },
    hotStyle() {
      const am = this.angleMark;
      if (am && am.label == 3 && am.customImgUrl) {
        return { background: `url(${am.customImgUrl}) no-repeat`, backgroundSize: 'cover' };
      }
      return {};
    },
    hotName() {
      const am = this.angleMark;
      if (!am) return '';
      if (!am.angleMarkText && am.label == 2) return '预售';
      return am.angleMarkText;
    },
  },
};
</script>

<style scoped lang="scss">
.presale-goods-preview {
  overflow: hidden;
}
.presale-title {
  font-size: 16px;
  font-weight: bold;
  padding-left: 10px;
}
.presale-list {
  &.style-2 {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  &.style-2 .presale-item {
    width: 49%;
    display: block;
  }
}
.presale-item {
  display: flex;
  background: #fff;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 6px;
}
.goods-img {
  position: relative;
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
.goods-hot {
  position: absolute;
  top: 0;
  left: 0;
  background: #fd463e;
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 8px 0 8px 0;
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
.goods-price {
  font-size: 12px;
  text-decoration: line-through;
  color: #999;
}
.goods-presale {
  font-size: 14px;
  font-weight: bold;
  color: #db0505;
}
.goods-count {
  font-size: 11px;
  color: #999;
}
.goods-btn {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  text-align: center;
  border-radius: 12px;
}
</style>
