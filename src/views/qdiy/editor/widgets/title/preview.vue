<template>
  <div class="diy-title" :style="wrapStyle">
    <div class="diy-title-main" :style="{ color: titleColor }">{{ mainTitle }}</div>
    <div v-if="subTitle" class="diy-title-sub">{{ subTitle }}</div>
  </div>
</template>

<script>
/**
 * 标题 —— 画布预览
 *
 * 与「标签栏」(title-block) 是两个不同的组件：title-block 是带描边/菱形的三种装饰风格、
 * 只有主标题；本组件是「主标题 + 副标题」的段落标题，用于给下方内容分组，
 * 预置的商品分类页 / 购物车页默认装修里的「猜你喜欢」「为你推荐」用的就是它。
 *
 * 字段与 App 端 components/qdiy/widgets/qdiyBasic.vue（type="title"）严格对齐：
 *   data.title / data.mainTitle  主标题
 *   data.subTitle                副标题
 *   computedStyle.textStyle      主标题颜色
 *   computedStyle.iptBg          背景色
 *   computedStyle.spaceStyle     内边距（对象形式的 CSS）
 * 尺寸按 App 的 rpx 折算：24rpx 内边距≈12px、32rpx 主标题≈16px、24rpx 副标题≈12px。
 */
export default {
  name: 'TitlePreview',
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
    data() {
      return this.activeItem.data || {};
    },
    mainTitle() {
      return this.data.title || this.data.mainTitle || '标题';
    },
    subTitle() {
      return this.data.subTitle || '';
    },
    titleColor() {
      return this.computedStyle.textStyle || '#333333';
    },
    wrapStyle() {
      // spaceStyle 是一个已经带单位的 CSS 对象，直接摊平覆盖默认内边距
      return Object.assign(
        { background: this.computedStyle.iptBg || 'transparent' },
        this.computedStyle.spaceStyle || {}
      );
    },
  },
};
</script>

<style scoped lang="scss">
.diy-title {
  padding: 12px;
  box-sizing: border-box;
}
.diy-title-main {
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
}
.diy-title-sub {
  margin-top: 3px;
  font-size: 12px;
  color: #999;
  line-height: 17px;
}
</style>
