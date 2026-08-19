<template>
  <div class="merchant-info-preview" :style="{ background: computedStyle.bottomBg }">
    <div
      class="merchant-infos"
      :style="{
        margin: `${computedStyle.marginTop || 0} ${computedStyle.aroundMargin || 0} ${computedStyle.marginBottom || 0}`,
      }"
    >
      <diy-store-info
        :list="merchData.merchantList"
        :component-style="componentStyle"
        :computed-style="computedStyle"
        :merch-data="merchData"
        :btn-style="btnStyle"
        :border-bottom="styleType === 1"
        :width="styleType === 3 ? 40 : 60"
        :height="styleType === 3 ? 40 : 60"
        :sale-type="styleType === 3 ? 2 : 1"
        :show-address="styleType !== 3"
        :show-desc="styleType !== 3"
      >
        <!-- 风格 2/3 在商户下方带一行商品 -->
        <template v-if="styleType > 1" v-slot="{ goodsTitleColor, goodsPriceColor }">
          <div class="merch-info-goods">
            <div v-for="i in 5" :key="i" class="info-goods-item">
              <div class="goods-img"><i class="el-icon-picture-outline" /></div>
              <div class="goods-title" :style="{ color: goodsTitleColor }">这里是商品标题这里是商品标题</div>
              <div class="goods-price" :style="{ color: goodsPriceColor }">￥20</div>
            </div>
          </div>
        </template>
      </diy-store-info>
    </div>
  </div>
</template>

<script>
/**
 * 商户信息 —— 画布预览
 * 迁移自 PHP common/merchant-info/preview.php + style-components/merchant-info/style1~3.php
 *
 * PHP 侧三个风格子组件的区别只是传给 diy-store-info 的几个 prop 与是否带商品行，
 * 这里直接按 styleType 传参，不再拆三个文件。
 */
export default {
  name: 'MerchantInfoPreview',
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
    merchData() {
      return this.activeItem.data || {};
    },
    styleType() {
      const styleItem = this.merchData.titleStyle || {};
      return styleItem.type || 1;
    },
    componentStyle() {
      const cs = this.computedStyle;
      const tabItem = cs.tabItem;
      const style = {
        marginBottom: cs.spacing,
        background: cs.componentBg,
        ...cs.searchIpts,
      };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    btnStyle() {
      const cs = this.computedStyle;
      return {
        background: cs.btnBg,
        color: cs.btnTextColor,
        border: `1px solid ${cs.btnBorder}`,
      };
    },
  },
};
</script>

<style scoped lang="scss">
.merchant-info-preview {
  box-sizing: border-box;
  overflow: hidden;
}
.merch-info-goods {
  display: flex;
  padding: 0 8px 8px;
  overflow: hidden;
}
.info-goods-item {
  width: 72px;
  flex-shrink: 0;
  margin-right: 8px;
}
.goods-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #c0c4cc;
}
.goods-title {
  font-size: 12px;
  line-height: 16px;
  max-height: 32px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.goods-price {
  font-size: 12px;
  color: #fd463e;
}
</style>
