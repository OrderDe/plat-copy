<template>
  <div>
    <diy-color :color-infos="colorInfos" :str-color="defColor" @change="updateColor" />
    <diy-size-setting
      top-name="边距"
      :size-infos="sizeInfos"
      :min-value="0"
      :size-infos-max="sizeInfosMax"
      @change="updateSize"
    />
    <diy-size-setting
      top-name="圆角设置"
      :size-infos="radiusInfos"
      :size-infos-value="[4, 4]"
      :max-value="20"
      @change="RadiusChange"
    />
  </div>
</template>

<script>
/** 定位 —— 属性面板。迁移自 PHP common/position/style.php */
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'PositionStyle',
  mixins: [basicMixins],
  data() {
    return {
      colorInfos: ['背景', '门店名称', '门店距离', '按钮颜色', '图标颜色', '箭头颜色'],
      defColor: ['#ffffff', '#2F3033', '#989BA6', '#676769', '#8599AE', '#8599AE'],
      sizeInfos: ['上边距', '下边距', '左右边距'],
      sizeInfosMax: [50, 50, 20],
      radiusInfos: ['上圆角', '下圆角'],
    };
  },
  methods: {
    updateColor(arr) {
      this.updateSome(arr, 'colorInfos');
      const style = this.result.computedStyle;
      ['background', 'storeNameColor', 'storeDistanceColor', 'btnColor', 'iconColor', 'arrowColor'].forEach((it, i) => {
        style[it] = this.colorInfos[i].color;
      });
      this.$emit('update', this.result);
    },
    updateSize(arr) {
      this.updateSome(arr, 'sizeInfos');
      const style = this.result.computedStyle;
      style.sizeObj = style.sizeObj || {};
      ['marginTop', 'marginBottom', 'aroundMargin'].forEach((it, i) => {
        style.sizeObj[it] = this.sizeInfos[i].value + this.sizeInfos[i].unit;
      });
      this.$emit('update', this.result);
    },
    // 已有数据优先，否则把控件回传的结构存进 data
    updateSome(arr, name) {
      this[name] = arr;
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.result.data[name] && this.result.data[name].length) {
        this[name] = this.result.data[name];
      } else {
        this.result.data[name] = this[name];
      }
    },
  },
};
</script>
