<template>
  <div class="property-panel">
    <div class="panel-title">{{ item ? component.title || item.identify : '属性配置' }}</div>

    <div v-if="!item" class="panel-empty">请在画布中选择一个组件</div>

    <el-tabs v-else v-model="activeTab" class="panel-tabs">
      <el-tab-pane label="内容" name="content">
        <div class="pane-body">
          <!-- item / component 是 P4 的契约；active-item + @update 是 PHP 侧原生契约，
               两种都传，P6 组件可以照搬原实现不必改写 -->
          <component
            :is="styleOf(item.identify)"
            :key="item.identify + '-' + activeKey"
            :item="item"
            :active-item="item"
            :component="component"
            @update="onUpdate"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="样式" name="style">
        <div class="pane-body">
          <div class="style-controls">
            <div class="color-control">
              <span class="control-label">背景颜色</span>
              <el-color-picker v-model="item.computedStyle.bgColor" size="small" show-alpha />
              <span class="color-value">{{ item.computedStyle.bgColor || '透明' }}</span>
            </div>

            <div v-for="control in styleControls" :key="control.key" class="number-control">
              <span class="control-label">{{ control.label }}</span>
              <el-slider
                :value="styleControlValue(control.key)"
                :min="0"
                :max="control.max"
                :show-tooltip="false"
                @input="setStyleControlValue(control.key, $event)"
              />
              <el-input-number
                :value="styleControlValue(control.key)"
                class="compact-number"
                size="mini"
                :min="0"
                :max="control.max"
                :controls="false"
                @input="setStyleControlValue(control.key, $event)"
              />
              <span class="control-unit">px</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { styleOf } from '../registry';

export default {
  name: 'PropertyPanel',
  props: {
    // 当前选中的画布项，未选中时为 null
    item: {
      type: Object,
      default: null,
    },
    component: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      activeTab: 'content',
      // 切换选中项时强制重建 style 组件，让其 created 里的 init 重新跑
      activeKey: 0,
    };
  },
  computed: {
    styleControls() {
      return [
        { key: 'marginTop', label: '上边距', max: 100 },
        { key: 'marginBottom', label: '下边距', max: 100 },
        { key: 'leftRightMargin', label: '左右边距', max: 50 },
        { key: 'paddingTop', label: '上内边距', max: 100 },
        { key: 'paddingBottom', label: '下内边距', max: 100 },
        { key: 'borderRadius', label: '圆角', max: 50 },
      ];
    },
    marginTop: {
      get() {
        return this.styleNumber('marginTop');
      },
      set(val) {
        this.setStyleNumber('marginTop', val);
      },
    },
    marginBottom: {
      get() {
        return this.styleNumber('marginBottom');
      },
      set(val) {
        this.setStyleNumber('marginBottom', val);
      },
    },
    // 左右边距在 UI 上合并成一个滑块，写回时同时更新两侧
    leftRightMargin: {
      get() {
        return this.styleNumber('marginLeft');
      },
      set(val) {
        if (!this.item) return;
        this.setStyleNumber('marginLeft', val);
        this.setStyleNumber('marginRight', val);
      },
    },
    paddingTop: {
      get() {
        return this.styleNumber('paddingTop');
      },
      set(val) {
        this.setStyleNumber('paddingTop', val);
      },
    },
    paddingBottom: {
      get() {
        return this.styleNumber('paddingBottom');
      },
      set(val) {
        this.setStyleNumber('paddingBottom', val);
      },
    },
    borderRadius: {
      get() {
        return this.styleNumber('borderRadius');
      },
      set(val) {
        this.setStyleNumber('borderRadius', val);
      },
    },
  },
  watch: {
    item() {
      this.activeTab = 'content';
      this.activeKey += 1;
    },
  },
  methods: {
    styleOf,
    styleControlValue(key) {
      return this[key];
    },
    setStyleControlValue(key, value) {
      this[key] = value;
    },
    styleNumber(key) {
      if (!this.item || !this.item.computedStyle) return 0;
      const value = parseFloat(this.item.computedStyle[key]);
      return Number.isFinite(value) ? value : 0;
    },
    setStyleNumber(key, value) {
      if (!this.item) return;
      if (!this.item.computedStyle) this.$set(this.item, 'computedStyle', {});
      const number = Number(value);
      this.$set(this.item.computedStyle, key, Number.isFinite(number) ? number : 0);
    },
    /**
     * PHP 侧的 style 组件是把整个 result 深拷贝后回抛的，
     * 这里按字段合并回画布项，保持 item 引用不变，编辑器的撤销栈才能正常记录。
     */
    onUpdate(result) {
      if (!result || !this.item) return;
      ['data', 'computedStyle', 'params'].forEach((key) => {
        if (result[key] !== undefined) this.$set(this.item, key, result[key]);
      });
    },
  },
};
</script>

<style scoped lang="scss">
.property-panel {
  width: 340px;
  border-left: 1px solid #ebeef5;
  height: 100%;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.panel-title {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #ebeef5;
}
.panel-empty {
  padding: 60px 20px;
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
}
.panel-tabs {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  ::v-deep .el-tabs__header {
    margin-bottom: 0;
    padding: 0 16px;
  }
  ::v-deep .el-tabs__content {
    flex: 1;
    overflow-y: auto;
  }
}
.pane-body {
  padding: 16px;
}
.style-controls {
  width: 100%;
}
.color-control,
.number-control {
  min-height: 48px;
  border-bottom: 1px solid #f0f2f5;
  align-items: center;
}
.color-control {
  display: grid;
  grid-template-columns: 64px 32px minmax(0, 1fr);
  column-gap: 10px;
}
.number-control {
  display: grid;
  grid-template-columns: 64px minmax(80px, 1fr) 64px 16px;
  column-gap: 8px;
}
.control-label {
  color: #606266;
  font-size: 13px;
  line-height: 20px;
  text-align: right;
  white-space: nowrap;
}
.color-value {
  overflow: hidden;
  color: #909399;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.control-unit {
  color: #909399;
  font-size: 12px;
}
.number-control ::v-deep .el-slider {
  width: 100%;
  min-width: 0;
}
.compact-number {
  width: 64px;
}
.compact-number ::v-deep .el-input__inner {
  height: 28px;
  padding: 0 6px;
  line-height: 28px;
  text-align: center;
}
</style>
