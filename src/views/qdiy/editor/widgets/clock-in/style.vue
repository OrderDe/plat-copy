<template>
  <div>
    <diy-style-contain title="海报标题">
      <div class="row">
        <div class="row-label">文字</div>
        <el-input v-model="title" :maxlength="16" show-word-limit size="small" @input="titleChange" />
      </div>
    </diy-style-contain>

    <diy-style-contain title="海报内容">
      <div class="row">
        <div class="row-label">文字</div>
        <el-input v-model="value" :maxlength="16" show-word-limit size="small" @input="valueChange" />
      </div>
    </diy-style-contain>

    <diy-style-contain title="赠送积分">
      <div class="row">
        <div class="row-label">积分</div>
        <el-input v-model="integral" :maxlength="5" size="small" @input="integralChange" />
      </div>
    </diy-style-contain>
  </div>
</template>

<script>
/** 打卡 —— 属性面板。迁移自 PHP common/clock-in/style.php */
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'ClockInStyle',
  mixins: [basicMixins],
  data() {
    return {
      title: '分享海报赢海量好礼',
      value: '分享海报赢海量好礼',
      integral: '2000',
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const d = this.result.data;
      if (d.btnTitle) this.title = d.btnTitle;
      if (d.btnValue) this.value = d.btnValue;
      if (d.integral) this.integral = d.integral;
    },
    titleChange() {
      this.updataData(this.title, 'btnTitle');
    },
    valueChange() {
      this.updataData(this.value, 'btnValue');
    },
    integralChange() {
      this.updataData(this.integral, 'integral');
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
  width: 60px;
  flex-shrink: 0;
  text-align: center;
  color: #999;
}
</style>
