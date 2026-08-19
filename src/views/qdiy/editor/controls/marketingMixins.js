/**
 * 营销类组件属性面板的公共逻辑（P6 批次 5）
 *
 * PHP 侧 group-goods / bargain-goods / gift-goods / blindbox-goods / lucky-group /
 * secondary-card / course / notes-articles 等十余个 style.php 是同一套骨架抄出来的：
 *   标题（显示开关 + 文字 + 上下内边距）
 *   活动/商品选择（com-pick-link）
 *   组件样式（描边/投影）+ 配色 + 组件边距 + 圆角
 * 这里把重复部分抽成 mixin，各组件只声明自己的 colorInfos / colorKeys / 标题默认文案等。
 *
 * 依赖 basicMixins（提供 result / defaultForm / updataResult 等）。
 */
import { getObjValue } from './utils';

export default {
  data() {
    return {
      titleRadio: 0,
      titleList: [],
      pickImgList: [],
      maxGroupLen: 30,
      imgIndex: 0,
      colorInfos: [],
      defColor: [],
      // colorInfos 下标 → computedStyle 字段
      colorKeys: [],
      sizeInfos: ['商品间距', '上边距', '下边距', '左右边距'],
      sizeInfosValue: [5, 0, 0, 0],
      sizeInfosMax: [50, 50, 50, 20],
      sizeKeys: ['spacing', 'marginTop', 'marginBottom', 'aroundMargin'],
    };
  },
  methods: {
    /**
     * 在组件 init() 里调用，defaultTitle 为标题默认文案
     * 标题相关的值写在 data 上（与 PHP 侧一致），不是 computedStyle
     */
    initMarketing(defaultTitle) {
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.titleList = [
        { type: 'input', label: '文字', value: defaultTitle, max: 6, showLimit: true, setKey: 'title' },
        { type: 'size', label: '上边距', value: 10, setKey: 'paddingTop', maxValue: 20 },
        { type: 'size', label: '下边距', value: 10, setKey: 'paddingBottom', maxValue: 20 },
      ];
      this.titleRadio = this.result.data.titleRadio || 0;
      this.pickImgList = getObjValue(this.result, ['data', 'goods'], []);
      if (this.result.data.groupStyle && this.imgInfo) {
        const i = this.imgInfo.findIndex((item) => item.type === this.result.data.groupStyle.type);
        if (i > -1) this.imgIndex = i;
      }
      this.initDataList('titleList');
    },

    titleChange(e) {
      this.$set(this.result.data, 'titleRadio', e);
      this.$emit('update', this.result);
    },
    onTitleListChange() {
      this.updataDataList('titleList');
    },
    onGoodsChange(list) {
      this.pickImgList = list;
      this.$set(this.result.data, 'goods', list);
      this.$emit('update', this.result);
    },
    upImgIndex(index, item) {
      this.imgIndex = index;
      this.$set(this.result.data, 'groupStyle', item);
      this.$emit('update', this.result);
    },

    updateColor(arr) {
      this.updateSome(arr, 'colorInfos');
      const cs = this.result.computedStyle;
      this.colorKeys.forEach((key, i) => {
        if (this.colorInfos[i]) cs[key] = this.colorInfos[i].color;
      });
      this.$emit('update', this.result);
    },
    updateSize(arr) {
      this.updateSome(arr, 'sizeInfos');
      const cs = this.result.computedStyle;
      this.sizeKeys.forEach((key, i) => {
        if (this.sizeInfos[i]) cs[key] = this.sizeInfos[i].value + this.sizeInfos[i].unit;
      });
      this.$emit('update', this.result);
    },
    // 已存数据优先，否则把控件回传的结构存进 data
    updateSome(arr, name) {
      this[name] = arr;
      if (this.result.data[name] && this.result.data[name].length) {
        this[name] = this.result.data[name];
      } else {
        this.$set(this.result.data, name, this[name]);
      }
    },

    /** setKey 型控件：已有值回填 */
    initDataList(target) {
      const data = this.result.data;
      if (!this[target] || !this[target].length) return;
      this[target] = this[target].map((item) => {
        const obj = Object.assign({}, item);
        if (item.setKey in data && data[item.setKey] !== '') obj.value = data[item.setKey];
        return obj;
      });
    },
    /** setKey 型控件：值写回 data */
    updataDataList(target) {
      this[target].forEach((item) => {
        if (item.setKey) this.$set(this.result.data, item.setKey, item.value);
      });
      this.$emit('update', this.result);
    },
  },
};
