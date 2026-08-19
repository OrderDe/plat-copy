<template>
  <div>
    <diy-style-contain title="标题文字">
      <div class="bc-row">
        <div class="leabl">标题</div>
        <el-input v-model="broadcastTitle" :maxlength="10" show-word-limit size="small" @change="titleChange" />
      </div>
    </diy-style-contain>

    <diy-style-contain title="样式设置">
      <div class="bc-row">
        <div class="leabl">底色</div>
        <div class="bc-ctrl">
          <el-color-picker v-model="bgColor" class="color-box" @change="styleChange($event, 'bgColor')" />
          <el-input v-model="bgColor" maxlength="8" size="mini" @change="styleChange($event, 'bgColor')" />
        </div>
      </div>

      <div class="bc-row">
        <div class="leabl">背景色</div>
        <div class="bc-ctrl">
          <el-color-picker v-model="brodcastBgColor" class="color-box" @change="styleChange($event, 'brodcastBgColor')" />
          <el-input v-model="brodcastBgColor" maxlength="8" size="mini" @change="styleChange($event, 'brodcastBgColor')" />
        </div>
      </div>

      <div class="bc-row">
        <div class="leabl">文字</div>
        <div class="bc-ctrl">
          <el-color-picker v-model="wordColor" class="color-box" @change="styleChange($event, 'wordColor')" />
          <el-input v-model="wordColor" maxlength="8" size="mini" @change="styleChange($event, 'wordColor')" />
        </div>
      </div>

      <div class="bc-row">
        <div class="leabl">内容</div>
        <el-checkbox-group v-model="content" @change="dataChange($event, 'content')">
          <el-checkbox label="avatar">头像</el-checkbox>
          <el-checkbox label="time">时间</el-checkbox>
        </el-checkbox-group>
      </div>
    </diy-style-contain>

    <diy-style-contain title="数据设置">
      <div class="bc-row">
        <div class="leabl">数据类型</div>
        <div>
          <el-radio-group v-model="dataType" @change="dataChange($event, 'dataType')">
            <el-radio :label="1">真实数据</el-radio>
            <el-radio :label="2">虚拟数据</el-radio>
          </el-radio-group>
          <div v-if="dataTypeTips[dataType]" class="tips-text">{{ dataTypeTips[dataType] }}</div>
        </div>
      </div>

      <div class="bc-row">
        <div class="leabl">数据量</div>
        <div class="bc-ctrl">
          <el-slider v-model="dataNumber" style="width: 165px" :min="5" :max="20" @change="dataChange($event, 'dataNumber')" />
          <div class="row-input">
            <el-input :value="dataNumber" style="width: 86px" size="mini" readonly>
              <template slot="append">条</template>
            </el-input>
          </div>
        </div>
      </div>
    </diy-style-contain>

    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="20" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/**
 * 多行订单播报 —— 属性面板。迁移自 PHP common/order-multi-broadcast/style.php
 *
 * 首次进入（computedStyle.searchIpts 未设置）时套用一组自定义默认边距/圆角，
 * 与 PHP 侧 customDefaultForm 一致。
 */
import basicMixins from '../../controls/basicMixins';

const CUSTOM_DEFAULT_FORM = {
  sizeInfos: [
    { name: '上边距', value: 16, unit: 'px', disabled: false, hidden: false, maxValue: 20 },
    { name: '下边距', value: 16, unit: 'px', disabled: false, hidden: false, maxValue: 20 },
    { name: '左右边距', value: 16, unit: 'px', disabled: false, hidden: false, maxValue: 20 },
  ],
  radiusInfos: [
    { name: '上圆角', value: 10, unit: 'px', disabled: false, maxValue: 20 },
    { name: '下圆角', value: 10, unit: 'px', disabled: false, maxValue: 20 },
  ],
};

export default {
  name: 'OrderMultiBroadcastStyle',
  mixins: [basicMixins],
  data() {
    return {
      bgColor: '#F6F6F6',
      brodcastBgColor: '#FFF',
      wordColor: '#333',
      dataType: 1,
      dataNumber: 5,
      content: ['avatar', 'time'],
      broadcastTitle: '装修展示',
      dataTypeTips: {
        1: '显示3天之内的真实数据',
      },
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const data = this.result.data;
      const cs = this.result.computedStyle;
      this.broadcastTitle = data.broadcastTitle || this.broadcastTitle;
      this.dataType = data.dataType || this.dataType;
      this.dataNumber = data.dataNumber || this.dataNumber;
      this.content = data.content || this.content;
      this.brodcastBgColor = cs.brodcastBgColor || this.brodcastBgColor;
      this.bgColor = cs.bgColor || this.bgColor;
      this.wordColor = cs.wordColor || this.wordColor;
      if (cs.searchIpts === undefined) {
        this.defaultForm = Object.assign({}, this.defaultForm, JSON.parse(JSON.stringify(CUSTOM_DEFAULT_FORM)));
      }
    },
    titleChange() {
      this.updataData(this.broadcastTitle, 'broadcastTitle');
    },
    dataChange(e, name) {
      this.updataData(e, name);
    },
    styleChange(e, name) {
      this.updataResult(e, name);
    },
  },
};
</script>

<style scoped lang="scss">
.bc-row {
  display: flex;
  align-items: center;
  padding-bottom: 15px;

  .leabl {
    width: 60px;
    flex-shrink: 0;
    text-align: right;
    padding-right: 8px;
    color: #999;
    margin-right: 15px;
  }
}
.bc-ctrl {
  display: flex;
  align-items: center;
}
.color-box {
  margin-right: 10px;
}
.row-input {
  margin-left: 20px;
}
.tips-text {
  padding-top: 10px;
  color: #999;
  font-size: 12px;
}
</style>
