<template>
  <div>
    <diy-style-contain title="标题文字">
      <div class="row">
        <div class="ipt-title">文字</div>
        <el-input v-model="title" size="mini" @input="textInput" />
      </div>
    </diy-style-contain>

    <diy-icon-set
      :list="iconList"
      :type="btnType"
      :width-img="48"
      :height-img="48"
      :show-close="true"
      :show-link="true"
      :show-add-btn="true"
      :max-icon-length="30"
      @change="setChange($event, 'iconList')"
    />

    <diy-color :color-infos="colorInfos" :str-color="defColor" @change="setChange($event, 'colorInfos')" />
    <diy-size-setting top-name="组件边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
    <diy-size-setting
      top-name="内容圆角设置"
      :size-infos="defaultForm.conRadiusSets"
      :max-value="20"
      @change="conRadiusChange"
    />
  </div>
</template>

<script>
/**
 * 常用功能图标组 —— 属性面板。迁移自 PHP common/commonly-icon-group/style.php
 *
 * 默认四个图标 PHP 指向 /diy/icon-set/*.png，平台端无该素材，img 留空由使用方上传。
 */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

const DEFAULT_ICONS = ['推广中心', '购物车', '我的收藏', '收货地址'].map((btnText) => ({
  img: '',
  btnText,
  link_params: null,
}));

export default {
  name: 'CommonlyIconGroupStyle',
  mixins: [basicMixins],
  data() {
    return {
      title: '其他功能',
      btnType: 1,
      colorInfos: ['底部背景', '标题背景', '内容背景', '标题颜色', '按钮颜色'],
      defColor: ['transparent', 'transparent', '#fff', '#333', '#666'],
      iconList: DEFAULT_ICONS.map((it) => ({ ...it })),
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.title = this.result.data.title || this.title;

      const conRadiusArr = [
        {
          name: '上圆角',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'conRadiusSets', 'border-top-left-radius'], 0)),
          unit: 'px',
          disabled: false,
          maxValue: 20,
        },
      ];
      this.$set(this.defaultForm, 'conRadiusSets', conRadiusArr);
      this.conRadiusChange(conRadiusArr);
    },
    conRadiusChange(arr) {
      const top = arr[0].value + arr[0].unit;
      this.updataResult({ 'border-top-left-radius': top, 'border-top-right-radius': top }, 'conRadiusSets');
    },
    textInput(e) {
      this.updataData(e, 'title');
    },
    setChange(arr, name) {
      this[name] = arr;
      if (this.result.data[name] && this.result.data[name].length) {
        this[name] = this.result.data[name];
      } else {
        this.$set(this.result.data, name, this[name]);
      }
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
}
.ipt-title {
  width: 50px;
  color: #999;
  flex-shrink: 0;
}
</style>
