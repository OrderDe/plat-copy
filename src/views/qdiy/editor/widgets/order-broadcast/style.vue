<template>
  <div>
    <diy-style-contain title="组件位置">
      <el-radio-group v-model="locationValue" @change="locationChange">
        <el-radio :label="1">左上角</el-radio>
        <el-radio :label="2">右上角</el-radio>
        <el-radio :label="3">左下角</el-radio>
        <el-radio :label="4">右下角</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="样式设置">
      <div class="bc-row">
        <div class="leabl">背景色</div>
        <div class="bc-ctrl">
          <el-color-picker v-model="brodcastBgColor" class="color-box" @change="styleChange($event, 'brodcastBgColor')" />
          <el-input v-model="brodcastBgColor" maxlength="8" size="mini" @change="styleChange($event, 'brodcastBgColor')" />
        </div>
      </div>

      <div class="bc-row">
        <div class="leabl">透明度</div>
        <div class="bc-ctrl">
          <el-slider v-model="bgOpacity" style="width: 165px" :min="0" :max="100" @input="styleChange($event, 'bgOpacity')" />
          <div class="row-input">
            <el-input :value="bgOpacity" style="width: 86px" size="mini" readonly>
              <template slot="append">%</template>
            </el-input>
          </div>
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
        <div class="leabl">时间</div>
        <div class="bc-ctrl">
          <el-color-picker v-model="timeColor" class="color-box" @change="styleChange($event, 'timeColor')" />
          <el-input v-model="timeColor" maxlength="8" size="mini" @change="styleChange($event, 'timeColor')" />
        </div>
      </div>

      <div class="bc-row">
        <div class="leabl">圆角</div>
        <div class="bc-ctrl">
          <el-slider v-model="borderRadius" style="width: 165px" :min="0" :max="20" @input="styleChange($event, 'borderRadius')" />
          <div class="row-input">
            <el-input :value="borderRadius" style="width: 86px" size="mini" readonly>
              <template slot="append">px</template>
            </el-input>
          </div>
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

    <diy-size-setting
      top-name="位置"
      :size-infos="sizeInfos"
      :size-infos-value="sizeInfosValue"
      :max-value="100"
      @change="positionSliderChange"
    />
  </div>
</template>

<script>
/** 订单播报 —— 属性面板。迁移自 PHP common/order-broadcast/style.php */
import basicMixins from '../../controls/basicMixins';
import floatPositionMixins from '../../controls/floatPositionMixins';

export default {
  name: 'OrderBroadcastStyle',
  mixins: [basicMixins, floatPositionMixins],
  data() {
    return {
      brodcastBgColor: '#000000',
      bgOpacity: 50,
      wordColor: '#FFFFFF',
      timeColor: '#FFFFFF',
      borderRadius: 20,
      dataType: 1,
      dataNumber: 5,
      content: ['avatar', 'time'],
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
      this.dataType = data.dataType || this.dataType;
      this.dataNumber = data.dataNumber || this.dataNumber;
      this.content = data.content || this.content;
      this.brodcastBgColor = cs.brodcastBgColor || this.brodcastBgColor;
      this.bgOpacity = cs.bgOpacity === undefined ? this.bgOpacity : cs.bgOpacity;
      this.wordColor = cs.wordColor || this.wordColor;
      this.timeColor = cs.timeColor || this.timeColor;
      this.borderRadius = cs.borderRadius === undefined ? this.borderRadius : cs.borderRadius;
      this.initFloatPosition(1);
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
