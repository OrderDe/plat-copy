<template>
  <div class="commodity-group-preview" :style="{ background: computedStyle.searchBox }">
    <div class="flex-wrap" :style="{ flexWrap: flexWrap, ...contianStyle }">
      <div v-for="(item, index) in renderList" :key="index" :class="[styleTypeClass, zoomComputed(index)]">
        <div class="diy-goods-basic" :style="goodsStyle">
          <div class="diy-goods-image">
            <div v-if="isShowHot" :class="hotClass" :style="hotStyle">{{ hotName }}</div>
            <div class="img-contain">
              <el-image v-if="item.img" class="test-img" :src="item.img" fit="cover" />
              <div v-else class="test-img img-holder"><i class="el-icon-picture-outline" /></div>
            </div>
          </div>

          <div v-if="showDetail(index)" class="detail">
            <div v-if="permession.showTitle.show" class="name" :style="{ color: permession.showTitle.color || '#37383a' }">
              这里是商品标题
            </div>
            <div
              v-if="permession.showSubTitle.show"
              class="subtitle"
              :style="{ color: permession.showSubTitle.color || '#999ca7' }"
            >
              这里是商品副标题
            </div>

            <div class="diy-sale">
              <div class="diy-info">
                <div class="diy-price">
                  <span
                    v-if="permession.goodsPrice.show && (searchData.style != 6 || index == 1)"
                    class="diy-sale-price"
                    :style="{ color: permession.goodsPrice.color || '#fd463e' }"
                  >
                    ￥<span>20</span>
                  </span>
                  <span
                    v-if="!permession.memberPrice.show && permession.originalPrice.show"
                    class="diy-original-price"
                    :style="{ color: permession.originalPrice.color || '#999ca7' }"
                  >
                    <span>￥40</span>
                  </span>
                  <span v-if="permession.memberPrice.show" class="member-price">
                    <span class="member-price-box">
                      <span class="price-icon">VIP</span>
                      <span class="price-num" :style="{ color: permession.memberPrice.color }">
                        <span class="price-unit">￥</span><span>13</span>
                      </span>
                    </span>
                  </span>
                </div>
                <div class="diy-sold">
                  <span
                    v-if="permession.goodsSales_num.show"
                    class="diy-sales"
                    :style="{ color: permession.goodsSales_num.color || '#999ca7' }"
                  >
                    已售0
                  </span>
                </div>
              </div>

              <div v-if="isShowGoodsBuy" class="goods-buy" :style="goodsBuyStyle">
                <span v-if="!goodsBuySrc">{{ goodsBuyText }}</span>
                <img v-else :src="goodsBuySrc" >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 商品组 —— 画布预览。迁移自 PHP common/commodity-group/preview.php
 *
 * PHP 侧会请求 mall/diy/get-components-data 拉真实商品，再请求 get-addons-fields 取插件扩展字段。
 * Java 侧无这两个接口，本实现只用画布内已有数据渲染：
 *   - 手动选品时按 data.goods 的封面图占位，标题/价格/销量用示意文案
 *   - 自动取数（chooseGoods == 2）时按 commCate.count 渲染对应数量的占位卡片
 * 配置项与保存的数据结构与 PHP 侧完全一致，App 端取真实数据时不受影响。
 */
// showContent 的 label → 权限 key，以及各 key 支持的 style
const PERMISSION_MAP = {
  1: { key: 'showTitle', filter: [1, 2, 3, 4, 5, 6, 7] },
  2: { key: 'showSubTitle', filter: [1, 2] },
  3: { key: 'goodsPrice', filter: [1, 2, 3, 4, 5, 6, 7] },
  4: { key: 'originalPrice', filter: [1, 2, 3] },
  5: { key: 'goodsSales_num', filter: [1, 2, 3] },
  6: { key: 'memberPrice', filter: [1, 2, 3] },
};

const STYLE_CLASS = {
  1: 'diy-goods-contain-full',
  2: 'diy-goods-contain',
  3: 'diy-goods-contain1',
  4: 'diy-goods-contain2',
  5: 'diy-goods-contain3',
  6: 'diy-goods-contain4',
  7: 'diy-goods-contain5',
};

