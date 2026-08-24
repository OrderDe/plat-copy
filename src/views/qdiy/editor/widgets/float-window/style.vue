<template>
  <div>
    <diy-img-setting
      ref="imgSetting"
      top-name="悬浮图片"
      suggest-size-text="建议图片宽高一致，如 200*200"
      :max-img-length="1"
      :def-img-count="1"
      :img-infos="imgInfos"
      :img-pop-size="[60, 60]"
      @change="imgChange"
      @pick-link="(i, item) => openLinkPicker('imgSetting', item)"
    />

    <diy-style-contain title="组件位置">
      <el-radio-group v-model="locationValue" @change="locationChange">
        <el-radio :label="1">左上角</el-radio>
        <el-radio :label="2">右上角</el-radio>
        <el-radio :label="3">左下角</el-radio>
        <el-radio :label="4">右下角</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-size-setting
      top-name="位置"
      :size-infos="sizeInfos"
      :size-infos-value="sizeInfosValue"
      :max-value="200"
      @change="positionSliderChange"
    />

    <diy-size-setting
      top-name="悬浮窗大小"
      :size-infos="wSizeInfos"
      :size-infos-value="wSizeValue"
      :min-value="30"
      :max-value="200"
      @change="wSizeChange"
    />

    <diy-style-contain title="交互设置">
      <div class="row">
        <div class="row-label">可关闭</div>
        <el-switch v-model="closable" :active-value="1" :inactive-value="0" @change="switchChange(closable, 'closable')" />
      </div>
      <div class="row">
        <div class="row-label">可拖拽</div>
        <el-switch v-model="draggable" :active-value="1" :inactive-value="0" @change="switchChange(draggable, 'draggable')" />
        <span class="row-tip">拖动后自动吸附到屏幕左右边缘</span>
      </div>
      <div class="row">
        <div class="row-label">延迟出现</div>
        <el-input-number v-model="delay" size="small" :min="0" :max="60" :step="1" @change="switchChange(delay, 'delay')" />
        <span class="row-tip">秒，0 表示进页面立即显示</span>
      </div>
      <div class="row">
        <div class="row-label">透明度</div>
        <el-slider v-model="opacity" class="row-slider" :min="20" :max="100" @change="switchChange(opacity, 'opacity')" />
      </div>
    </diy-style-contain>

    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 悬浮窗 —— 属性面板
 *
 * 与 bg-music / order-broadcast 同属悬浮类组件，位置沿用 floatPositionMixins：
 * 四个方位单选联动两根边距滑块，算成 computedStyle.broadcastStyle 的绝对定位。
 *
 * 图片与链接直接复用 diy-img-setting（限一张），省掉一套上传 + 选链接的重复实现。
 */
import basicMixins from '../../controls/basicMixins';
import floatPositionMixins from '../../controls/floatPositionMixins';
import linkPickerMixins from '../../controls/linkPickerMixins';

export default {
  name: 'FloatWindowStyle',
  mixins: [basicMixins, floatPositionMixins, linkPickerMixins],
  data() {
    return {
      imgInfos: [],
      // 宽高与位置滑块是两套数据，别复用 mixin 的 sizeInfos
      wSizeInfos: ['宽度', '高度'],
      wSizeValue: [60, 60],
      closable: 1,
      draggable: 1,
      delay: 0,
      opacity: 100,
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const d = this.result.data;
      this.imgInfos = d.imgInfos && d.imgInfos.length ? d.imgInfos : [];
      if (d.wSizeInfos && d.wSizeInfos.length) {
        this.wSizeValue = d.wSizeInfos.map((it) => it.value);
      }
      if (d.closable !== undefined) this.closable = d.closable;
      if (d.draggable !== undefined) this.draggable = d.draggable;
      if (d.delay !== undefined) this.delay = d.delay;
      if (d.opacity !== undefined) this.opacity = d.opacity;
      // 悬浮窗默认在右下角，避开顶部搜索栏
      this.initFloatPosition(4);
    },
    imgChange(arr) {
      this.imgInfos = arr;
      this.updataData(arr, 'imgInfos');
    },
    wSizeChange(arr) {
      this.wSizeInfos = arr;
      this.updataData(arr, 'wSizeInfos');
      this.updataResult(
        {
          width: (arr[0] ? arr[0].value : 60) + 'px',
          height: (arr[1] ? arr[1].value : 60) + 'px',
        },
        'floatSize'
      );
    },
    switchChange(value, name) {
      this.updataData(value, name);
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  padding-bottom: 15px;
}
.row-label {
  width: 60px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 8px;
  color: #999;
  margin-right: 15px;
}
.row-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #bbb;
}
.row-slider {
  flex: 1;
  margin-right: 10px;
}
</style>
