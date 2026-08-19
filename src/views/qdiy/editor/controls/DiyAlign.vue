<template>
  <DiyStyleContain :title="title">
    <div class="diy-align-content">
      <div
        v-for="(item, index) in aligns"
        :key="index"
        class="diy-align-img"
        :class="{ active: currentType === item }"
        :title="alignName(item)"
        @click="toggle(item)"
      >
        <!-- 原实现用的是 resources/img/decorate/align-*.png，
             Java 平台端没有这批图片资源，改用等价的 CSS 图形 -->
        <div class="align-icon" :class="`align-${item}`">
          <i /><i /><i />
        </div>
      </div>
    </div>
  </DiyStyleContain>
</template>

<script>
/**
 * 对齐方式控件
 * 迁移自 PHP diy-align.php
 */
import DiyStyleContain from './DiyStyleContain';

export default {
  name: 'DiyAlign',
  components: { DiyStyleContain },
  props: {
    title: {
      type: String,
      default: '文字位置',
    },
    aligns: {
      type: Array,
      default: () => ['left', 'center'],
    },
    current: {
      type: String,
      default: 'left',
    },
  },
  data() {
    return {
      currentType: 'left',
    };
  },
  watch: {
    current: {
      immediate: true,
      handler(val) {
        this.currentType = val || 'left';
      },
    },
  },
  methods: {
    alignName(type) {
      return { left: '左对齐', center: '居中', right: '右对齐' }[type] || type;
    },
    toggle(type) {
      this.currentType = type;
      this.$emit('change', type);
    },
  },
};
</script>

<style scoped lang="scss">
.diy-align-content {
  display: flex;
  align-items: center;
  padding-top: 20px;
}
.diy-align-img {
  width: 50px;
  height: 50px;
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 5px;
  &.active {
    border-color: #707070;
  }
}
.align-icon {
  width: 30px;
  display: flex;
  flex-direction: column;
  i {
    display: block;
    height: 3px;
    background: #909399;
    margin: 3px 0;
    width: 100%;
    &:nth-child(2) {
      width: 60%;
    }
  }
  &.align-center i:nth-child(2) {
    margin-left: auto;
    margin-right: auto;
  }
  &.align-right i:nth-child(2) {
    margin-left: auto;
  }
}
</style>