export default {
  name: 'CommodityGroupPreview',
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
    searchData() {
      return this.activeItem.data || {};
    },
    /** 手动选品优先用已选商品，否则按取数数量渲染占位卡片 */
    renderList() {
      const goods = this.searchData.goods || [];
      if (this.searchData.chooseGoods != 2 && goods.length) {
        return goods.map((it) => ({ img: (it.params && it.params.img) || '' }));
      }
      if (this.searchData.chooseGoods == 2) {
        const cate = this.searchData.commCate || {};
        const count = cate.count > 0 && cate.count <= 10 ? cate.count : 10;
        return new Array(count).fill(null).map(() => ({ img: '' }));
      }
      return [{ img: '' }];
    },
    flexWrap() {
      return [6, 7].indexOf(this.searchData.style) !== -1 ? 'nowrap' : '';
    },
    contianStyle() {
      return this.filterKey(this.computedStyle.searchIpts, ['margin']);
    },
    goodsStyle() {
      const tabItem = this.computedStyle.tabItem;
      const style = {
        background: this.computedStyle.iptBg,
        ...this.filterKey(this.computedStyle.searchIpts, ['border']),
      };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    styleTypeClass() {
      return STYLE_CLASS[this.searchData.style || 1];
    },
    // 角标
    angleMark() {
      return this.searchData.angleMark || null;
    },
    isShowHot() {
      return !!this.angleMark && this.angleMark.label != 1;
    },
    hotStyle() {
      const am = this.angleMark;
      if (am && am.label == 3 && am.customImgUrl) {
        return {
          width: '76px',
          height: '76px',
          background: `url(${am.customImgUrl}) no-repeat`,
          backgroundSize: '76px',
        };
      }
      return {};
    },
    hotClass() {
      const am = this.angleMark;
      const obj = ['diy-goods-hot'];
      if (am && am.label == 2 && am.angleMarkStyle) {
        const name = ['', 'diy-goods-hot3', 'diy-goods-hot2', 'diy-goods-hot1'];
        const key = name[am.angleMarkStyle.label];
        if (key) obj.push(key);
      }
      return obj;
    },
    hotName() {
      const am = this.angleMark;
      if (!am) return '';
      if (!am.angleMarkText && am.label == 2) return '热卖';
      return am.angleMarkText;
    },
    // 购物车按钮
    isShowGoodsBuy() {
      if ((this.searchData.style || 1) == 6) return false;
      return this.searchData.showShopCart != 2;
    },
    goodsBuySrc() {
      const cart = this.searchData.shopCartStyle || {};
      return cart.label == 3 || cart.label == 4 ? cart.src : '';
    },
    goodsBuyStyle() {
      const cs = this.computedStyle.shopCartStyle || {};
      const cart = this.searchData.shopCartStyle || {};
      const size = ['', '3px 7px', '6px 10px', '10px 16px'];
      const small = size[cs.sizeType] || size[1];
      const size1 = ['', '22px', '28px', '36px'];
      const small1 = size1[cs.sizeType] || size1[1];

      if (cart.label == 3 || cart.label == 4) {
        return { width: small1, height: small1, lineHeight: small1 };
      }
      const handleList = [
        {},
        {
          borderRadius: `${cs.borderReduis || 0}px`,
          backgroundColor: cs.backgroundColor || '#fd463e',
          color: cs.color || '#fff',
          border: `1px solid ${cs.borderColor}`,
          padding: small,
        },
        {
          borderRadius: '50%',
          backgroundColor: cs.backgroundColor || '#fd463e',
          color: cs.color || '#fff',
          border: `1px solid ${cs.borderColor}`,
          width: small1,
          height: small1,
          lineHeight: small1,
        },
      ];
      return handleList[cart.label || 1] || handleList[1];
    },
    goodsBuyText() {
      const cart = this.searchData.shopCartStyle || {};
      if (cart.label == 2) return '+';
      if (cart.label == 3 || cart.label == 4) return '';
      return cart.text || '购买';
    },
    /** 显示内容权限：未配置时全显示，配置后按 showContent 与当前 style 过滤 */
    permession() {
      const obj = {
        showTitle: { show: true, color: '' },
        showSubTitle: { show: true, color: '' },
        goodsPrice: { show: true, color: '' },
        originalPrice: { show: true, color: '' },
        goodsSales_num: { show: true, color: '' },
        memberPrice: { show: true, color: '' },
      };
      const data = this.searchData.showContent || [];
      const style = this.searchData.style;
      if (data.length) {
        Object.keys(obj).forEach((key) => {
          obj[key].show = false;
        });
      }
      data.forEach((item) => {
        const target = PERMISSION_MAP[item.label];
        if (style && target && target.filter.indexOf(style) !== -1) {
          obj[target.key].show = true;
          obj[target.key].color = item.color;
        }
      });
      return obj;
    },
  },
  methods: {
    zoomComputed(index) {
      return this.searchData.style == 6 && index % 2 === 0 ? 'zoom' : '';
    },
    showDetail(index) {
      return !(this.searchData.style == 6 && index > 2);
    },
    filterKey(obj, keys) {
      const result = {};
      keys.forEach((key) => {
        Object.keys(obj || {}).forEach((k) => {
          if (k.indexOf(key) !== -1) result[k] = obj[k];
        });
      });
      return result;
    },
  },
};
</script>

