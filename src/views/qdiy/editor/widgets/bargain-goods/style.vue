<template>
  <div class="bargain-goods-style">
    <diy-style-contain title="标题">
      <el-radio-group v-model="titleRadio" @change="titleChange">
        <el-radio :label="0">隐藏</el-radio>
        <el-radio :label="1">显示</el-radio>
      </el-radio-group>
      <div v-if="titleRadio == 1" class="title-list">
        <diy-operation-list v-model="titleList" @on-change="onTitleListChange" />
      </div>
    </diy-style-contain>

    <diy-style-contain title="选择砍价活动">
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
 * 砍价商品 —— 属性面板。迁移自 PHP common/bargain-goods/style.php
 * （PHP 侧的风格选择整段被注释掉了，这里同样不提供）
 */
import ActivityPicker from '../../components/ActivityPicker';
import basicMixins from '../../controls/basicMixins';
import marketingMixins from '../../controls/marketingMixins';

export default {
  name: 'BargainGoodsStyle',
  components: { ActivityPicker },
  mixins: [basicMixins, marketingMixins],
  data() {
    return {
      colorInfos: ['背景色', '按钮文字', '按钮背景', '价格颜色'],
      colorKeys: ['bgColor', 'btnTextColor', 'btnBackground', 'priceColor'],
      defColor: ['transparent', '#fff', '#db0505', '#db0505'],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.initMarketing('砍价商品');
    },
  },
};
</script>

<style scoped lang="scss">
.title-list {
  padding-top: 10px;
}
</style>
