<template>
  <div>
    <diy-style-contain title="标题内容">
      <div class="title-field">
        <div class="title-field-label">主标题</div>
        <el-input
          v-model="mainTitle"
          placeholder="例如：猜你喜欢"
          maxlength="30"
          show-word-limit
          @input="onMainTitleInput"
        />
      </div>
      <div class="title-field">
        <div class="title-field-label">副标题</div>
        <el-input
          v-model="subTitle"
          placeholder="选填，例如：根据浏览记录为你挑选"
          maxlength="50"
          show-word-limit
          @input="onSubTitleInput"
        />
      </div>
    </diy-style-contain>

    <diy-color top-name="颜色" :color-infos="defaultForm.colorInfos" @change="onColorChange" />

    <diy-size-setting top-name="内边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="onSpaceChange" />
  </div>
</template>

<script>
/**
 * 标题 —— 属性面板
 *
 * 写回的字段与 App 端 qdiyBasic(type="title") 对齐，见同目录 preview.vue 的说明。
 * 内边距写进 computedStyle.spaceStyle 而不是 mixin 默认的 searchIpts：
 * App 端读的是 spaceStyle，写错地方会出现「编辑器有间距、App 上没有」。
 */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'TitleStyle',
  mixins: [basicMixins],
  data() {
    return {
      mainTitle: '',
      subTitle: '',
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});

      this.mainTitle = this.result.data.title || this.result.data.mainTitle || '';
      this.subTitle = this.result.data.subTitle || '';

      this.defaultForm.colorInfos = [
        {
          name: '标题颜色',
          color: getObjValue(this.result, ['computedStyle', 'textStyle'], '#333333'),
          showAlpha: false,
        },
        {
          name: '背景颜色',
          color: getObjValue(this.result, ['computedStyle', 'iptBg'], '#FFFFFF'),
          showAlpha: false,
        },
      ];

      const space = getObjValue(this.result, ['computedStyle', 'spaceStyle'], {}) || {};
      this.defaultForm.sizeInfos = [
        { name: '上边距', value: this.pxOf(space.paddingTop, 12), unit: 'px', disabled: false, maxValue: 50 },
        { name: '下边距', value: this.pxOf(space.paddingBottom, 12), unit: 'px', disabled: false, maxValue: 50 },
        { name: '左右边距', value: this.pxOf(space.paddingLeft, 12), unit: 'px', disabled: false, maxValue: 50 },
      ];
    },
    /** spaceStyle 里存的是 '12px' 这样的带单位字符串，滑块要的是数字 */
    pxOf(value, def) {
      const n = parseFloat(value);
      return Number.isFinite(n) ? n : def;
    },
    onMainTitleInput() {
      this.updataData(this.mainTitle, 'title');
    },
    onSubTitleInput() {
      this.updataData(this.subTitle, 'subTitle');
    },
    onColorChange(infos) {
      this.$set(this.result.computedStyle, 'textStyle', infos[0] && infos[0].color);
      this.$set(this.result.computedStyle, 'iptBg', infos[1] && infos[1].color);
      this.$emit('update', this.result);
    },
    onSpaceChange(arr) {
      const val = (item) => (item ? item.value + item.unit : undefined);
      const lr = val(arr[2]);
      this.updataResult(
        Object.assign({}, getObjValue(this.result, ['computedStyle', 'spaceStyle'], {}), {
          paddingTop: val(arr[0]),
          paddingBottom: val(arr[1]),
          paddingLeft: lr,
          paddingRight: lr,
        }),
        'spaceStyle'
      );
    },
  },
};
</script>

<style scoped lang="scss">
.title-field + .title-field {
  margin-top: 12px;
}
.title-field-label {
  margin-bottom: 6px;
  font-size: 12px;
  color: #606266;
}
</style>
