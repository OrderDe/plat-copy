<template>
  <div>
    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-tabs title="样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />
    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/** 模板占位 —— 属性面板。迁移自 PHP common/template/style.php */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'TemplateStyle',
  mixins: [basicMixins],
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.colorInfos.push({
        name: '组件背景',
        color: getObjValue(this.result, ['computedStyle', 'iptBg'], this.defaultForm.defColor),
        showAlpha: false,
      });
      // 该组件左右边距不可调
      this.defaultForm.sizeInfos.pop();
    },
    updateColor(e) {
      this.result.computedStyle.searchBox = e[0] && e[0].color;
      this.result.computedStyle.iptBg = e[1] && e[1].color;
      this.$emit('update', this.result);
    },
  },
};
</script>
