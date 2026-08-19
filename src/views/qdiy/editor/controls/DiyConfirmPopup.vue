<template>
  <div v-show="show" class="diy-confirm-popup" :style="popStyle">
    <div class="popup-title">{{ title }}</div>
    <div class="popup-btns">
      <el-button v-if="showConfirmBtn" type="primary" size="mini" @click.stop="confirm">{{ confirmText }}</el-button>
      <el-button v-if="showCancelBtn" size="mini" plain @click.stop="cancel">{{ cancelText }}</el-button>
    </div>
  </div>
</template>

<script>
/**
 * 内联确认气泡 —— 用于列表项的删除二次确认
 * 迁移自 PHP diy-confirm-popup.php
 *
 * 注：原 prop 名 `showConfrimBtn` 是拼写错误，这里更正为 `showConfirmBtn`。
 */
export default {
  name: 'DiyConfirmPopup',
  props: {
    title: {
      type: String,
      default: '确定删除吗',
    },
    show: {
      type: Boolean,
      default: false,
    },
    popStyle: {
      type: Object,
      default: () => ({}),
    },
    showConfirmBtn: {
      type: Boolean,
      default: true,
    },
    showCancelBtn: {
      type: Boolean,
      default: true,
    },
    confirmText: {
      type: String,
      default: '确定',
    },
    cancelText: {
      type: String,
      default: '取消',
    },
  },
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    cancel() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped lang="scss">
.diy-confirm-popup {
  position: absolute;
  top: 20px;
  right: 15px;
  width: 120px;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  z-index: 15;
  background: #fff;
  cursor: pointer;
}
.popup-title {
  color: #999;
  line-height: 28px;
}
.popup-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  ::v-deep .el-button--mini {
    padding: 4px 10px;
  }
}
</style>