<style scoped lang="scss">
.commodity-group-preview {
  box-sizing: border-box;
  overflow: hidden;
}
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}
.diy-goods-image {
  position: relative;
}

/* 角标：PHP 侧三种样式各有一张背景图，平台端无资源，改用纯色块近似 */
.diy-goods-hot {
  position: absolute;
  top: 0;
  left: 0;
  transform: scale(0.5);
  transform-origin: top left;
  color: #fff;
  font-size: 22px;
  z-index: 99;
  background: #fd463e;
  padding: 0 8px;
  line-height: 34px;
}
.diy-goods-hot1 {
  border-radius: 0 0 12px 0;
}
.diy-goods-hot2 {
  border-radius: 0 0 12px 12px;
}
.diy-goods-hot3 {
  border-radius: 0 0 12px 0;
}

.diy-sale {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.goods-buy {
  box-sizing: border-box;
  display: inline-block;
  text-align: center;
  align-self: flex-end;
  border-radius: 12px !important;
  font-size: 12px;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }
}
.detail {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 12px;

  .name {
    font-size: 14px;
    line-height: 18px;
    height: 36px;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .subtitle {
    font-size: 12px;
    height: 16px;
    line-height: 16px;
    width: 100%;
    color: #999ca7;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.diy-sale-price {
  color: #fd463e;
  font-weight: 700;

  span {
    font-size: 16px;
    line-height: 16px;
  }
}
.diy-original-price {
  text-decoration: line-through;
}
.member-price {
  height: 18px;
  line-height: 18px;
  border-radius: 4px;
  display: inline-flex;
  margin-top: 10px;
  margin-bottom: 5px;
  overflow: hidden;
}
.member-price-box {
  display: flex;
  border-radius: 5px;
  background-color: #fcecd6;
}
.price-icon {
  color: #fcecd6;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  background: linear-gradient(90deg, #292220 0%, #4e372d 100%);
  border-radius: 5px 5px 0 5px;
  padding: 0 6px;
}
.price-num {
  color: #333;
  font-size: 14px;
  line-height: 18px;
  padding: 0 8px;

  .price-unit {
    font-size: 12px;
    margin-left: -4px;
    margin-right: -1px;
  }
}

/* 样式1 */
.diy-goods-contain-full {
  width: 100%;
  margin: 0;

  .detail .name {
    height: 20px;
    max-height: 20px;
  }
  .diy-goods-basic {
    margin: 0 0 6px 0;
  }
}
/* 样式2 */
.diy-goods-contain {
  width: 100%;

  .detail .name {
    height: 20px;
    max-height: 20px;
  }
  .diy-goods-image {
    float: left;
    width: 130px;
    height: 130px;
  }
  .detail {
    margin-left: 130px;
    height: 130px;
    padding: 10px;
  }
  .diy-original-price {
    display: block;
  }
  .diy-goods-basic {
    margin: 0 0 6px 0;
  }
}
/* 样式3 */
.diy-goods-contain1 {
  width: 50%;

  .diy-original-price {
    display: block;
  }
  .subtitle {
    display: none;
  }
  .diy-sale {
    margin-top: 16px;
  }
}
/* 样式4 */
.diy-goods-contain2 {
  width: 50%;

  .diy-goods-image {
    float: left;
    width: 80px;
    height: 80px;
  }
  .detail {
    margin-left: 80px;
    padding: 4px;
    height: 80px;
  }
  .detail .goods-buy,
  .detail .subtitle,
  .detail .diy-sold,
  .detail .diy-original-price {
    display: none;
  }
}
/* 样式5 */
.diy-goods-contain3 {
  width: 33.33%;

  .detail .subtitle,
  .detail .goods-buy,
  .detail .diy-sold,
  .detail .diy-original-price {
    display: none;
  }
}
/* 样式6 */
.diy-goods-contain4 {
  width: 33.33%;
  flex: 0 0 33.33%;
}
/* 样式7 */
.diy-goods-contain5 {
  width: 30%;
  flex: 0 0 30%;

  .name {
    height: 36px;
  }
  .detail .subtitle,
  .detail .diy-sold,
  .detail .diy-original-price,
  .detail .goods-buy {
    display: none;
  }
}

.diy-goods-basic {
  margin: 0 4px 4px 0;
  overflow: hidden;
}
.img-contain {
  padding-top: 100%;
  position: relative;
}
.test-img {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
}
.img-holder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 22px;
}
.zoom {
  transform: scale(1, 0.9);
}
</style>
