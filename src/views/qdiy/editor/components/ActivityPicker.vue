<template>
  <div class="activity-picker">
    <div class="picker-head">
      <el-input
        v-model="inputId"
        size="small"
        class="id-input"
        placeholder="输入活动ID后点添加"
        @keyup.enter.native="addItem"
      />
      <el-button size="small" type="primary" plain @click="addItem">添加({{ list.length }}/{{ maxLength }})</el-button>
    </div>

    <div v-if="list.length" class="picker-list">
      <div v-for="(item, index) in list" :key="index" class="picker-item">
        <span class="item-id">ID: {{ item.params && item.params.id }}</span>
        <i class="el-icon-close" @click="delItem(index)" />
      </div>
    </div>

    <div class="picker-tip">{{ tip }}</div>
  </div>
</template>

<script>
/**
 * 营销活动选择器
 *
 * PHP 侧这批营销组件（拼团 / 砍价 / 盲盒 / 抽奖 / 次卡 / 课程 …）都用 com-pick-link
 * 打开对应活动的选择弹窗，依赖 PHP 各营销插件的列表接口。
 * Java 平台端没有这些活动模块的接口，这里改为按活动 ID 手动录入，
 * 保存的数据结构与 PHP 完全一致（[{ params: { id } }]），
 * 后续 Java 侧补上活动列表接口时，把这个组件换成对应的选择弹窗即可。
 */
export default {
  name: 'ActivityPicker',
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    maxLength: {
      type: [String, Number],
      default: 30,
    },
    tip: {
      type: String,
      default: '按活动 ID 添加，真实活动信息由 App 端按 ID 获取',
    },
  },
  data() {
    return {
      inputId: '',
      list: [],
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.list = [...(val || [])];
      },
    },
  },
  methods: {
    addItem() {
      const id = String(this.inputId).trim();
      if (!id) return;
      if (this.list.length >= Number(this.maxLength)) {
        this.$message({ message: `最多添加${this.maxLength}个噢`, type: 'warning' });
        return;
      }
      if (this.list.some((it) => String(it.params && it.params.id) === id)) {
        this.$message({ message: '该活动已添加', type: 'warning' });
        return;
      }
      this.list.push({ params: { id } });
      this.inputId = '';
      this.emitChange();
    },
    delItem(index) {
      this.list.splice(index, 1);
      this.emitChange();
    },
    emitChange() {
      this.$emit('input', this.list);
      this.$emit('change', this.list);
    },
  },
};
</script>

<style scoped lang="scss">
.activity-picker {
  background: #f4f3f7;
  border-radius: 4px;
  padding: 12px;
}
.picker-head {
  display: flex;
  align-items: center;
}
.id-input {
  width: 160px;
  margin-right: 10px;
}
.picker-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 12px;
}
.picker-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 4px;
  padding: 4px 8px;
  margin: 0 8px 8px 0;
  font-size: 12px;
  color: #666;

  .el-icon-close {
    margin-left: 6px;
    cursor: pointer;
    color: #999;
  }
}
.picker-tip {
  padding-top: 4px;
  color: #999;
  font-size: 12px;
}
</style>
