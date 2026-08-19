<template>
  <div>
    <diy-size-setting
      top-name="组件边距"
      :size-infos="sizeInfos"
      :size-infos-value="sizeInfosValue"
      :size-infos-max="sizeInfosMax"
      @change="updateSize"
    />
  </div>
</template>

<script>
/** 商品介绍 —— 属性面板。迁移自 PHP common/goods-parse/style.php，只有一组组件边距 */
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'GoodsParseStyle',
  mixins: [basicMixins],
  data() {
    return {
      sizeInfos: ['上边距', '下边距', '左右边距'],
      sizeInfosValue: [0, 0, 0],
      sizeInfosMax: [50, 50, 20],
    };
  },
  methods: {
    updateSize(arr) {
      this.sizeInfos = arr;
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.result.data.sizeInfos && this.result.data.sizeInfos.length) {
        this.sizeInfos = this.result.data.sizeInfos;
      } else {
        this.$set(this.result.data, 'sizeInfos', this.sizeInfos);
      }
      const cs = this.result.computedStyle;
      ['marginTop', 'marginBottom', 'aroundMargin'].forEach((key, i) => {
        cs[key] = this.sizeInfos[i].value + this.sizeInfos[i].unit;
      });
      this.$emit('update', this.result);
    },
  },
};
</script>
