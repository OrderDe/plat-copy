<template>
  <div>
    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />

    <diy-style-contain title="风格">
      <div v-for="(item, index) in lineType" :key="item.type" class="line-cell" @click="onChange(index)">
        <div class="line" :class="[index === current ? 'active-line' : '']">
          <div :style="{ margin: '0 10px', border: computedBorder(item) }" />
        </div>
        <div class="line-title">{{ item.title }}</div>
      </div>
    </diy-style-contain>

    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
  </div>
</template>

<script>
/** 辅助线 —— 属性面板。迁移自 PHP common/auxiliary-line/style.php */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'AuxiliaryLineStyle',
  mixins: [basicMixins],
  data() {
    return {
      lineType: [
        { type: 0, title: '风格一' },
        { type: 1, title: '风格二' },
      ],
      current: 0,
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.current = this.result.computedStyle.type || 0;
      // 在 mixin 的「底部背景」之外再加一个「线条」颜色
      this.defaultForm.colorInfos.push({
        name: '线条',
        color: getObjValue(this.result, ['computedStyle', 'lineColor'], '#000'),
        showAlpha: false,
      });
      this.updateColor(this.defaultForm.colorInfos);

      const marginArr = [
        {
          name: '上边距',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginTop'], 20)),
          unit: 'px',
          disabled: false,
          maxValue: 50,
        },
        {
          name: '下边距',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginBottom'], 20)),
          unit: 'px',
          disabled: false,
          maxValue: 50,
        },
        {
          name: '左右边距',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginLeft'], 10)),
          unit: 'px',
          disabled: false,
          maxValue: 20,
        },
      ];
      this.defaultForm.sizeInfos = marginArr;
      this.sliderChange(marginArr);
    },
    computedBorder(item) {
      const getType = { 0: 'solid', 1: 'dashed' };
      return `${getType[item.type]} 1px #000`;
    },
    onChange(index) {
      this.current = index;
      this.result.computedStyle.type = this.lineType[index].type;
      this.$emit('update', this.result);
    },
    // 这里同时写回底部背景与线条颜色，覆盖 mixin 的默认实现
    updateColor(e) {
      this.result.computedStyle.searchBox = e[0].color;
      if (e[1]) this.result.computedStyle.lineColor = e[1].color;
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.line-cell {
  text-align: center;
  cursor: pointer;
}
.line {
  padding: 20px 0;
  border: 2px solid transparent;
}
.active-line {
  border: 2px solid #2d8cf0;
}
.line-title {
  font-size: 14px;
  font-weight: bold;
  color: #999;
  margin: 16px 0;
}
</style>
