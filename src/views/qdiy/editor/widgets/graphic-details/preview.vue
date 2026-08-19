<template>
  <div class="graphic-details-preview" :style="{ background: computedStyle.searchBox }">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div :style="inputStyle" v-html="content" />
  </div>
</template>

<script>
/** 图文详情 —— 画布预览。迁移自 PHP common/graphic-details/preview.php */
const DEFAULT_CONTENT = `
<div style="position: relative;box-sizing: border-box;overflow: hidden;color: #333;font-size: 16px;line-height: 1.5;text-align: left;word-wrap: break-word;">
<p>点此编辑『富文本』内容 ——&gt;</p>
<p>你可以对文字进行<strong>加粗</strong>、<em>斜体</em>、<span style="text-decoration: underline;">下划线</span>、<span style="text-decoration: line-through;">删除线</span>、文字<span style="color: rgb(0, 176, 240);">颜色</span>、<span style="background-color: rgb(255, 192, 0); color: rgb(255, 255, 255);">背景色</span>、以及字号<span style="font-size: 20px;">大</span><span style="font-size: 14px;">小</span>等简单排版操作。</p>
<p style="text-align: left;">也可在这里插入图片、并对图片加上超级链接，方便用户点击。</p>
</div>`;

export default {
  name: 'GraphicDetailsPreview',
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
    content() {
      const c = this.activeItem.data && this.activeItem.data.content;
      return c || DEFAULT_CONTENT;
    },
    inputStyle() {
      const tabItem = this.computedStyle.tabItem;
      const style = {
        background: this.computedStyle.iptBg,
        ...this.computedStyle.searchIpts,
      };
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
.graphic-details-preview {
  padding: 10px;
  overflow: hidden;

  ::v-deep table {
    border-top: 1px solid #ccc;
    border-left: 1px solid #ccc;

    th {
      background-color: #f1f1f1;
    }
    th,
    td {
      border-bottom: 1px solid #ccc;
      border-right: 1px solid #ccc;
      text-align: center;
      padding: 3px 5px;
      height: 30px;
    }
  }
}
</style>
