<template>
  <div class="member-info-preview" :style="containStyle">
    <Card :active-item="activeItem" :variant="type" />
  </div>
</template>

<script>
/** 会员信息 —— 画布预览。迁移自 PHP common/member-info/preview.php */
import Card from './Card';

export default {
  name: 'MemberInfoPreview',
  components: { Card },
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
    containStyle() {
      const cs = this.computedStyle;
      const style = {
        padding: `${cs.compMarginTop || 0}px ${cs.compMarginLR || 0}px ${cs.compMarginBot || 0}px`,
      };
      if (cs.containBgColor != null) style.backgroundColor = cs.containBgColor;
      return style;
    },
    type() {
      return this.computedStyle.imgIndex ? 2 : 1;
    },
  },
};
</script>

<style scoped lang="scss">
.member-info-preview {
  overflow: hidden;
}
</style>
