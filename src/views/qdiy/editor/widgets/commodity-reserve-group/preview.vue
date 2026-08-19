<template>
  <div class="commodity-reserve-group-preview">
    <div class="reserve-head">
      <div class="head-item">{{ headInfo.titleText || '家庭保洁' }}</div>
      <div class="head-item head-more">{{ headInfo.moreText || '更多>>' }}</div>
    </div>
    <commodity-group-preview :active-item="activeItem" />
  </div>
</template>

<script>
/**
 * 预约商品组 —— 画布预览。迁移自 PHP common/commodity-reserve-group/preview.php
 *
 * 商品列表部分与 commodity-group 完全一致，直接复用；
 * 本组件只多了一行「标题 + 更多」的头部。
 */
export default {
  name: 'CommodityReserveGroupPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    headInfo() {
      return (this.activeItem.data && this.activeItem.data.headInfo) || {};
    },
  },
};
</script>

<style scoped lang="scss">
.reserve-head {
  display: flex;
  align-items: center;
  padding: 10px 12px 0;
  font-size: 14px;
  font-weight: bold;
}
.head-item {
  flex: 1;
}
.head-more {
  text-align: right;
  font-weight: normal;
  font-size: 12px;
  color: #999;
}
</style>
