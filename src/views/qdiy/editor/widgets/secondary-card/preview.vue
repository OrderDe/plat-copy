<template>
  <div class="secondary-card-preview">
    <div class="card-header">
      <div>
        <div v-if="secondaryInfo.title" class="header-title">{{ secondaryInfo.title }}</div>
        <div v-if="secondaryInfo.secondTitle" class="header-second">{{ secondaryInfo.secondTitle }}</div>
      </div>
      <div v-if="secondaryInfo.isJump == 0 && cardType == 0" class="more">
        查看更多<i class="el-icon-arrow-right" />
      </div>
    </div>

    <div class="card-body">
      <!-- 特定次卡：横向卡片 -->
      <template v-if="cardType == 0">
        <div v-for="(item, index) in cardList" :key="index" class="card-box" :style="cardBg(item)">
          <div class="card-title" :style="{ color: item.font_color }">{{ item.title }}</div>
          <div class="card-desc" :style="{ color: item.font_color }">30日内有效</div>
          <div class="card-bottom">
            <div class="card-desc" :style="{ color: item.font_color }">已领{{ item.virtual_sales }}张</div>
            <div class="card-price-row" :style="{ color: item.font_color }">
              <span class="card-desc">原价 <span class="origin">￥{{ item.original_price }}</span></span>
              <span class="card-price">￥{{ item.price }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 全部次卡：单张自定义卡 -->
      <div v-else class="card-box" :style="cardBg(cardInfo)">
        <div class="card-title">{{ cardInfo.title }}</div>
        <div class="card-bottom">
          <div class="card-desc">已领{{ cardInfo.virtual_sales }}张</div>
          <div class="card-price-row">
            <span class="card-desc">原价 <span class="origin">￥{{ cardInfo.original_price }}</span></span>
            <span class="card-price">￥{{ cardInfo.price }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 消费次卡 —— 画布预览。迁移自 PHP common/secondary-card/preview.php
 *
 * PHP 侧默认卡面图来自 SecondaryCard 插件静态资源，平台端无该素材，
 * 未配置背景图时用渐变色卡面兜底；卡片轮播（3D 叠放）简化为横向排列。
 */
const DEMO_CARDS = [
  { title: '这是次卡名称', price: 68, original_price: 198, virtual_sales: 1000, font_color: '#FF9031' },
  { title: '这是次卡名称', price: 68, original_price: 198, virtual_sales: 1000, font_color: '#F65B66' },
];

export default {
  name: 'SecondaryCardPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    diyData() {
      return this.activeItem.data || {};
    },
    secondaryInfo() {
      return this.diyData.secondaryInfo || {};
    },
    cardType() {
      return this.secondaryInfo.card_type || 0;
    },
    cardInfo() {
      return this.diyData.cardInfo || { title: '消费次卡', price: 68, original_price: 108, virtual_sales: 1000 };
    },
    cardList() {
      const picked = this.diyData.cards || [];
      if (!picked.length) return DEMO_CARDS;
      return picked.map((it, i) => ({
        ...DEMO_CARDS[i % DEMO_CARDS.length],
        ...(it.params || {}),
      }));
    },
  },
  methods: {
    cardBg(item) {
      if (item && item.background) {
        return { backgroundImage: `url(${item.background})`, backgroundSize: 'cover' };
      }
      return { background: 'linear-gradient(135deg, #4b83e0 0%, #6ba7f5 100%)', color: '#fff' };
    },
  },
};
</script>

<style scoped lang="scss">
.secondary-card-preview {
  padding: 12px;
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-title {
  font-size: 15px;
  font-weight: bold;
}
.header-second {
  font-size: 12px;
  color: #999;
}
.more {
  font-size: 12px;
  color: #999;
}
.card-body {
  display: flex;
  padding-top: 10px;
  overflow: hidden;
}
.card-box {
  width: 200px;
  flex-shrink: 0;
  min-height: 100px;
  border-radius: 8px;
  padding: 12px;
  margin-right: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
}
.card-title {
  font-size: 14px;
  font-weight: bold;
}
.card-desc {
  font-size: 12px;
}
.card-bottom {
  padding-top: 12px;
}
.card-price-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.origin {
  text-decoration: line-through;
}
.card-price {
  font-size: 16px;
  font-weight: bold;
}
</style>
