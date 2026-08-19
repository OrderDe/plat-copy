<template>
  <div class="commonly-icon-group-box">
    <diy-center-menu
      item-width="25%"
      :active-item="activeItem"
      :list="iconList"
      :title="title"
      :bottom-bg="getColor(0)"
      :title-bg="getColor(1)"
      :content-bg="getColor(2)"
      :title-color="getColor(3)"
      :btn-color="getColor(4)"
    />
  </div>
</template>

<script>
/** 常用功能图标组 —— 画布预览。迁移自 PHP common/commonly-icon-group/preview.php */
export default {
  name: 'CommonlyIconGroupPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    title() {
      return (this.activeItem.data && this.activeItem.data.title) || '其他功能';
    },
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
