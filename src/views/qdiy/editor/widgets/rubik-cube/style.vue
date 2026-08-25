<template>
  <div>
    <!--
      原来用 diy-style 按图片选布局，但 cube1.png ~ cube10.png 这些预设示意图
      平台端根本没有（PHP 侧资源没一起迁过来），面板上只有一排空框，
      运营看不出每个风格长什么样。改成按预设数据把网格实际画出来，所见即所选。
    -->
    <diy-style-contain title="布局风格">
      <div class="cube-preset-list">
        <div
          v-for="(preset, i) in imgInfo"
          :key="i"
          class="cube-preset"
          :class="{ active: imgIndex === i }"
          @click="upImgIndex(i, preset)"
        >
          <div class="cube-preset-grid" :style="presetGridStyle(preset)">
            <span
              v-for="(area, ai) in (preset.data.info || [])"
              :key="ai"
              class="cube-preset-cell"
              :style="presetCellStyle(area)"
            />
          </div>
          <div class="cube-preset-name">{{ preset.text }}</div>
        </div>
      </div>
    </diy-style-contain>

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
import { getObjValue } from '../../controls/utils';
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

      /*
       * 颜色项原来完全没初始化，diy-color 拿到的是 mixin 的空默认值，
       * 面板上看不到可配的颜色；配套的 updateColor 方法也不存在（模板里绑了个
       * 未定义的方法），就算选了色也只会报错、存不下来。
       * showAlpha 打开是为了能配透明背景（魔方常直接压在页面底色上）。
       */
      this.$set(this.defaultForm, 'colorInfos', [
        {
          name: '组件背景',
          color: getObjValue(this.result, ['computedStyle', 'searchBox'], 'transparent'),
          showAlpha: true,
        },
      ]);
    },
    updateColor(infos) {
      this.$set(this.result.computedStyle, 'searchBox', infos[0] && infos[0].color);
      this.updateInfos();
    },
    /** 预设缩略图：按该预设的密度铺网格 */
    presetGridStyle(preset) {
      const d = (preset && preset.data && preset.data.density) || 4;
      return {
        gridTemplateColumns: `repeat(${d}, 1fr)`,
        gridTemplateRows: `repeat(${d}, 1fr)`,
      };
    },
    /** 预设里的每块区域按 start/end 占格，画出来就是这个风格的真实形状 */
    presetCellStyle(area) {
      if (!area || !area.start || !area.end) return {};
      return {
        gridColumn: `${area.start.x} / ${Number(area.end.x) + 1}`,
        gridRow: `${area.start.y} / ${Number(area.end.y) + 1}`,
      };
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
      /*
       * 这里的三目原来写反了：只要 data.spaceInfo 已存在，就把用户刚拖出来的 val 丢掉、
       * 改用上次存的旧值写回去 —— 表现就是边距滑块只有第一次生效，之后怎么拖都弹回原位。
       * val 才是本次变更，spaceInfo 只在 val 缺席时兜底。
       */
      this.defaultForm.sizeInfos = val || this.result.data.spaceInfo;
      const s = this.defaultForm.sizeInfos;
      if (!Array.isArray(s) || s.length < 4) return;
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
      /*
       * 切换布局风格时必须把 styleBoo 放掉。它的含义是「装修切回来了，请复用已有图片」，
       * 只在 init 时该为真；留着的话 diy-rubik-cube 的 styleArr watch 会拿上一套风格的
       * 图片数据去匹配新风格的格子（见该组件 watch.styleArr 里的 styleBoo 分支），
       * 于是换了风格网格却还是旧的样子。
       */
      this.styleBoo = false;
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

<style scoped lang="scss">
/* 布局风格缩略图：按预设数据画出真实网格形状，不依赖图片资源 */
.cube-preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cube-preset {
  width: calc(33.33% - 6px);
  padding: 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  box-sizing: border-box;
  &.active {
    border-color: #409eff;
    background: #ecf5ff;
  }
}
.cube-preset-grid {
  display: grid;
  gap: 2px;
  width: 100%;
  aspect-ratio: 1 / 1;
  /* 老浏览器不支持 aspect-ratio 时至少给个高度兜底 */
  min-height: 56px;
}
.cube-preset-cell {
  background: #c8d9e8;
  border-radius: 2px;
}
.cube-preset-name {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}
</style>
