<template>
  <commodity-group-preview :active-item="activeItem" />
</template>

<script>
/**
 * 门店商品组 —— 画布预览。迁移自 PHP common/commodity-location-group/preview.php
 *
 * 与 commodity-group 的预览逻辑逐行比对后只有两处差异，都不影响配置与保存的数据：
 *   1. 会员价那一小块的排版（PHP 用 mp.png 图标，本项目统一用 VIP 文字角标）
 *   2. 容器默认 margin 10px —— commodity-group 的属性面板本就把边距默认值设为 10px，等价
 * 因此直接复用 commodity-group 的预览组件，避免抄一份 800 行的重复实现。
 */
export default {
  name: 'CommodityLocationGroupPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
