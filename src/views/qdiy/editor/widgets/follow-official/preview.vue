<template>
  <div class="follow-official-previews">
    <div class="follow-box">
      <div class="follow-info">关注公众号，可第一时间收到最新活动和订单通知等消息推送</div>
      <div class="follow-btn">关注</div>
    </div>
  </div>
</template>

<script>
/**
 * 关注公众号 —— 画布预览
 * 迁移自 PHP common/follow-official/preview.php
 *
 * 该组件没有可配置项，展示内容固定，实际数据由 App 端按系统设置渲染。
 * 原文件里另有一版被注释掉的旧样式（带公众号头像/名称/简介），未迁移。
 */
export default {
  name: 'FollowOfficialPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style scoped lang="scss">
.follow-official-previews {
  padding: 5px 10px;
}
.follow-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  padding: 5px 10px;
  background: #fff;
  border-radius: 5px;
  box-shadow: 0 0 5px #ccc;
}
.follow-info {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
}
.follow-btn {
  width: 50px;
  height: 23px;
  font-size: 13px;
  line-height: 21px;
  text-align: center;
  border-radius: 15px;
  color: #fff;
  background: #e60000;
  flex-shrink: 0;
}
</style>
