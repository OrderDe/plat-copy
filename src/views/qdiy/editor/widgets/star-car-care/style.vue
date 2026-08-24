<template>
  <div class="star-car-care-style">
    <!-- xun-ai 复用本面板时会多出「选择风格 + 图片设置（热区）」两块 -->
    <template v-if="showPattern">
      <diy-tabs
        title="选择风格"
        radio-text="text"
        :list="buttonPattern"
        :default-item="buttonData.typeItem"
        @change="patternChange"
      />
      <diy-style-contain v-show="buttonData.typeIndex == 0" title="图片设置">
        <el-radio-group v-model="buttonData.oneType" @change="updateOneType">
          <el-radio label="0">标准</el-radio>
          <el-radio label="1">高级（热区）</el-radio>
        </el-radio-group>
      </diy-style-contain>
    </template>

    <diy-img-setting
      ref="imgSetting"
      :top-name="showPattern ? '添加图片' : '图片设置'"
      :suggest-size-text="suggestText"
      :open-add-img="true"
      :show-url="showPattern ? !(buttonData.oneType == 1 && buttonData.typeIndex == 0) : false"
      :show-input="!showPattern"
      :show-hot-zone="showPattern && buttonData.oneType == 1 && buttonData.typeIndex == 0"
      :img-infos="imgAdArr"
      :max-img-length="999"
      @change="addIconImg"
      @pick-link="(index, item) => openLinkPicker('imgSetting', item)"
    />

    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="onSliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />

    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 星级洗车 —— 属性面板。迁移自 PHP common/star-car-care/style.php
 *
 * xun-ai 的 style.php 与本文件同源，只多了「选择风格 + 热区开关」，
 * 因此这里用 showPattern 开关合并，xun-ai 直接复用（见 widgets/xun-ai/style.vue）。
 */
import basicMixins from '../../controls/basicMixins';
import linkPickerMixins from '../../controls/linkPickerMixins';

export default {
  name: 'StarCarCareStyle',
  mixins: [basicMixins, linkPickerMixins],
  props: {
    showPattern: {
      type: Boolean,
      default: false,
    },
    suggestText: {
      type: String,
      default: '小程序之间的跳转需填写AppID与路径；app与小程序之间的跳转需填写原始ID与路径',
    },
  },
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
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.defaultForm.colorInfos[0].name = '背景色';
      this.defaultForm.sizeInfos = ['图片间距', '上边距', '下边距', '左右边距'];

      const d = this.result.data;
      if (d.typeItem) this.buttonData.typeItem = d.typeItem;
      if (d.typeIndex) this.buttonData.typeIndex = d.typeIndex;
      if (d.oneType) this.buttonData.oneType = d.oneType;
      this.imgAdArr = d.imgAdArr || [];
    },
    addIconImg(val) {
      this.imgAdArr = val;
      this.$set(this.result.data, 'imgAdArr', this.imgAdArr);
      this.$emit('update', this.result);
    },
    patternChange(val) {
      this.buttonData.typeItem = val.item;
      this.buttonData.typeIndex = val.index;
      this.$set(this.result.data, 'typeIndex', val.index);
      this.$set(this.result.data, 'typeItem', val.item);
      this.$emit('update', this.result);
    },
    updateOneType() {
      this.$set(this.result.data, 'oneType', this.buttonData.oneType);
      this.$emit('update', this.result);
    },
    // 覆写 mixin：第一项是图片间距，后三项才是外边距
    onSliderChange(val) {
      if (this.result.data.spaceInfo && this.result.data.spaceInfo.length) {
        this.defaultForm.sizeInfos = this.result.data.spaceInfo;
      } else {
        this.defaultForm.sizeInfos = val;
      }
      const s = this.defaultForm.sizeInfos;
      const lr = s[3] && s[3].value + s[3].unit;
      this.$set(this.result.computedStyle, 'spaceStyle', {
        marginTop: s[1] && s[1].value + s[1].unit,
        marginBottom: s[2] && s[2].value + s[2].unit,
        marginLeft: lr,
        marginRight: lr,
      });
      this.$set(this.result.data, 'spaceInfo', s);
      this.$emit('update', this.result);
    },
  },
};
</script>
