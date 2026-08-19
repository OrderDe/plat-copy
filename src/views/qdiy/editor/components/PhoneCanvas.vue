<template>
  <div class="phone-canvas">
    <div class="phone">
      <div class="phone-head">{{ pageTitle }}</div>

      <div class="phone-body">
        <!-- isTop 组件固定在顶部，不参与拖拽排序 -->
        <div
          v-for="(item, index) in topList"
          :key="`top-${item.identify}-${index}`"
          class="canvas-item is-top"
          :class="{ active: activeIndex === indexOf(item) }"
          @click="$emit('select', indexOf(item))"
        >
          <div class="fixed-flag">固定顶部</div>
          <component :is="previewOf(item.identify)" :item="item" :active-item="item" :component="componentOf(item.identify)" />
          <div v-if="activeIndex === indexOf(item)" class="op-bar">
            <i class="el-icon-delete" title="删除" @click.stop="$emit('remove', indexOf(item))" />
          </div>
        </div>

        <draggable
          v-model="dragList"
          :options="{ animation: 200, handle: '.canvas-item' }"
          @end="handleDragEnd"
        >
          <div
            v-for="(item, index) in dragList"
            :key="`drag-${item.identify}-${index}`"
            class="canvas-item"
            :class="{ active: activeIndex === indexOf(item) }"
            :style="toStyle(item.computedStyle)"
            @click="$emit('select', indexOf(item))"
          >
            <component :is="previewOf(item.identify)" :item="item" :active-item="item" :component="componentOf(item.identify)" />

            <div v-if="activeIndex === indexOf(item)" class="op-bar">
              <i
                v-if="permOf(item).up && index > 0"
                class="el-icon-top"
                title="上移"
                @click.stop="$emit('move', indexOf(item), -1)"
              />
              <i
                v-if="permOf(item).down && index < dragList.length - 1"
                class="el-icon-bottom"
                title="下移"
                @click.stop="$emit('move', indexOf(item), 1)"
              />
              <i
                v-if="permOf(item).copy"
                class="el-icon-document-copy"
                title="复制"
                @click.stop="$emit('copy', indexOf(item))"
              />
              <i
                v-if="permOf(item).delete"
                class="el-icon-delete"
                title="删除"
                @click.stop="$emit('remove', indexOf(item))"
              />
            </div>
          </div>
        </draggable>

        <div v-if="!list.length" class="canvas-empty">从左侧点击组件添加到页面</div>
      </div>

      <div v-if="showBottomNav" class="phone-foot">底部导航</div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable';
import { previewOf, parsePermission, toStyle } from '../registry';

export default {
  name: 'PhoneCanvas',
  components: { draggable },
  props: {
    list: {
      type: Array,
      default: () => [],
    },
    // 组件注册表，按 code 索引
    componentMap: {
      type: Object,
      default: () => ({}),
    },
    activeIndex: {
      type: Number,
      default: -1,
    },
    pageTitle: {
      type: String,
      default: '',
    },
    showBottomNav: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    // 固定顶部的组件
    topList() {
      return this.list.filter((e) => this.isTop(e));
    },
    // 可拖拽排序的组件
    dragList: {
      get() {
        return this.list.filter((e) => !this.isTop(e));
      },
      set(val) {
        // 重排后与固定顶部组件重新拼接，顶部组件始终在前
        this.$emit('reorder', [...this.topList, ...val]);
      },
    },
  },
  methods: {
    previewOf,
    toStyle,
    componentOf(code) {
      return this.componentMap[code] || {};
    },
    isTop(item) {
      const c = this.componentMap[item.identify];
      return !!(c && Number(c.isTop) === 1);
    },
    permOf(item) {
      const c = this.componentMap[item.identify];
      return parsePermission(c && c.permission);
    },
    // 画布项在整个 list 中的真实下标
    indexOf(item) {
      return this.list.indexOf(item);
    },
    handleDragEnd() {
      this.$emit('drag-end');
    },
  },
};
</script>

<style scoped lang="scss">
.phone-canvas {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
  background: #f5f7fa;
  display: flex;
  justify-content: center;
}
.phone {
  width: 375px;
  min-height: 667px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  align-self: flex-start;
  display: flex;
  flex-direction: column;
}
.phone-head {
  height: 44px;
  line-height: 44px;
  text-align: center;
  font-size: 14px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
}
.phone-body {
  flex: 1;
}
.phone-foot {
  height: 50px;
  line-height: 50px;
  text-align: center;
  font-size: 12px;
  color: #909399;
  background: #fafafa;
  border-top: 1px solid #ebeef5;
}
.canvas-item {
  position: relative;
  cursor: move;
  border: 1px solid transparent;
  &:hover {
    border-color: #a0cfff;
  }
  &.active {
    border-color: #409eff;
  }
  &.is-top {
    cursor: default;
  }
}
.fixed-flag {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
  background: #909399;
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  transform: scale(0.9);
  transform-origin: left top;
}
.op-bar {
  position: absolute;
  right: -34px;
  top: 0;
  background: #409eff;
  border-radius: 3px;
  padding: 4px 2px;
  z-index: 3;
  i {
    display: block;
    color: #fff;
    font-size: 14px;
    padding: 3px;
    cursor: pointer;
  }
}
.canvas-empty {
  padding: 120px 0;
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
}
</style>
