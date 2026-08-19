<template>
  <div class="order-icon-group-box">
    <diy-center-menu
      title="我的订单"
      sub-title="全部订单"
      icon="el-icon-arrow-right"
      :active-item="activeItem"
      :list="iconList"
      :show-subtitle="true"
      :bottom-bg="getColor(0)"
      :title-bg="getColor(1)"
      :content-bg="getColor(2)"
      :title-color="getColor(3)"
      :subtitle-color="getColor(4)"
      :btn-color="getColor(5)"
    />
  </div>
</template>

<script>
/** 订单图标组 —— 画布预览。迁移自 PHP common/order-icon-group/preview.php */
export default {
  name: 'OrderIconGroupPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    iconList() {
      return (this.activeItem.data && this.activeItem.data.iconList) || [];
    },
  },
  methods: {
    getColor(n) {
      const arr = this.activeItem.data && this.activeItem.data.colorInfos;
      return arr && arr[n] && arr[n].color;
    },
  },
};
</script>
