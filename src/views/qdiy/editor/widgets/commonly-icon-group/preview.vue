<template>
  <div class="commonly-icon-group-box">
    <diy-center-menu
      :item-width="itemWidth"
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
    /*
     * 不再用 || '其他功能' 兑底。
     *
     * 原来只要 data.title 为空，画布就显示一个数据里根本不存在的「其他功能」，
     * 而 App 端是 v-if="title"、如实不显示 —— 运营在后台看到标题、上了前端却没有。
     * 默认标题改由 style.vue 的 init 真正写进 data.title（只在从未设置过时），
     * 那才是既能被运营改、也能被清空的地方。
     */
    title() {
      return (this.activeItem.data && this.activeItem.data.title) || '';
    },
    /*
     * 每行个数原来写死 25%（固定 4 列），不管实际配了几列。
     * App 端读的是 buttonData.single_line（缺省 4），两边口径必须一致，
     * 否则后台画布 4 个一行、前端 5 个一行，看着就是「装修没生效」。
     */
    itemWidth() {
      const d = this.activeItem.data || {};
      const num = Number((d.buttonData || {}).single_line) || Number(d.single_line) || 4;
      return `${100 / num}%`;
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
