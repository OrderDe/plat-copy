<template>
  <div class="diy-order-multi-broadcast" :style="bgStyle">
    <div class="order-multi-broadcast-box" :style="broadcastStyle">
      <div class="order-multi-broadcast-title">
        <span class="title-side">◆</span>
        <div class="order-multi-broadcast-title-text">{{ broadcastTitle }}</div>
        <span class="title-side">◆</span>
      </div>
      <div class="order-multi-broadcast-list">
        <div v-for="(item, index) in demoList" :key="index" class="order-multi-broadcast-item">
          <div class="cell-item cell-user">
            <div v-if="updataCheck('avatar')" class="order-multi-broadcast-avatar">
              <i class="el-icon-user-solid" />
            </div>
            <div class="order-multi-broadcast-text" :style="{ color: computedStyle.wordColor }">{{ item.username }}</div>
          </div>
          <div
            class="cell-item order-multi-broadcast-mobile"
            :style="{ color: computedStyle.wordColor, textAlign: updataCheck('time') ? 'left' : 'right' }"
          >
            {{ item.mobile }}
          </div>
          <div v-if="updataCheck('time')" class="cell-item order-multi-broadcast-time" :style="{ color: computedStyle.wordColor }">
            {{ item.create_at }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 多行订单播报 —— 画布预览。迁移自 PHP common/order-multi-broadcast/preview.php
 *
 * 标题两侧的 left_img.png / right_img.png 与头像占位图平台端无资源，
 * 分别用字符菱形与 CSS 圆形 + 图标替代。
 */
const DEMO_ROW = {
  mobile: '135****4901',
  username: '秦*显',
  create_at: '2024-07-02 12:12:12',
};

export default {
  name: 'OrderMultiBroadcastPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      demoList: new Array(7).fill(null).map(() => ({ ...DEMO_ROW })),
    };
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    bgStyle() {
      const bgColor = this.computedStyle.bgColor;
      return { backgroundColor: bgColor === undefined ? '#F6F6F6' : bgColor || 'transparent' };
    },
    broadcastStyle() {
      const { brodcastBgColor } = this.computedStyle;
      const searchIpts = this.computedStyle.searchIpts || { 'border-radius': '10px', margin: '16px' };
      return {
        ...searchIpts,
        backgroundColor: brodcastBgColor === undefined ? '#FFF' : brodcastBgColor || 'transparent',
      };
    },
    broadcastTitle() {
      const title = this.activeItem.data && this.activeItem.data.broadcastTitle;
      return title === undefined ? '装修展示' : title;
    },
  },
  methods: {
    updataCheck(name) {
      const data = this.activeItem.data || {};
      const content = data.content === undefined ? ['avatar', 'time'] : data.content;
      if (content && content.length >= 0) return content.includes(name);
      return true;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-order-multi-broadcast {
  overflow: hidden;
}
.order-multi-broadcast-box {
  height: 340px;
  overflow: hidden;
}
.order-multi-broadcast-list {
  padding: 0 16px;
}
.order-multi-broadcast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 0.5px solid #ebebeb;
  font-size: 12px;
  font-weight: bold;
  padding: 16px 0;
  color: #333;
}
.cell-item {
  flex: 1;
  flex-wrap: nowrap;
}
.cell-user {
  display: flex;
  align-items: center;
}
.order-multi-broadcast-title {
  display: flex;
  font-size: 14px;
  font-weight: bold;
  justify-content: center;
  align-items: center;
  padding: 16px 0;

  .title-side {
    font-size: 10px;
    color: #d8d8d8;
  }
}
.order-multi-broadcast-title-text {
  padding: 0 10px;
  white-space: nowrap;
}
.order-multi-broadcast-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #d8d8d8;
  color: #fff;
  flex-shrink: 0;
}
.order-multi-broadcast-mobile {
  text-align: right;
}
.order-multi-broadcast-time {
  white-space: nowrap;
}
.order-multi-broadcast-text {
  padding-left: 8px;
}
</style>
