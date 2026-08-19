/**
 * 业务组件 style 面板的公共 mixin
 * 迁移自 PHP `backend/web/resources/js/diy-util.js` 中的 basicMixins
 *
 * 契约与 PHP 侧保持一致，P6 组件可以照搬原实现：
 *   - 接收 activeItem，内部深拷贝成 this.result
 *   - 改动后 $emit('update', this.result)，由编辑器合并回画布项
 *   - created 时调 init()，组件可覆写 init 并先调用 basicMixins.methods.init.call(this)
 *
 * 约定的 computedStyle 字段：
 *   searchBox  底部背景色
 *   searchIpts 边距 / 圆角等内联样式
 *   tabItem    样式 tab 选中项
 */
import { deepClone, getObjValue } from './utils';

const basicMixins = {
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      defaultForm: {
        default_color: 'transparer',
        colorInfos: ['底部背景'],
        sizeInfos: ['上边距', '下边距', '左右边距'],
        radiusInfos: ['上圆角', '下圆角'],
        defColor: 'transparent',
        tabItem: null,
      },
      result: {},
      searchIpts: {},
    };
  },
  created() {
    this.init();
  },
  methods: {
    init() {
      this.result = deepClone(this.activeItem);
      if (!this.result.computedStyle) this.$set(this.result, 'computedStyle', {});
      this.searchIpts = this.result.computedStyle.searchIpts || {};

      this.defaultForm.tabItem = getObjValue(this.result, ['computedStyle', 'tabItem'], this.defaultForm.tabItem);

      this.defaultForm.colorInfos = [
        {
          name: '底部背景',
          color: getObjValue(this.result, ['computedStyle', 'searchBox'], 'transparent'),
          showAlpha: false,
        },
      ];

      this.defaultForm.sizeInfos = [
        {
          name: '上边距',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginTop'], 0)),
          unit: 'px',
          disabled: false,
          maxValue: 50,
        },
        {
          name: '下边距',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginBottom'], 0)),
          unit: 'px',
          disabled: false,
          maxValue: 50,
        },
        {
          name: '左右边距',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginLeft'], 0)),
          unit: 'px',
          disabled: false,
          maxValue: 20,
        },
      ];

      this.defaultForm.radiusInfos = [
        {
          name: '上圆角',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'border-top-left-radius'], 0)),
          unit: 'px',
          disabled: false,
          maxValue: 20,
        },
        {
          name: '下圆角',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'border-bottom-right-radius'], 0)),
          unit: 'px',
          disabled: false,
          maxValue: 20,
        },
      ];
    },

    /** 样式 tab 切换 */
    colorSelect(e) {
      const tabItem = this.defaultForm.tabItem || {};
      this.defaultForm.tabItem = Object.assign(tabItem, e.item);
      this.updataResult(this.defaultForm.tabItem, 'tabItem');
    },

    /** 边距滑块变更，arr 依次是 上 / 下 / 左右 */
    sliderChange(arr, type, showUnit = true) {
      const val = (item) => (item ? (showUnit ? item.value + item.unit : item.value) : undefined);
      const lr = val(arr[2]);
      this.searchIpts = Object.assign(this.searchIpts, {
        marginTop: val(arr[0]),
        marginBottom: val(arr[1]),
        marginLeft: lr,
        marginRight: lr,
      });
      this.updataResult(this.searchIpts, 'searchIpts');
    },

    /** 圆角滑块变更，arr 依次是 上圆角 / 下圆角 */
    RadiusChange(arr) {
      const top = arr[0].value + arr[0].unit;
      const bottom = arr[1].value + arr[1].unit;
      this.searchIpts = Object.assign(this.searchIpts, {
        'border-top-left-radius': top,
        'border-top-right-radius': top,
        'border-bottom-right-radius': bottom,
        'border-bottom-left-radius': bottom,
      });
      this.updataResult(this.searchIpts, 'searchIpts');
    },

    /** 底部背景色变更 */
    updateColor(e) {
      this.result.computedStyle.searchBox = e[0].color;
      this.$emit('update', this.result);
    },

    /** 写回 computedStyle 下的某个字段并通知编辑器 */
    updataResult(style, name) {
      this.$set(this.result.computedStyle, name, deepClone(style));
      this.$emit('update', this.result);
    },

    /** 写回 data 下的某个字段并通知编辑器 */
    updataData(value, name) {
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.$set(this.result.data, name, deepClone(value));
      this.$emit('update', this.result);
    },

    iptSelect(e) {
      if (e && e.currentTarget && e.currentTarget.select) e.currentTarget.select();
    },
  },
};

export default basicMixins;
