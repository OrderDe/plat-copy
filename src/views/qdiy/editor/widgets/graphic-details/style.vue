<template>
  <div>
    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-tabs title="样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />

    <diy-style-contain title="内容">
      <Tinymce v-model="text" :height="300" @input="textChange" />
    </diy-style-contain>

    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/**
 * 图文详情 —— 属性面板。迁移自 PHP common/graphic-details/style.php
 *
 * PHP 侧用 wangEditor + 自建上传接口 common/file/upload；
 * 平台端已有 `@/components/Tinymce`（自带图片上传），直接换用。
 */
import Tinymce from '@/components/Tinymce';
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'GraphicDetailsStyle',
  components: { Tinymce },
  mixins: [basicMixins],
  data() {
    return {
      text: '',
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.colorInfos.push({
        name: '组件背景',
        color: getObjValue(this.result, ['computedStyle', 'iptBg'], this.defaultForm.defColor),
        showAlpha: false,
      });
      // 该组件左右边距不可调，去掉 mixin 里的第三项
      this.defaultForm.sizeInfos.pop();
      this.text = (this.result.data && this.result.data.content) || '';
    },
    textChange(html) {
      this.updataData(html, 'content');
    },
    updateColor(e) {
      this.result.computedStyle.searchBox = e[0] && e[0].color;
      this.result.computedStyle.iptBg = e[1] && e[1].color;
      this.$emit('update', this.result);
    },
  },
};
</script>
