<template>
  <div>
    <diy-tabs title="样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />

    <diy-color top-name="选择颜色" :color-infos="colorInfos" :str-color="defColor" @change="updateColor" />

    <diy-align title="文字位置" :current="defaultForm.alignCurrent" @change="updataText" />

    <diy-style-contain title="默认文字">
      <div class="row">
        <div class="row-label">文字</div>
        <el-input
          v-model="defaultForm.name"
          placeholder="请输入内容"
          maxlength="10"
          size="small"
          show-word-limit
          @input="textChange"
        />
      </div>
    </diy-style-contain>

    <diy-size-setting top-name="边距" :size-infos="sizeInfos" :max-value="50" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
    <diy-size-setting top-name="高度设置" :size-infos="heightInfos" :min-value="30" @change="heightChange" />
  </div>
</template>

<script>
/** 搜索框 —— 属性面板。迁移自 PHP common/search/style.php */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'SearchStyle',
  mixins: [basicMixins],
  data() {
    return {
      colorInfos: ['底部背景', '组件背景', '图标颜色', '文字颜色'],
      defColor: ['', '', '', ''],
      // 搜索框的左右边距是分开的，所以不用 mixin 的三项
      sizeInfos: ['上边距', '下边距', '左边距', '右边距'],
      heightInfos: [{ name: '高度', value: 30, minValue: 30, maxValue: 50, unit: 'px' }],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.$set(this.defaultForm, 'alignCurrent', 'left');
      this.$set(this.defaultForm, 'name', '');

      this.defaultForm.alignCurrent = getObjValue(
        this.result,
        ['computedStyle', 'searchIpts', 'justify-content'],
        this.defaultForm.alignCurrent,
      );
      this.defaultForm.name = getObjValue(this.result, ['data', 'name'], this.defaultForm.name);

      if (this.result.computedStyle.heightInfos) {
        this.heightInfos[0].value = this.result.computedStyle.heightInfos[0].value;
      } else {
        this.$set(this.result.computedStyle, 'heightInfos', this.heightInfos);
      }
    },
    updateColor(e) {
      this.colorInfos = e;
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.result.data.colorInfos) {
        this.colorInfos = this.result.data.colorInfos;
      } else {
        this.result.data.colorInfos = this.colorInfos;
      }
      this.result.computedStyle.searchBox = this.colorInfos[0].color;
      this.result.computedStyle.iptBg = this.colorInfos[1].color;
      this.result.computedStyle.iconsStyle = this.colorInfos[2].color;
      this.result.computedStyle.textStyle = this.colorInfos[3].color;
      this.$emit('update', this.result);
    },
    updataText(type) {
      const map = { left: 'flex-start', center: 'center' };
      this.searchIpts = Object.assign(this.searchIpts, {
        'justify-content': map[type] || 'flex-end',
      });
      this.updataResult(this.searchIpts, 'searchIpts');
    },
    textChange(e) {
      this.updataData(e, 'name');
    },
    // 覆写 mixin：这里左右边距是两项，不是合并的一项
    sliderChange(arr) {
      this.sizeInfos = arr;
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.result.data.sizeInfos && this.result.data.sizeInfos.length) {
        this.sizeInfos = this.result.data.sizeInfos;
      } else {
        this.result.data.sizeInfos = this.sizeInfos;
      }
      const s = this.sizeInfos;
      this.searchIpts = Object.assign(this.searchIpts, {
        marginTop: s[0] && s[0].value + s[0].unit,
        marginBottom: s[1] && s[1].value + s[1].unit,
        marginLeft: s[2] && s[2].value + s[2].unit,
        marginRight: s[3] && s[3].value + s[3].unit,
      });
      this.updataResult(this.searchIpts, 'searchIpts');
    },
    heightChange(val) {
      this.updataResult(val, 'heightInfos');
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
}
.row-label {
  width: 70px;
  color: #999;
  flex-shrink: 0;
}
</style>
