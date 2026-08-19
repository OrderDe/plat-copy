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
          <el-form label-width="80px" size="small">
            <el-form-item label="背景颜色">
              <el-color-picker v-model="item.computedStyle.bgColor" show-alpha />
            </el-form-item>
            <el-form-item label="上边距">
              <el-slider v-model="marginTop" :min="0" :max="100" show-input :show-input-controls="false" />
            </el-form-item>
            <el-form-item label="下边距">
              <el-slider v-model="marginBottom" :min="0" :max="100" show-input :show-input-controls="false" />
            </el-form-item>
            <el-form-item label="左右边距">
              <el-slider v-model="leftRightMargin" :min="0" :max="50" show-input :show-input-controls="false" />
            </el-form-item>
            <el-form-item label="上内边距">
              <el-slider v-model="paddingTop" :min="0" :max="100" show-input :show-input-controls="false" />
            </el-form-item>
            <el-form-item label="下内边距">
              <el-slider v-model="paddingBottom" :min="0" :max="100" show-input :show-input-controls="false" />
            </el-form-item>
            <el-form-item label="圆角">
              <el-slider v-model="borderRadius" :min="0" :max="50" show-input :show-input-controls="false" />
            </el-form-item>
          </el-form>
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
</style>
