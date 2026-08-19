<template>
  <div>
    <diy-style :img-info="imgInfo" :def-index="imgIndex" @change="upImgIndex" />

    <diy-style-contain title="标题文字">
      <div class="row">
        <div class="row-label">文字</div>
        <el-input v-model="value" placeholder="标题栏" :maxlength="20" show-word-limit @input="titleChange" />
      </div>
    </diy-style-contain>

    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
  </div>
</template>

<script>
/** 标题栏 —— 属性面板。迁移自 PHP common/title-block/style.php */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'TitleBlockStyle',
  mixins: [basicMixins],
  data() {
    return {
      value: '',
      // img 指向 PHP 侧的风格示意图，平台端没有该资源，缺图不影响选择
      imgInfo: [
        { img: 'title-block/title-style1.png', text: '风格1', type: 1 },
        { img: 'title-block/title-style2.png', text: '风格2', type: 2 },
        { img: 'title-block/title-style3.png', text: '风格3', type: 3 },
      ],
      imgIndex: 0,
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.colorInfos = [
        {
          name: '背景颜色',
          color: getObjValue(this.result, ['computedStyle', 'bgColor'], 'transparent'),
          showAlpha: true,
        },
        {
          name: '标题颜色',
          color: getObjValue(this.result, ['computedStyle', 'titleColor'], '#000'),
          showAlpha: false,
        },
      ];
      // 标题栏只要上下边距，去掉左右边距那一项
      this.defaultForm.sizeInfos.pop();

      if (!this.result.data) this.$set(this.result, 'data', {});
      this.value = this.result.data.title;

      if (this.result.data.titleStyle) {
        this.imgIndex = this.imgInfo.findIndex((item) => item.type === this.result.data.titleStyle.type);
      }
    },
    titleChange() {
      this.updataData(this.value, 'title');
    },
    upImgIndex(index, item) {
      this.imgIndex = index;
      this.updataData(item, 'titleStyle');
    },
    updateColor(e) {
      this.result.computedStyle.bgColor = e[0].color;
      if (e[1]) this.result.computedStyle.titleColor = e[1].color;
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
.row-label {
  width: 80px;
  text-align: center;
  flex-shrink: 0;
  color: #999;
}
</style>
