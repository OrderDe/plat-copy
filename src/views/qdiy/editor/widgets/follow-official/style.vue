<template>
  <div class="follow-official-box">该模块由系统设置自动显示，无需编辑</div>
</template>

<script>
/** 关注公众号 —— 属性面板。迁移自 PHP common/follow-official/style.php（本就无配置项） */
export default {
  name: 'FollowOfficialStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style scoped lang="scss">
.follow-official-box {
  display: block;
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 13px;
}
</style>
