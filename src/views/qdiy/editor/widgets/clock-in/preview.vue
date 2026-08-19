<template>
  <div class="diy-clockin">
    <div class="clockin-content">
      <div class="clockin-text">
        <div>{{ btnTitle }}</div>
        <div class="clockin-integral">
          <div>{{ btnValue }}</div>
          <i class="el-icon-coin integral-icon" />
          <div class="red">+{{ integral }}</div>
        </div>
      </div>
      <div class="clockin-details red">活动详情</div>
    </div>

    <div class="clockin-main">
      <div class="clockin-btn">
        <i class="el-icon-share" />
        <span>分享海报</span>
      </div>
      <div class="clockin-btn">
        <i class="el-icon-upload2" />
        <span>上传截图</span>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 打卡 —— 画布预览。迁移自 PHP common/clock-in/preview.php
 *
 * 背景图与两个按钮图标来自打卡插件静态资源，平台端无该素材，改用底色 + Element 图标。
 */
export default {
  name: 'ClockInPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    searchData() {
      return this.activeItem.data || {};
    },
    btnTitle() {
      return this.searchData.btnTitle || '分享海报赢海量好礼';
    },
    btnValue() {
      return this.searchData.btnValue || '分享海报赢海量好礼';
    },
    integral() {
      return this.searchData.integral || '2000';
    },
  },
};
</script>

<style scoped lang="scss">
.diy-clockin {
  background: linear-gradient(135deg, #ffe6c0 0%, #fff6e2 100%);
  overflow: hidden;
}
.clockin-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
}
.clockin-text {
  font-size: 13px;
}
.clockin-integral {
  display: flex;
  align-items: center;
  padding-top: 4px;
  font-size: 12px;
  color: #666;
}
.integral-icon {
  margin: 0 4px;
  color: #f0a63a;
}
.red {
  color: #db0505;
}
.clockin-details {
  font-size: 12px;
}
.clockin-main {
  display: flex;
  background: #fff6e2;
  padding: 10px 12px;
}
.clockin-btn {
  display: flex;
  align-items: center;
  font-size: 12px;
  margin-right: 20px;
  color: #666;

  i {
    margin-right: 4px;
  }
}
</style>
