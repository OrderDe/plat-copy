<template>
  <div class="diy-goods-info">
    <div class="goods-banner">
      <i class="el-icon-picture-outline" />
      <span>商品主图</span>
    </div>
    <component :is="styleComp" :goods-data="goodsData" :active-item="activeItem" />
  </div>
</template>

<script>
/**
 * 商品信息 —— 画布预览。迁移自 PHP common/goods-info/preview.php
 *
 * 两套风格拆在同目录的 Style1.vue / Style2.vue（不会被组件注册中心扫描，文件名不匹配 preview|style）。
 * PHP 侧的主图占位 resources/img/decorate/goods_banner.png 平台端无资源，改为占位块。
 */
import Style1 from './Style1';
import Style2 from './Style2';

export default {
  name: 'GoodsInfoPreview',
  components: { Style1, Style2 },
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    goodsData() {
      return (this.activeItem.data && this.activeItem.data.goodsData) || {};
    },
    styleComp() {
      const styleItem = (this.activeItem.data && this.activeItem.data.goodsStyle) || {};
      return styleItem.type === 2 ? 'Style2' : 'Style1';
    },
  },
};
</script>

<style scoped lang="scss">
.diy-goods-info {
  box-sizing: border-box;
  overflow: hidden;
}
.goods-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 260px;
  background: #f5f5f5;
  color: #c0c4cc;
  font-size: 12px;

  i {
    font-size: 32px;
    margin-bottom: 6px;
  }
}
</style>
