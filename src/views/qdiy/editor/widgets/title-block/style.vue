<template>
  <div>
    <!--
      原来用 diy-style 按图片选风格，但 title-block/title-style*.png 这几张图平台端
      根本没有（PHP 侧的资源没一起迁过来），面板上只能看到三个空框，运营根本
      不知道自己选的是什么。这里改成用 CSS 画出与 App 端一致的示意，不依赖图片。
    -->
    <diy-style-contain title="风格">
      <div class="tb-style-list">
        <div
          v-for="(it, i) in imgInfo"
          :key="i"
          class="tb-style-item"
          :class="{ active: imgIndex === i }"
          @click="upImgIndex(i, it)"
        >
          <div class="tb-demo">
            <template v-if="it.type === 1">
              <span class="tb-demo-line" /><span class="tb-demo-text">标题</span><span class="tb-demo-line" />
            </template>
            <template v-else-if="it.type === 2">
              <span class="tb-demo-bar" /><span class="tb-demo-text">标题</span>
            </template>
            <template v-else>
              <span class="tb-demo-line" /><span class="tb-demo-diamond">◆</span>
              <span class="tb-demo-text">标题</span>
              <span class="tb-demo-diamond">◆</span><span class="tb-demo-line" />
            </template>
          </div>
          <div class="tb-style-name">{{ it.text }}</div>
        </div>
      </div>
    </diy-style-contain>

    <diy-style-contain title="标题文字">
      <div class="row">
        <div class="row-label">文字</div>
        <el-input v-model="value" placeholder="标题栏" :maxlength="20" show-word-limit @input="titleChange" />
      </div>
    </diy-style-contain>

    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <!-- 前端读 computedStyle.fontSize / fontWeight，之前面板里没有入口，等于永远用默认字号 -->
    <diy-size-setting
      top-name="字体大小"
      :size-infos="fontSizeInfos"
      :min-value="12"
      :max-value="24"
      @change="fontSizeChange"
    />
    <diy-style-contain title="字体粗细">
      <el-radio-group v-model="fontWeight" @change="fontWeightChange">
        <el-radio label="normal">常规</el-radio>
        <el-radio label="bold">加粗</el-radio>
      </el-radio-group>
    </diy-style-contain>
    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
  </div>
</template>

<script>
/** 标题栏 —— 属性面板。迁移自 PHP common/title-block/style.php */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'TitleBlockStyle',
  mixins: [basicMixins],
  data() {
    return {
      value: '',
      // img 指向 PHP 侧的风格示意图，平台端没有该资源，缺图不影响选择
      imgInfo: [
        { img: 'title-block/title-style1.png', text: '风格1', type: 1 },
        { img: 'title-block/title-style2.png', text: '风格2', type: 2 },
        { img: 'title-block/title-style3.png', text: '风格3', type: 3 },
      ],
      imgIndex: 0,
      fontSizeInfos: [{ name: '字体大小', value: 14, minValue: 12, maxValue: 24, unit: 'px' }],
      fontWeight: 'normal',
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.colorInfos = [
        {
          name: '背景颜色',
          color: getObjValue(this.result, ['computedStyle', 'bgColor'], 'transparent'),
          showAlpha: true,
        },
        {
          name: '标题颜色',
          color: getObjValue(this.result, ['computedStyle', 'titleColor'], '#000'),
          showAlpha: false,
        },
      ];
      // 标题栏只要上下边距，去掉左右边距那一项
      this.defaultForm.sizeInfos.pop();

      if (!this.result.data) this.$set(this.result, 'data', {});
      this.value = this.result.data.title;

      if (this.result.data.titleStyle) {
        this.imgIndex = this.imgInfo.findIndex((item) => item.type === this.result.data.titleStyle.type);
      }

      // 字号存的是带单位的字符串（前端直接塞进 :style），回读时要剥掉单位
      const fs = parseFloat(getObjValue(this.result, ['computedStyle', 'fontSize'], ''));
      if (Number.isFinite(fs)) this.fontSizeInfos[0].value = fs;
      this.fontWeight = getObjValue(this.result, ['computedStyle', 'fontWeight'], 'normal') || 'normal';
    },
    fontSizeChange(arr) {
      const it = arr && arr[0];
      if (!it) return;
      this.updataResult(`${it.value}${it.unit || 'px'}`, 'fontSize');
    },
    fontWeightChange(val) {
      this.updataResult(val, 'fontWeight');
    },
    titleChange() {
      this.updataData(this.value, 'title');
    },
    upImgIndex(index, item) {
      this.imgIndex = index;
      this.updataData(item, 'titleStyle');
    },
    updateColor(e) {
      this.result.computedStyle.bgColor = e[0].color;
      if (e[1]) this.result.computedStyle.titleColor = e[1].color;
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
}
.row-label {
  width: 80px;
  text-align: center;
  flex-shrink: 0;
  color: #999;
}

/* 风格选择：用 CSS 画出与 App 端一致的示意，不依赖图片资源 */
.tb-style-list {
  display: flex;
  gap: 8px;
}
.tb-style-item {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 4px;
  cursor: pointer;
  text-align: center;
  &.active {
    border-color: #409eff;
    background: #ecf5ff;
  }
}
.tb-demo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  gap: 3px;
}
.tb-demo-line {
  width: 12px;
  height: 1px;
  background: #666;
}
.tb-demo-bar {
  width: 3px;
  height: 12px;
  background: #666;
  border-radius: 2px;
}
.tb-demo-diamond {
  font-size: 6px;
  color: #666;
}
.tb-demo-text {
  font-size: 12px;
  color: #333;
}
.tb-style-name {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
</style>
