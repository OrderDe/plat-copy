<template>
  <div>
    <diy-tabs title="样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />

    <diy-color top-name="选择颜色" :color-infos="colorInfos" :str-color="defColor" @change="updateColor" />

    <diy-style-contain title="默认文字">
      <div v-for="field in textFields" :key="field.key" class="row">
        <div class="row-label">{{ field.label }}</div>
        <el-input
          v-model="defaultForm[field.key]"
          placeholder="请输入内容"
          :maxlength="field.max"
          size="small"
          show-word-limit
          @input="textChange($event, field.key)"
        />
      </div>
    </diy-style-contain>

    <diy-size-setting top-name="边距" :size-infos="sizeInfos" :max-value="50" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/** 车型搜索 —— 属性面板。迁移自 PHP common/car-search/style.php */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

const TEXT_FIELDS = [
  { key: 'title_text', label: '标题文字', max: 10, def: '快速匹配机油' },
  { key: 'more_text', label: '更多文字', max: 10, def: '按车型查询>>' },
  { key: 'mark_text', label: '角标文本', max: 10, def: 'seo' },
  { key: 'scan_text', label: '拍摄文字', max: 10, def: '拍VIN码' },
  { key: 'name', label: '搜索文字', max: 50, def: '请输入17位VIN码，如"LHGGE88198398"' },
  { key: 'btn_text', label: '按钮文字', max: 4, def: '搜索' },
];

// colorInfos 下标 → computedStyle 字段
const COLOR_KEYS = [
  'searchBox',
  'iptBg',
  'iconsStyle',
  'markBgStyle',
  'markStyle',
  'titleStyle',
  'moreStyle',
  'scanStyle',
  'textStyle',
  'btnTextBg',
  'btnTextStyle',
];

export default {
  name: 'CarSearchStyle',
  mixins: [basicMixins],
  data() {
    return {
      textFields: TEXT_FIELDS,
      colorInfos: [
        '底部背景',
        '组件背景',
        '图标颜色',
        '角标背景',
        '角标颜色',
        '标题文本',
        '更多文本',
        '拍摄文本',
        '搜索文本',
        '按钮背景',
        '按钮文本',
      ],
      defColor: [],
      sizeInfos: ['上边距', '下边距'],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      TEXT_FIELDS.forEach((f) => {
        this.$set(this.defaultForm, f.key, getObjValue(this.result, ['data', f.key], f.def));
      });
    },
    updateColor(e) {
      this.colorInfos = e;
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.result.data.colorInfos) {
        this.colorInfos = this.result.data.colorInfos;
      } else {
        this.result.data.colorInfos = this.colorInfos;
      }
      COLOR_KEYS.forEach((key, i) => {
        this.result.computedStyle[key] = this.colorInfos[i] && this.colorInfos[i].color;
      });
      this.$emit('update', this.result);
    },
    textChange(e, name) {
      this.updataData(e, name);
    },
    // 覆写 mixin：只有上/下两项
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
      });
      this.updataResult(this.searchIpts, 'searchIpts');
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.row-label {
  width: 70px;
  color: #999;
  flex-shrink: 0;
}
</style>
