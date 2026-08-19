<template>
  <div>
    <diy-style-contain title="标题">
      <el-radio-group v-model="titleRadio" @change="titleChange">
        <el-radio :label="0">隐藏</el-radio>
        <el-radio :label="1">显示</el-radio>
      </el-radio-group>
      <div v-if="titleRadio == 1" class="title-list">
        <diy-operation-list v-model="titleList" @on-change="onTitleListChange" />
      </div>
    </diy-style-contain>

    <diy-style-contain title="选择赠送商品">
      <ActivityPicker
        :value="pickImgList"
        :max-length="maxGroupLen"
        tip="按赠品活动 ID 添加，真实商品信息由 App 端按 ID 获取"
        @change="onGoodsChange"
      />
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
/** 赠送商品 —— 属性面板。迁移自 PHP common/gift-goods/style.php */
import ActivityPicker from '../../components/ActivityPicker';
import basicMixins from '../../controls/basicMixins';
import marketingMixins from '../../controls/marketingMixins';

export default {
  name: 'GiftGoodsStyle',
  components: { ActivityPicker },
  mixins: [basicMixins, marketingMixins],
  data() {
    return {
      colorInfos: ['底部背景', '商品背景'],
      colorKeys: ['boxBg', 'goodsBg'],
      defColor: ['#FAFAFA', '#FFFFFF'],
      sizeInfosValue: [0, 0, 0, 0],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.initMarketing('赠送商品');
    },
  },
};
</script>

<style scoped lang="scss">
.title-list {
  padding-top: 10px;
}
</style>
