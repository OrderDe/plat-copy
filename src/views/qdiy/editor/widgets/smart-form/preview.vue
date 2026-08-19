<template>
  <div class="form-diy-box" :style="boxStyle">
    <div class="form-diy-body" :style="bodyStyle">
      <div v-if="columns.length" class="form-fields">
        <div v-for="(item, index) in columns" :key="index" class="form-field">
          <div class="field-title">
            <span v-if="item.required" class="required">*</span>{{ item.title || '表单项' }}
          </div>
          <div class="field-input">{{ item.placeholder || '请输入' }}</div>
        </div>
      </div>
      <div v-else class="form-empty">尚未关联表单模板</div>
    </div>
    <div class="form-save-btn" :style="{ background: btnBg }">{{ btnTitle }}</div>
  </div>
</template>

<script>
/**
 * 自定义表单 —— 画布预览。迁移自 PHP common/smart-form/preview.php
 *
 * PHP 侧的表单项渲染来自 SmartForm 插件的 form-diy-model 组件（按模板 columns 渲染各类控件），
 * Java 侧无该插件，这里按 funcListItem.columns 里已有的标题/占位符做简化渲染。
 */
export default {
  name: 'SmartFormPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    columns() {
      const funcListItem = this.activeItem.funcListItem || {};
      return funcListItem.columns || [];
    },
    btnBg() {
      return this.computedStyle.btnBg || '#F10009';
    },
    btnTitle() {
      return (this.activeItem.data && this.activeItem.data.btnTitle) || '提交';
    },
    boxStyle() {
      const cs = this.computedStyle;
      return {
        background: cs.bodyBg || '#fff',
        paddingTop: cs.padTop ? `${cs.padTop}px` : 0,
        paddingBottom: cs.padBot ? `${cs.padBot}px` : 0,
        paddingLeft: cs.padLr ? `${cs.padLr}px` : 0,
        paddingRight: cs.padLr ? `${cs.padLr}px` : 0,
      };
    },
    bodyStyle() {
      const cs = this.computedStyle;
      const top = cs.radiusTop ? `${cs.radiusTop}px` : 0;
      const bot = cs.radiusBot ? `${cs.radiusBot}px` : 0;
      return {
        borderTopLeftRadius: top,
        borderTopRightRadius: top,
        borderBottomLeftRadius: bot,
        borderBottomRightRadius: bot,
      };
    },
  },
};
</script>

<style scoped lang="scss">
.form-diy-box {
  box-sizing: border-box;
  overflow: hidden;
}
.form-diy-body {
  background: #fff;
  overflow: hidden;
}
.form-field {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}
.field-title {
  font-size: 13px;
  color: #333;
}
.required {
  color: #f10009;
  padding-right: 2px;
}
.field-input {
  font-size: 12px;
  color: #c0c4cc;
  padding-top: 6px;
}
.form-empty {
  padding: 30px 0;
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
}
.form-save-btn {
  margin: 12px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  color: #fff;
  border-radius: 18px;
  font-size: 14px;
}
</style>
