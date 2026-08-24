<template>
  <div class="img-ad-swiper-style">
    <diy-img-setting
      ref="imgSetting"
      suggest-size-text="建议图片宽度750，高度自适应，支持jpg、png"
      top-name="添加图片"
      :open-add-img="true"
      :show-url="true"
      :show-hot-zone="false"
      :img-infos="imgAdArr"
      max-img-length="999"
      @change="addIconImg"
      @pick-link="(index, item) => openLinkPicker('imgSetting', item)"
    />

    <diy-style-contain title="指示点样式">
      <el-radio-group v-model="dotType" @change="dotChange">
        <el-radio :label="0">圆形</el-radio>
        <el-radio :label="1">正方形</el-radio>
        <el-radio :label="2">长方形</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />

    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/** 轮播图片 —— 属性面板。迁移自 PHP common/img-ad-swiper/style.php */
import basicMixins from '../../controls/basicMixins';
import linkPickerMixins from '../../controls/linkPickerMixins';

export default {
  name: 'ImgAdSwiperStyle',
  mixins: [basicMixins, linkPickerMixins],
  data() {
    return {
      imgAdArr: [],
      dotType: 0,
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.colorInfos[0].name = '背景色';
      this.defaultForm.sizeInfos = ['上边距', '下边距', '左右边距'];

      if (!this.result.data) this.$set(this.result, 'data', {});
      if (!this.result.data.dotType) {
        this.result.data.dotType = this.dotType;
      } else {
        this.dotType = this.result.data.dotType;
      }
      if (this.result.data.imgAdArr) this.imgAdArr = this.result.data.imgAdArr;
    },
    addIconImg(val) {
      this.imgAdArr = this.result.data.imgAdArr ? this.result.data.imgAdArr : val;
      this.result.data.imgAdArr = this.imgAdArr;
      this.result.computedStyle.imgAdArr = this.imgAdArr.map((v) => v.color);
      this.updateInfos();
    },
    // 覆写 mixin：这里写的是 padding 而不是 margin，与原实现一致
    sliderChange(val) {
      this.defaultForm.sizeInfos = this.result.data.spaceInfo ? this.result.data.spaceInfo : val;
      const s = this.defaultForm.sizeInfos;
      this.result.computedStyle.spaceStyle = {
        paddingTop: s[0].value + s[0].unit,
        paddingBottom: s[1].value + s[1].unit,
        paddingLeft: s[2].value + s[2].unit,
        paddingRight: s[2].value + s[2].unit,
      };
      this.result.data.spaceInfo = s;
      this.updateInfos();
    },
    dotChange() {
      this.result.data.dotType = this.dotType;
      this.updateInfos();
    },
    updateInfos() {
      this.$emit('update', this.result);
    },
  },
};
</script>
