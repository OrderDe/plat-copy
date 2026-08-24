<template>
  <div>
    <diy-style-contain title="风格">
      <el-radio-group v-model="mode" @change="onModeChange">
        <el-radio-button v-for="opt in modeList" :key="opt.value" :label="opt.value">
          {{ opt.text }}
        </el-radio-button>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain v-if="mode === 'grid'" title="每行个数">
      <el-radio-group v-model="colCount" @change="updataData($event, 'colCount')">
        <el-radio :label="3">3 个</el-radio>
        <el-radio :label="4">4 个</el-radio>
        <el-radio :label="5">5 个</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="分类图">
      <el-radio-group v-model="showImage" @change="updataData($event, 'showImage')">
        <el-radio :label="true">显示</el-radio>
        <el-radio :label="false">隐藏</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <!--
      分类项：图 + 名字 + 链接，与常用图标组用的是同一个控件和同一套数据结构，
      运营的操作习惯保持一致（点图上传、点链接开选择器）。
    -->
    <diy-icon-set
      ref="cateSet"
      :list="cateList"
      :type="1"
      :width-img="48"
      :height-img="48"
      :show-close="true"
      :show-link="true"
      :show-add-btn="true"
      :max-icon-length="30"
      @change="onCateChange"
      @pick-link="(index, item) => openLinkPicker('cateSet', item)"
    />

    <diy-color top-name="颜色" :color-infos="defaultForm.colorInfos" @change="onColorChange" />

    <diy-size-setting top-name="内边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="onSpaceChange" />

    <div class="cate-tip">
      分类项由这里手动配置，链接可以指到店内分类、商品列表或活动页。
      在店铺页面里使用时，跳转会自动带上本店 merId。
    </div>

    <!-- 链接选择弹窗，openLinkPicker 靠 ref="linkPicker" 找它，漏了点「链接」不会有反应 -->
    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 分类展示 —— 属性面板
 *
 * 走「手动配置 + 链接」这条路，与 commonly-icon-group / nav 等组件同一套数据结构：
 *   data.cateList = [{ img, btnText, link_params }]
 * 之前做过一版自动读店铺分类树的，运营控制不了顺序、图和文案，也没法把某个分类
 * 指到活动页，改成手动配置。
 *
 * 字段与 App 端 components/qdiy/widgets/qdiyGoodsCate.vue 对齐，见 preview.vue 的说明。
 */
import basicMixins from '../../controls/basicMixins';
import linkPickerMixins from '../../controls/linkPickerMixins';
import { getObjValue } from '../../controls/utils';

const MODE_LIST = [
  { value: 'grid', text: '宫格' },
  { value: 'scroll', text: '横向滑动' },
];

const DEFAULT_CATES = ['口腔护理', '面部护肤', '美妆个护', '家庭清洁'].map((btnText) => ({
  img: '',
  btnText,
  link_params: null,
}));

export default {
  name: 'GoodsCateStyle',
  mixins: [basicMixins, linkPickerMixins],
  data() {
    return {
      modeList: MODE_LIST,
      mode: 'grid',
      colCount: 4,
      showImage: true,
      cateList: DEFAULT_CATES.map((it) => ({ ...it })),
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});

      const d = this.result.data;
      this.mode = MODE_LIST.some((m) => m.value === d.mode) ? d.mode : 'grid';
      this.colCount = [3, 4, 5].indexOf(Number(d.colCount)) > -1 ? Number(d.colCount) : 4;
      this.showImage = d.showImage === undefined ? true : !!d.showImage;

      // 已配过就用配好的，没配过把默认几项写回去，免得面板里空着无从下手
      if (d.cateList && d.cateList.length) {
        this.cateList = d.cateList;
      } else {
        this.$set(this.result.data, 'cateList', this.cateList);
      }

      this.defaultForm.colorInfos = [
        {
          name: '分类名颜色',
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
        { name: '上边距', value: this.pxOf(space.paddingTop, 0), unit: 'px', disabled: false, maxValue: 50 },
        { name: '下边距', value: this.pxOf(space.paddingBottom, 0), unit: 'px', disabled: false, maxValue: 50 },
        { name: '左右边距', value: this.pxOf(space.paddingLeft, 0), unit: 'px', disabled: false, maxValue: 50 },
      ];
    },
    pxOf(value, def) {
      const n = parseFloat(value);
      return Number.isFinite(n) ? n : def;
    },
    onModeChange(val) {
      this.updataData(val, 'mode');
    },
    onCateChange(list) {
      this.cateList = list;
      this.$set(this.result.data, 'cateList', list);
      this.$emit('update', this.result);
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
.cate-tip {
  margin: 12px;
  padding: 8px 10px;
  background: #fff8e6;
  color: #8a5a00;
  font-size: 12px;
  line-height: 18px;
  border-radius: 4px;
}
</style>
