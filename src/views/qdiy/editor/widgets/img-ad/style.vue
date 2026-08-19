<template>
  <div class="img-ad-style">
    <diy-tabs
      title="选择风格"
      :list="buttonPattern"
      :default-item="buttonData.typeItem"
      :img-style="{ height: '30px', width: '30px' }"
      radio-text="text"
      @change="patternChange"
    />

    <diy-style-contain v-show="buttonData.typeIndex == 0" title="图片设置">
      <el-radio-group v-model="buttonData.oneType" @change="updateOneType">
        <el-radio label="0">标准</el-radio>
        <el-radio label="1">高级（热区）</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-img-setting
      suggest-size-text="建议图片宽度750，高度200-950，支持jpg、png"
      top-name="添加图片"
      :open-add-img="true"
      :show-url="!(buttonData.oneType == 1 && buttonData.typeIndex == 0)"
      :show-hot-zone="buttonData.oneType == 1 && buttonData.typeIndex == 0"
      :img-infos="imgAdArr"
      max-img-length="999"
      @change="addIconImg"
    />

    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/**
 * 图片广告 —— 属性面板。迁移自 PHP common/img-ad/style.php
 *
 * 风格 tab 原本用 resources/img/decorate/ 下的示意图（radio_text='image'），
 * 平台端没有这批资源，改成文字标签。
 */
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'ImgAdStyle',
  mixins: [basicMixins],
  data() {
    return {
      imgAdArr: [],
      buttonPattern: [
        { label: '单列', value: 'one' },
        { label: '双列', value: 'two' },
      ],
      buttonData: {
        typeItem: null,
        typeIndex: 0,
        oneType: '0',
      },
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.colorInfos[0].name = '背景色';
      // 比 mixin 多一项「图片间距」，所以整组重新用字符串数组交给控件初始化
      this.defaultForm.sizeInfos = ['图片间距', '上边距', '下边距', '左右边距'];

      if (!this.result.data) this.$set(this.result, 'data', {});
      const d = this.result.data;
      if (d.typeItem) this.buttonData.typeItem = d.typeItem;
      if (d.typeIndex) this.buttonData.typeIndex = d.typeIndex;
      if (d.oneType) this.buttonData.oneType = d.oneType;
      if (d.imgAdArr) this.imgAdArr = d.imgAdArr;
    },
    addIconImg(val) {
      this.imgAdArr = this.result.data.imgAdArr ? this.result.data.imgAdArr : val;
      this.result.data.imgAdArr = this.imgAdArr;
      this.result.computedStyle.imgAdArr = this.imgAdArr.map((v) => v.color);
      this.updateInfos();
    },
    patternChange(val) {
      this.buttonData.typeItem = val.item;
      this.buttonData.typeIndex = val.index;
      this.result.data.typeIndex = val.index;
      this.result.data.typeItem = val.item;
      this.updateInfos();
    },
    updateOneType() {
      this.result.data.oneType = this.buttonData.oneType;
      this.updateInfos();
    },
    // 覆写 mixin：第 0 项是图片间距，边距从第 1 项起
    sliderChange(val) {
      this.defaultForm.sizeInfos = this.result.data.spaceInfo ? this.result.data.spaceInfo : val;
      const s = this.defaultForm.sizeInfos;
      this.result.computedStyle.spaceStyle = {
        marginTop: s[1].value + s[1].unit,
        marginBottom: s[2].value + s[2].unit,
        marginLeft: s[3].value + s[3].unit,
        marginRight: s[3].value + s[3].unit,
      };
      this.result.data.spaceInfo = s;
      this.updateInfos();
    },
    updateInfos() {
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.img-ad-style {
  ::v-deep .el-radio-button__inner {
    padding: 0;
  }
}
</style>
