<template>
  <div class="group-goods-preview" :style="{ background: computedStyle.bgColor }">
    <div :style="groupBox">
      <div v-if="isShowTitle" class="group-goods-title" :style="titleStyle">{{ comData.title || '商品拼团' }}</div>

      <!-- 风格1：横向卡片 + 右侧参团按钮 -->
      <template v-if="styleType === 1">
        <div v-for="(it, i) in goodsList" :key="i" class="group-goods-box" :style="goodsStyle">
          <div class="goods-img"><i class="el-icon-picture-outline" /></div>
          <div class="group-content">
            <div class="goods-name">{{ it.goods_name }}</div>
            <div>
              <div class="goods-tags">
                <span>{{ it.group_size }}人团</span>
                <span class="tags-text">已拼{{ it.total_num }}件</span>
              </div>
              <div class="goods-save">节省了￥{{ it.sheng }}</div>
              <div class="goods-price">
                <span>￥{{ it.group_buy_price }}</span>
                <span class="price-origin">￥{{ it.price }}</span>
              </div>
            </div>
          </div>
          <div class="group-btn" :style="btnStyle">立即参团</div>
        </div>
      </template>

      <!-- 风格2：卡片 + 底部拼团条 -->
      <template v-else-if="styleType === 2">
        <div v-for="(it, i) in goodsList" :key="i" class="group-goods-box column" :style="goodsStyle">
          <div class="row">
            <div class="goods-img"><i class="el-icon-picture-outline" /></div>
            <div class="group-content">
              <div class="goods-name">{{ it.goods_name }}</div>
              <div class="goods-time">活动时间：{{ formatTime(it.start_at) }} - {{ formatTime(it.end_at) }}</div>
              <div class="goods-origin">￥{{ it.price }}</div>
              <div class="goods-price">
                <span>￥{{ it.group_buy_price }}</span>
                <span class="price-save">节省了￥{{ it.sheng }}</span>
              </div>
            </div>
          </div>
          <div class="goods-buy-card">
            <div class="goods-buy-desc">
              <span class="text-color">{{ it.group_size }}人</span>拼团，已团
              <span class="text-color">{{ it.total_num }}件</span>
            </div>
            <div class="goods-buy-btn" :style="btnStyle">立即参团</div>
          </div>
        </div>
      </template>

      <!-- 风格3：两列 -->
      <div v-else class="group-goods-list">
        <div v-for="(it, i) in goodsList" :key="i" class="group-goods-column" :style="goodsStyle">
          <div class="column-imgs">
            <div class="goods-img big"><i class="el-icon-picture-outline" /></div>
            <div class="goods-time">活动时间：{{ formatTime(it.start_at) }} - {{ formatTime(it.end_at) }}</div>
          </div>
          <div class="goods-content">
            <div class="goods-name">{{ it.goods_name }}</div>
            <div class="goods-tags-item">
              <span class="goods-people">{{ it.group_size }}人团</span>
              <span class="goods-save">省￥{{ it.sheng }}</span>
            </div>
            <div class="goods-origin">￥{{ it.price }}</div>
            <div class="goods-price">￥{{ it.group_buy_price }}</div>
          </div>
          <div class="goods-btn" :style="btnStyle">立即参团</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 拼团商品 —— 画布预览
 * 迁移自 PHP common/group-goods/preview.php + style-components/group-goods/style1~3.php
 *
 * PHP 侧按已选活动 id 调 /group-buy/default/check-active-list 拿真实拼团数据，
 * Java 侧无拼团模块接口，画布按已选数量渲染示例卡片（示例值与 PHP 的 defaultList 一致）。
 */
const DEMO_ITEM = {
  goods_name: '商品名称',
  group_buy_price: 100,
  group_size: 3,
  price: 300,
  sheng: 200,
  total_num: 14,
  start_at: 1639238400,
  end_at: 1640880000,
};

export default {
  name: 'GroupGoodsPreview',
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
    styleType() {
      const styleItem = this.comData.groupStyle || {};
      return styleItem.type || 1;
    },
    goodsList() {
      const goods = this.comData.goods || [];
      const count = goods.length || 1;
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
      return {
        margin: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}`,
        overflow: 'hidden',
      };
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
      return {
        color: this.computedStyle.btnTextColor,
        background: this.computedStyle.btnBackground,
      };
    },
  },
  methods: {
    formatTime(sec) {
      if (!sec) return '';
      const d = new Date(sec * 1000);
      const p = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    },
  },
};
</script>

<style scoped lang="scss">
.group-goods-preview {
  overflow: hidden;
}
.group-goods-title {
  font-size: 16px;
  font-weight: bold;
  padding-left: 10px;
}
.group-goods-box {
  display: flex;
  align-items: stretch;
  background: #fff;
  padding: 8px;
  box-sizing: border-box;

  &.column {
    display: block;
  }
}
.row {
  display: flex;
}
.goods-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 106px;
  height: 106px;
  border-radius: 8px;
  background: #f5f5f5;
  color: #c0c4cc;
  flex-shrink: 0;

  &.big {
    width: 100%;
    height: 140px;
    border-radius: 8px 8px 0 0;
  }
}
.group-content {
  flex: 1;
  padding: 0 8px;
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
.goods-tags {
  font-size: 11px;
  color: #db0505;

  .tags-text {
    padding-left: 6px;
    color: #999;
  }
}
.goods-save {
  display: inline-block;
  font-size: 11px;
  color: #db0505;
  background: #ffe8e8;
  border-radius: 2px;
  padding: 0 4px;
  margin: 2px 0;
}
.goods-price {
  color: #db0505;
  font-weight: bold;

  .price-origin,
  .price-save {
    font-weight: normal;
    font-size: 11px;
    color: #999;
    padding-left: 6px;
    text-decoration: line-through;
  }
  .price-save {
    text-decoration: none;
    color: #db0505;
  }
}
.goods-origin {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}
.goods-time {
  font-size: 11px;
  color: #999;
  padding: 2px 0;
}
.group-btn,
.goods-buy-btn,
.goods-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: #db0505;
  color: #fff;
  align-self: flex-end;
  white-space: nowrap;
}
.goods-buy-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
}
.goods-buy-desc {
  font-size: 12px;
  color: #666;

  .text-color {
    color: #db0505;
  }
}
.group-goods-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.group-goods-column {
  width: 49%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
}
.goods-content {
  padding: 6px 8px;
}
.goods-tags-item {
  display: flex;
  align-items: center;
  font-size: 11px;

  .goods-people {
    color: #db0505;
    margin-right: 6px;
  }
}
.goods-btn {
  margin: 0 8px 8px;
}
</style>
