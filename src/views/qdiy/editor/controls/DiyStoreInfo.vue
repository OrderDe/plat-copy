<template>
  <div>
    <div
      v-for="(item, index) in list"
      :key="index"
      class="merchant-info-item"
      :class="borderBottom ? 'has-border' : 'no-border'"
      :style="[componentStyle]"
    >
      <div class="info-item-store">
        <div
          v-show="updataCheck('logo')"
          class="item-logo"
          :style="{ backgroundImage: `url(${item.logo})`, width: width + 'px', height: height + 'px' }"
        >
          <div v-show="updataCheck('sales') && saleType == 1" class="item-sales over1">在售{{ item.sales_num }}件</div>
        </div>
        <div class="item-info">
          <div>
            <div v-show="updataCheck('name')" class="info-name over1" :style="{ color: computedStyle.nameColor }">
              {{ item.merchant_name }}
            </div>
            <div
              v-show="updataCheck('intro') && showDesc"
              class="info-desc over2"
              :style="{ color: computedStyle.introColor }"
            >
              {{ item.merchant_desc }}
            </div>
            <div v-show="updataCheck('sales') && saleType == 2" class="info-desc over2">
              在售商品 {{ item.sales_num }} 件
            </div>
          </div>
          <div
            v-show="updataCheck('address') && showAddress"
            class="info-address over1"
            :style="{ color: computedStyle.addrColor }"
          >
            {{ item.address }}
          </div>
        </div>
        <div class="item-btn">
          <div class="item-btn-text" :style="[btnStyle]">{{ merchData.input || '进入店铺' }}</div>
        </div>
      </div>
      <slot :goods-title-color="computedStyle.goodsTitleColor" :goods-price-color="computedStyle.goodsPriceColor" />
    </div>
  </div>
</template>

<script>
/**
 * 店铺信息预览块
 * 迁移自 PHP diy-store-info.php
 *
 * merchData.content 是一个字段名数组，控制 logo/name/intro/sales/address 各块的显隐。
 */
export default {
  name: 'DiyStoreInfo',
  props: {
    list: {
      type: Array,
      default: () => [],
    },
    computedStyle: {
      type: Object,
      default: () => ({}),
    },
    componentStyle: {
      type: Object,
      default: () => ({}),
    },
    merchData: {
      type: Object,
      default: () => ({}),
    },
    btnStyle: {
      type: Object,
      default: () => ({}),
    },
    width: {
      type: [String, Number],
      default: 80,
    },
    height: {
      type: [String, Number],
      default: 80,
    },
    borderBottom: {
      type: Boolean,
      default: false,
    },
    showAddress: {
      type: Boolean,
      default: true,
    },
    showDesc: {
      type: Boolean,
      default: true,
    },
    saleType: {
      type: [Number, String],
      default: 1,
    },
  },
  methods: {
    updataCheck(name) {
      const content = this.merchData && this.merchData.content;
      if (content && content.length >= 0) {
        return content.includes(name);
      }
      return true;
    },
  },
};
</script>

<style scoped lang="scss">
.merchant-info-item {
  overflow: hidden;
  box-sizing: border-box;
  &:last-child {
    margin-bottom: 0 !important;
  }
}
.has-border {
  border-bottom: 1px solid #ededed;
  &:last-child {
    border-bottom: none !important;
  }
}
.no-border {
  border-bottom: none !important;
}
.info-item-store {
  position: relative;
  display: flex;
  padding: 13px 12px;
}
.item-logo {
  position: relative;
  border-radius: 2px;
  overflow: hidden;
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: cover;
  margin-right: 10px;
  flex-shrink: 0;
  .item-sales {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 22px;
    line-height: 22px;
    background-color: rgba(0, 0, 0, 0.4);
    font-size: 12px;
    text-align: center;
    color: #fff;
  }
}
.item-info {
  width: 185px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .info-name {
    color: #3d404d;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .info-desc {
    color: #999ca7;
    font-size: 13px;
  }
  .info-address {
    font-size: 13px;
    color: #5e6066;
  }
}
.item-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}
.item-btn-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74px;
  height: 26px;
  border-radius: 26px;
  font-size: 12px;
  color: #fff;
  background-color: rgb(218, 54, 54);
  border: 1px solid rgb(218, 54, 54);
}
.over1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.over2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
