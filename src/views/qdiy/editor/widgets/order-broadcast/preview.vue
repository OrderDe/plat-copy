<template>
  <div class="diy-order-broadcast" :style="broadcastStyle">
    <div class="order-broadcast-bg" :style="broadcastBg" />
    <div class="order-broadcast-box">
      <div v-if="updataCheck('avatar')" class="order-broadcast-avatar">
        <i class="el-icon-user-solid" />
      </div>
      <div v-if="updataCheck('time')" class="order-broadcast-time" :style="{ color: computedStyle.timeColor }">
        5秒前
      </div>
      <div class="order-broadcast-text" :style="{ color: computedStyle.wordColor }">La**下了新订单</div>
    </div>
  </div>
</template>

<script>
/**
 * 订单播报 —— 画布预览。迁移自 PHP common/order-broadcast/preview.php
 *
 * 头像用 CSS 圆形占位替代 PHP 侧的 default_picture.png。
 */
export default {
  name: 'OrderBroadcastPreview',
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
    broadcastStyle() {
      return this.computedStyle.broadcastStyle || { top: '10px', left: '10px' };
    },
    broadcastBg() {
      const cs = this.computedStyle;
      const opacity = cs.bgOpacity === undefined ? 0.5 : (cs.bgOpacity / 100).toFixed(2);
      return {
        background: cs.brodcastBgColor || '#000000',
        borderRadius: `${cs.borderRadius === undefined ? 20 : cs.borderRadius}px`,
        opacity,
      };
    },
  },
  methods: {
    /** 内容多选：未配置时头像与时间都显示 */
    updataCheck(name) {
      const content = this.activeItem.data && this.activeItem.data.content;
      if (content && content.length >= 0) return content.includes(name);
      return true;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-order-broadcast {
  position: absolute;
  z-index: 99;
}
.order-broadcast-box {
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  min-width: 120px;
  max-width: 200px;
  height: 32px;
  font-size: 12px;
  padding: 0 4px;
}
.order-broadcast-bg {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #000;
  border-radius: 30px;
  opacity: 0.5;
}
.order-broadcast-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #d8d8d8;
  color: #fff;
  flex-shrink: 0;
}
.order-broadcast-time {
  padding-left: 4px;
  color: #fff;
  white-space: nowrap;
}
.order-broadcast-text {
  color: #fff;
  padding-left: 8px;
  white-space: nowrap;
}
</style>
