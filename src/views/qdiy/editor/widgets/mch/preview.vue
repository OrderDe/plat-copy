<template>
  <div class="mch-preview">
    <div class="o2o-box" :style="boxStyle">
      <div v-if="mchData.titleRadio" class="o2o-title" :style="titleStyle">{{ mchData.title || '推荐商品' }}</div>
      <div class="shop-box" :style="goodsStyle">
        <div v-for="(it, i) in shopList" :key="i" class="shop-list">
          <div class="shop-img">
            <el-image v-if="it.img" style="width: 100%; height: 100%" :src="it.img" fit="cover" />
            <div v-else class="img-holder"><i class="el-icon-shop" /></div>
          </div>
          <div class="shop-content">{{ it.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 多商户 —— 画布预览。迁移自 PHP common/mch/preview.php
 *
 * PHP 侧按已选商户 id 调 /mch/diy/mch-list 拿商户名与 logo，Java 侧无该接口，
 * 画布上按已选数量渲染占位卡片，真实数据由 App 端取。
 */
export default {
  name: 'MchPreview',
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
    mchData() {
      return this.activeItem.data || {};
    },
    shopList() {
      const goods = this.mchData.goods || [];
      if (!goods.length) return [{ name: '商家名称', img: '' }];
      return goods.map((it) => ({
        name: (it.params && it.params.name) || '商家名称',
        img: (it.params && it.params.img) || '',
      }));
    },
    titleStyle() {
      const { paddingTop, paddingBottom } = this.mchData;
      return {
        paddingTop: paddingTop >= 0 ? `${paddingTop}px` : '10px',
        paddingBottom: paddingBottom >= 0 ? `${paddingBottom}px` : '10px',
      };
    },
    goodsStyle() {
      const { tabItem, searchIpts, goodsBg, spacing } = this.computedStyle;
      const style = {
        marginBottom: spacing,
        background: goodsBg,
        ...searchIpts,
      };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    boxStyle() {
      const { marginTop, marginBottom, aroundMargin, boxBg } = this.computedStyle;
      return {
        padding: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}`,
        background: boxBg,
      };
    },
  },
};
</script>

<style scoped lang="scss">
.mch-preview {
  position: relative;
  overflow: hidden;
}
.o2o-box {
  box-sizing: border-box;
  background: #fff;
}
.o2o-title {
  text-align: left;
  font-size: 17px;
  color: #2b2c2d;
  font-weight: 700;
  padding-left: 10.5px;
}
.shop-box {
  display: flex;
  position: relative;
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  background-color: #fff;
  overflow: hidden;
}
.shop-list {
  margin-right: 10px;
  position: relative;
  border-radius: 0 0 8px 8px;
  flex-shrink: 0;
}
.shop-img {
  width: 80px;
  height: 82px;
  border-radius: 8px;
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
.shop-content {
  text-align: center;
  color: #2b2c2d;
  font-size: 12px;
  background-color: #f7f7f7;
  height: 32px;
  line-height: 32px;
  font-weight: 700;
  position: absolute;
  width: 100%;
  bottom: 0;
  left: 0;
  border-radius: 0 0 8px 8px;
}
</style>
