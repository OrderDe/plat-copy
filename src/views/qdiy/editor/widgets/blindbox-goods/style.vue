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

    <diy-style-contain :title="pickTitle">
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
 * 盲盒商品 —— 属性面板。迁移自 PHP common/blindbox-goods/style.php
 *
 * blindboxs-goods（多人盲盒）与本组件的配置完全一致，只是选品来源不同，
 * 那个组件直接复用本文件（见 widgets/blindboxs-goods/style.vue）。
 */
import ActivityPicker from '../../components/ActivityPicker';
import basicMixins from '../../controls/basicMixins';
import marketingMixins from '../../controls/marketingMixins';

export default {
  name: 'BlindboxGoodsStyle',
  components: { ActivityPicker },
  mixins: [basicMixins, marketingMixins],
  props: {
    pickTitle: {
      type: String,
      default: '选择盲盒商品',
    },
    defaultTitle: {
      type: String,
      default: '新品推荐',
    },
  },
  data() {
    return {
      btnData: { style: 0, name: '立即拼团' },
      colorInfos: ['底部背景', '商品背景'],
      colorKeys: ['boxBg', 'goodsBg'],
      defColor: ['#FAFAFA', '#FFFFFF'],
      sizeInfosValue: [10, 10, 10, 10],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.initMarketing(this.defaultTitle);
      // 标题除上下内边距外还有左右内边距
      this.titleList.push(
        { type: 'size', label: '左内边距', value: 10, setKey: 'paddingLeft', maxValue: 20 },
        { type: 'size', label: '右内边距', value: 10, setKey: 'paddingRight', maxValue: 20 },
      );
      this.initDataList('titleList');

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
