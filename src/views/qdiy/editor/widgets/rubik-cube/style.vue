<template>
  <div>
    <diy-style :img-style="{ width: '206px', height: '154px' }" :img-info="imgInfo" :def-index="imgIndex" @change="upImgIndex" />

    <diy-style-contain title="魔方布局">
      <diy-rubik-cube
        ref="rubikCube"
        :density="currentPreset.data.density"
        :style-boo="styleBoo"
        :cube-list="cubeListInfo"
        :style-arr="currentPreset.data.info"
        @change="getCubeInfo"
        @max="getMaxHeight"
        @pick-link="(index, item) => openLinkPicker('rubikCube', item)"
      />
      <diy-color :color-infos="defaultForm.colorInfos" :show-border-top="false" @change="updateColor" />
    </diy-style-contain>

    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />

    <diy-size-setting
      top-name="边距"
      :str-max-size-val="[50, 50, 50, 20]"
      :size-infos="defaultForm.sizeInfos"
      @change="sliderChange"
    />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/** 图片魔方 —— 属性面板。迁移自 PHP common/rubik-cube/style.php */
import basicMixins from '../../controls/basicMixins';
import linkPickerMixins from '../../controls/linkPickerMixins';
import { cubePresets } from './presets';

export default {
  name: 'RubikCubeStyle',
  mixins: [basicMixins, linkPickerMixins],
  data() {
    return {
      cubeListInfo: [],
      imgIndex: 0,
      imgInfo: cubePresets,
      // 标记是否是「切回来」，控件据此决定要不要复用已有图片数据
      styleBoo: false,
    };
  },
  computed: {
    currentPreset() {
      return this.imgInfo[this.imgIndex] || { data: { density: 4, info: [] } };
    },
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.sizeInfos = ['图片间距', '上边距', '下边距', '左右边距'];

      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.result.data.imgIndex) this.imgIndex = this.result.data.imgIndex;
      if (this.result.data.cubeListInfo) this.cubeListInfo = this.result.data.cubeListInfo;
      this.styleBoo = true;
    },
    getCubeInfo(val) {
      this.styleBoo = false;
      this.cubeListInfo = val;
      this.result.data.cubeListInfo = this.cubeListInfo;
      this.updateInfos();
    },
    getMaxHeight(height) {
      this.result.computedStyle.cubeHeight = { height: `${height / 2}px` };
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
    upImgIndex(index) {
      this.imgIndex = index;
      this.result.data.imgIndex = index;
      this.updateInfos();
    },
    updateInfos() {
      this.$emit('update', this.result);
    },
  },
};
</script>
