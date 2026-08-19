<template>
  <div>
    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-size-setting top-name="空白高度" :size-infos="defaultForm.sizeInfos" :max-value="100" @change="heightChange" />
  </div>
</template>

<script>
/** 辅助空白 —— 属性面板。迁移自 PHP common/auxiliary-blank/style.php */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'AuxiliaryBlankStyle',
  mixins: [basicMixins],
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      // 空白高度只有一个滑块，覆盖 mixin 里的三项边距
      this.defaultForm.sizeInfos = [
        {
          name: '',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'height'], 46)),
          unit: 'px',
          disabled: false,
          maxValue: 100,
        },
      ];
      this.heightChange(this.defaultForm.sizeInfos);
    },
    heightChange(arr) {
      this.updataResult(arr[0].value + arr[0].unit, 'height');
    },
  },
};
</script>
