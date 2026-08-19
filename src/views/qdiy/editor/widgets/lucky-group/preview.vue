<template>
  <div class="lucky-group-preview">
    <div class="lucky-group-box" :style="luckyGroupBox">
      <div v-if="luckyData.titleRadio" class="lucky-group-title" :style="titleStyle">
        {{ luckyData.title || '新品推荐' }}
      </div>

      <div v-for="(it, i) in goodsList" :key="i" class="shop-box" :style="goodsStyle">
        <div class="shop-list">
          <div class="shop-img"><i class="el-icon-picture-outline" /></div>
          <div class="shop-content">
            <div class="shop-name">{{ it.title }}</div>
            <div class="shop-price">
              <span class="price">¥{{ it.price }}</span>
              <span class="origin">¥{{ it.original_price }}</span>
            </div>
          </div>
        </div>

        <!-- 样式1：单个按钮 -->
        <div v-if="!btnData.style" class="btns-group">{{ btnData.name || '立即拼团' }}</div>

        <!-- 样式2：底部拼团条 -->
        <div v-else class="shop-bottom">
          <div class="bottom-lf">
            <i class="el-icon-present bottom-icon" />
            <div class="boottom-word">
              <div class="bottom-act color-r">{{ it.tips1 }}</div>
              <div class="bottom-noact">{{ it.tips2 }}</div>
            </div>
          </div>
          <div class="bootom-btn">{{ btnData.name || '立即拼团' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 幸运拼团 —— 画布预览。迁移自 PHP common/lucky-group/preview.php
 *
 * 红包图与按钮底图来自 luckyGroup 插件静态资源，平台端无该素材，改用图标与纯色按钮；
 * 商品数据按已选活动数量渲染示例卡片（Java 侧无幸运拼团模块接口）。
 */
const DEMO_ITEM = {
  title: '商品名称',
  price: 80,
  original_price: 100,
  tips1: '2人拼团，0人拼中',
  tips2: '拼中即返现',
};

export default {
  name: 'LuckyGroupPreview',
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
    luckyData() {
      return this.activeItem.data || {};
    },
    btnData() {
      return this.luckyData.btnData || {};
    },
    goodsList() {
      const count = (this.luckyData.goods || []).length || 1;
      return new Array(count).fill(null).map(() => ({ ...DEMO_ITEM }));
    },
    titleStyle() {
      const { paddingTop, paddingBottom } = this.luckyData;
      return {
        paddingTop: paddingTop >= 0 ? `${paddingTop}px` : '10px',
        paddingBottom: paddingBottom >= 0 ? `${paddingBottom}px` : '10px',
      };
    },
    luckyGroupBox() {
      const { marginTop, marginBottom, aroundMargin, boxBg } = this.computedStyle;
      return {
        padding: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}`,
        background: boxBg,
      };
    },
    goodsStyle() {
      const { tabItem, searchIpts, goodsBg, spacing } = this.computedStyle;
      const style = { marginBottom: spacing, background: goodsBg, ...searchIpts };
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
.lucky-group-preview {
  position: relative;
  overflow: hidden;
}
.lucky-group-title {
  font-size: 15px;
  font-weight: bold;
  padding-left: 10px;
}
.shop-box {
  position: relative;
  background: #fff;
  padding: 10px;
  box-sizing: border-box;
}
.shop-list {
  display: flex;
}
.shop-img {
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
.shop-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  padding-left: 10px;
  overflow: hidden;
}
.shop-name {
  font-size: 13px;
  line-height: 18px;
  max-height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.shop-price {
  .price {
    color: #db0505;
    font-weight: bold;
  }
  .origin {
    color: #999;
    font-size: 11px;
    padding-left: 6px;
    text-decoration: line-through;
  }
}
.btns-group {
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-size: 11px;
  width: 75px;
  height: 25px;
  line-height: 25px;
  text-align: center;
  background-color: #db0505;
  border-radius: 15px;
  color: #fff;
}
.shop-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
}
.bottom-lf {
  display: flex;
  align-items: center;
}
.bottom-icon {
  font-size: 24px;
  color: #db0505;
}
.boottom-word {
  padding-left: 8px;
  font-size: 11px;
}
.color-r {
  color: #db0505;
}
.bottom-noact {
  color: #999;
}
.bootom-btn {
  font-size: 11px;
  padding: 5px 14px;
  border-radius: 15px;
  background: #db0505;
  color: #fff;
}
</style>
