/**
 * 悬浮组件「组件位置 + 位置边距」的公共逻辑
 *
 * PHP 侧 bg-music / order-broadcast / order-multi-broadcast 三个 style.php
 * 各自抄了一份同样的实现：四个方位单选联动两根边距滑块，最终算成
 * computedStyle.broadcastStyle 的绝对定位。这里抽成 mixin 复用。
 *
 * 依赖 basicMixins（提供 this.result / updataData / updataResult）。
 */
const SIZE_POS = {
  1: ['上边距', '左边距'],
  2: ['上边距', '右边距'],
  3: ['下边距', '左边距'],
  4: ['下边距', '右边距'],
};

export default {
  data() {
    return {
      // 1 左上 2 右上 3 左下 4 右下
      locationValue: 1,
      sizeInfos: SIZE_POS[1],
      sizeInfosValue: [10, 10],
    };
  },
  methods: {
    /** 在组件自己的 init() 里调用，读取已存数据 */
    initFloatPosition(defaultLocation = 1) {
      const data = this.result.data || {};
      this.locationValue = data.locationValue || defaultLocation;
      this.sizeInfos = SIZE_POS[this.locationValue];
      if (data.sizeInfos && data.sizeInfos.length) {
        this.sizeInfosValue = data.sizeInfos.map((it) => it.value);
      }
    },
    locationChange(e) {
      this.locationValue = e;
      this.sizeInfos = SIZE_POS[e];
      this.updataData(e, 'locationValue');
      this.applyPosition();
    },
    positionSliderChange(arr) {
      this.sizeInfos = arr;
      this.updataData(arr, 'sizeInfos');
      this.applyPosition();
    },
    applyPosition() {
      const val = (item) => (item && item.value !== undefined ? item.value + (item.unit || 'px') : '10px');
      const first = val(this.sizeInfos[0]);
      const second = val(this.sizeInfos[1]);
      let style;
      switch (this.locationValue) {
        case 1:
          style = { top: first, left: second };
          break;
        case 2:
          style = { top: first, right: second };
          break;
        case 3:
          style = { bottom: first, left: second };
          break;
        default:
          style = { bottom: first, right: second };
      }
      this.updataResult(style, 'broadcastStyle');
    },
  },
};
