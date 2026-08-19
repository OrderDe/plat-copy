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

    <diy-style-contain title="按钮样式">
      <el-radio-group v-model="btnData.style" @change="btnChange($event, 'style')">
        <el-radio :label="0">样式1</el-radio>
        <el-radio :label="1">样式2</el-radio>
      </el-radio-group>
      <div class="btn-text-row">
        <div class="btn-text-name">按钮文字</div>
        <el-input
          v-model="btnData.name"
          size="small"
          placeholder="请输入内容"
          maxlength="4"
          show-word-limit
          @input="btnChange($event, 'name')"
        />
      </div>
    </diy-style-contain>

    <diy-style-contain title="选择幸运拼团活动">
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
/** 幸运拼团 —— 属性面板。迁移自 PHP common/lucky-group/style.php */
import ActivityPicker from '../../components/ActivityPicker';
import basicMixins from '../../controls/basicMixins';
import marketingMixins from '../../controls/marketingMixins';

export default {
  name: 'LuckyGroupStyle',
  components: { ActivityPicker },
  mixins: [basicMixins, marketingMixins],
  data() {
    return {
      btnData: { style: 0, name: '立即拼团' },
      colorInfos: ['底部背景', '商品背景'],
      colorKeys: ['boxBg', 'goodsBg'],
      defColor: ['#FAFAFA', '#FFFFFF'],
      sizeInfosValue: [0, 0, 0, 0],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.initMarketing('新品推荐');
      if (this.result.data.btnData) {
        this.btnData = this.result.data.btnData;
      } else {
        this.$set(this.result.data, 'btnData', this.btnData);
      }
    },
    btnChange(e, name) {
      this.$set(this.result.data.btnData, name, e);
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.title-list {
  padding-top: 10px;
}
.btn-text-row {
  display: flex;
  align-items: center;
  margin-top: 15px;

  .btn-text-name {
    width: 60px;
    flex-shrink: 0;
    text-align: right;
    padding-right: 8px;
    margin-right: 15px;
    color: #333;
  }
}
</style>
