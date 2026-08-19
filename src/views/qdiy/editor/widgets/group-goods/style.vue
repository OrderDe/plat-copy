<template>
  <div class="group-goods-style">
    <diy-style :img-info="imgInfo" :def-index="imgIndex" :img-style="{ width: '206px', height: 'auto' }" @change="onStyleChange" />

    <diy-style-contain title="标题">
      <el-radio-group v-model="titleRadio" @change="titleChange">
        <el-radio :label="0">隐藏</el-radio>
        <el-radio :label="1">显示</el-radio>
      </el-radio-group>
      <div v-if="titleRadio == 1" class="title-list">
        <diy-operation-list v-model="titleList" @on-change="onTitleListChange" />
      </div>
    </diy-style-contain>

    <diy-style-contain title="选择拼团活动">
      <ActivityPicker :value="pickImgList" :max-length="maxGroupLen" @change="onGoodsChange" />
    </diy-style-contain>

    <diy-tabs title="组件样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />
    <diy-color :color-infos="colorInfos" :str-color="defColor" @change="updateColor" />
    <diy-size-setting
      top-name="组件边距"
      :size-infos="sizeInfos"
      :size-infos-value="sizeInfosValue"
      :size-infos-max="sizeInfosMax"
      @change="updateSize"
    />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/**
 * 拼团商品 —— 属性面板。迁移自 PHP common/group-goods/style.php
 *
 * 风格2 只有背景色一项配色、风格3 没有商品间距，与 PHP 侧 upImgIndex 的分支一致。
 * 活动选择改用 ActivityPicker（按 ID 录入），原因见该组件注释。
 */
import ActivityPicker from '../../components/ActivityPicker';
import basicMixins from '../../controls/basicMixins';
import marketingMixins from '../../controls/marketingMixins';

const FULL_COLORS = ['背景色', '按钮文字', '按钮背景'];
const FULL_COLOR_KEYS = ['bgColor', 'btnTextColor', 'btnBackground'];

export default {
  name: 'GroupGoodsStyle',
  components: { ActivityPicker },
  mixins: [basicMixins, marketingMixins],
  data() {
    return {
      imgInfo: [
        { img: 'group-goods/group-style1.png', text: '风格1', type: 1 },
        { img: 'group-goods/group-style2.png', text: '风格2', type: 2 },
        { img: 'group-goods/group-style3.png', text: '风格3', type: 3 },
      ],
      defColor: ['transparent', '#fff', '#db0505'],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.initMarketing('商品拼团');
      this.applyStyleOptions(this.imgIndex);
    },
    onStyleChange(index, item) {
      this.applyStyleOptions(index);
      this.upImgIndex(index, item);
      this.updateColor(this.colorInfos);
      this.updateSize(this.sizeInfos);
    },
    /** 风格2 只有背景色；风格3 无商品间距 */
    applyStyleOptions(index) {
      if (index === 1) {
        this.colorInfos = FULL_COLORS.slice(0, 1);
        this.colorKeys = FULL_COLOR_KEYS.slice(0, 1);
      } else {
        this.colorInfos = [...FULL_COLORS];
        this.colorKeys = [...FULL_COLOR_KEYS];
      }
      if (index === 2) {
        this.sizeInfos = ['上边距', '下边距'];
        this.sizeInfosValue = [0, 0];
        this.sizeInfosMax = [50, 50];
        this.sizeKeys = ['marginTop', 'marginBottom'];
        this.result.computedStyle.spacing = 0;
      } else {
        this.sizeInfos = ['商品间距', '上边距', '下边距', '左右边距'];
        this.sizeInfosValue = [5, 0, 0, 0];
        this.sizeInfosMax = [50, 50, 50, 20];
        this.sizeKeys = ['spacing', 'marginTop', 'marginBottom', 'aroundMargin'];
      }
    },
  },
};
</script>

<style scoped lang="scss">
.title-list {
  padding-top: 10px;
}
</style>
