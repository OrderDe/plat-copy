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
          <!--
            与单行播报保持一致：虚拟数据原来没有任何配置入口，前端只能用写死的样例文案，
            运营既改不了话术也换不了商品名。两个播报组件在 App 端共用
            qdiyOrderBroadcast，读的都是 data.virtualTexts。
          -->
          <div v-if="dataType === 2" class="bc-virtual">
            <div class="leabl">播报文案</div>
            <el-input
              v-model="virtualTexts"
              type="textarea"
              :rows="5"
              maxlength="500"
              show-word-limit
              placeholder="一行一条，前端按「数据量」随机取。留空则用系统内置样例。"
              @input="onVirtualTextsInput"
            />
            <div class="tips-text">
              一行一条，可用占位符：{time} 随机时间（如「3分钟前」）。
              例：138****6621 刚刚下单了一件商品 {time}
            </div>
          </div>
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
      // 默认给「虚拟数据」：真实数据依赖后端成交播报接口，目前未接入，
      // 默认选 1 的话组件拖出来在 App 上就是一片空白，运营会以为组件坏了
      dataType: 2,
      dataNumber: 5,
      content: ['avatar', 'time'],
      broadcastTitle: '装修展示',
      virtualTexts: '',
      dataTypeTips: {
        1: '显示3天之内的真实数据（需后端成交播报接口，当前未接入）',
        2: '按下方文案随机播报，不涉及真实订单',
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
      this.virtualTexts = Array.isArray(data.virtualTexts)
        ? data.virtualTexts.join('\n')
        : (data.virtualTexts || '');
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
    /** 文案按行存成数组，前端直接取用，不必再解析换行 */
    onVirtualTextsInput(val) {
      const list = String(val || '')
        .split('\n')
        .map((e) => e.trim())
        .filter((e) => e);
      this.updataData(list, 'virtualTexts');
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
