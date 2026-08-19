<template>
  <div class="diy-url-sel">
    <div class="diy-url" @click="clickUrl">
      <i class="el-icon-link diy-url-icon" />
      <span>{{ text ? text : '链接选择' }}</span>
    </div>
  </div>
</template>

<script>
/**
 * 链接选择入口 —— 只负责展示与触发，选链接弹窗由使用方接入
 * 迁移自 PHP diy-url.php（原实现同样把弹窗放在外部）
 *
 * 平台端已有 `@/components/linkaddress` 可直接对接 add 事件。
 */
export default {
  name: 'DiyUrl',
  props: {
    text: {
      type: String,
      default: '',
    },
  },
  methods: {
    clickUrl() {
      this.$emit('add', true);
    },
  },
};
</script>

<style scoped lang="scss">
.diy-url-sel {
  width: 100%;
}
.diy-url {
  display: flex;
  align-items: center;
  height: 39px;
  background: #edf2fc;
  border-radius: 2px;
  font-size: 11px;
  font-weight: bold;
  color: #999;
  padding: 0 15px;
  cursor: pointer;
}
.diy-url-icon {
  font-size: 13px;
  margin-right: 10px;
}
</style>
