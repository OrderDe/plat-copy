<template>
  <div>
    <diy-style-contain title="按钮类型">
      <el-radio-group v-model="btnType" @change="btnTypeChange">
        <el-radio :label="1">图片</el-radio>
        <el-radio :label="2">图标</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-icon-set
      ref="iconSet"
      :list="iconList"
      :type="btnType"
      :width-img="48"
      :height-img="48"
      :show-close="false"
      :show-link="true"
      @change="setChange($event, 'iconList')"
      @pick-link="(index, item) => openLinkPicker('iconSet', item)"
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

    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 订单图标组 —— 属性面板。迁移自 PHP common/order-icon-group/style.php
 *
 * 默认五个订单状态图标 PHP 侧指向对象存储上的固定图片，平台端换成空图（由使用方自行上传）。
 */
import basicMixins from '../../controls/basicMixins';
import linkPickerMixins from '../../controls/linkPickerMixins';
import { getObjValue } from '../../controls/utils';

const DEFAULT_ICONS = ['待付款', '待发货', '待收货', '待评价', '退换货'].map((title) => ({
  title,
  img: '',
  btnText: title,
  link_params: null,
}));

export default {
  name: 'OrderIconGroupStyle',
  mixins: [basicMixins, linkPickerMixins],
  data() {
    return {
      btnType: 1,
      colorInfos: ['底部背景', '标题背景', '内容背景', '我的订单', '全部订单', '按钮颜色'],
      defColor: ['transparent', 'transparent', '#fff', '#333', '#999ca7', '#666'],
      iconList: DEFAULT_ICONS.map((it) => ({ ...it })),
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.btnType = this.result.data.btnType || this.btnType;

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
    btnTypeChange(e) {
      this.updataData(e, 'btnType');
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
