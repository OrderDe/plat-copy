<template>
  <div class="diy-center-box" :style="{ background: bottomBg }">
    <div class="diy-center-list" :style="[searchIpts]">
      <div v-if="title" class="diy-center-cell" :style="{ background: titleBg }">
        <div class="cell-title" :style="{ color: titleColor }">{{ title }}</div>
        <div v-if="subTitle" class="cell-subtitle" :style="{ color: subtitleColor }">{{ subTitle }}</div>
        <i v-if="icon" :class="icon" :style="{ color: subtitleColor, fontSize: iconSize + 'px' }" class="cell-icon" />
      </div>
      <div class="diy-center-menu-box" :style="[menuBoxStyle]">
        <div v-for="(item, index) in list" :key="index" class="order-menu-items" :style="{ width: itemWidth }">
          <el-image
            class="order-menu-img"
            :style="{ maxWidth: widthImg + 'px', height: heightImg + 'px' }"
            :src="imgToUrl(item.img)"
          />
          <div class="order-menu-text" :style="{ color: btnColor }">{{ item.btnText }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 用户中心菜单预览块
 * 迁移自 PHP diy-center-menu.php
 *
 * 原实现里的静态图前缀来自 Yii 的 @attachurl 别名，Java 侧没有等价物，
 * 改为通过 staticImgPrefix 由使用方注入，默认为空即按原样使用 url。
 */
export default {
  name: 'DiyCenterMenu',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
    list: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      default: '',
    },
    subTitle: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    iconSize: {
      type: Number,
      default: 12,
    },
    bottomBg: {
      type: String,
      default: '',
    },
    titleBg: {
      type: String,
      default: '',
    },
    contentBg: {
      type: String,
      default: '',
    },
    titleColor: {
      type: String,
      default: '',
    },
    subtitleColor: {
      type: String,
      default: '',
    },
    btnColor: {
      type: String,
      default: '',
    },
    widthImg: {
      type: Number,
      default: 24,
    },
    heightImg: {
      type: Number,
      default: 24,
    },
    itemWidth: {
      type: String,
      default: '20%',
    },
    staticImgPrefix: {
      type: String,
      default: '',
    },
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    searchIpts() {
      return this.computedStyle.searchIpts || {};
    },
    menuBoxStyle() {
      return Object.assign({ background: this.contentBg }, this.computedStyle.conRadiusSets || {});
    },
  },
  methods: {
    imgToUrl(url) {
      if (url && url.indexOf('http') === -1 && url.indexOf('resources/img') === -1) {
        return this.staticImgPrefix + url;
      }
      return url;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-center-box,
.diy-center-list {
  position: relative;
  overflow: hidden;
}
.diy-center-cell {
  display: flex;
  align-items: center;
  padding: 20px 10px 12px;
  font-size: 14px;
}
.cell-title {
  font-size: 15px;
  font-weight: 700;
}
.cell-subtitle {
  flex: 1;
  text-align: right;
  font-size: 13px;
  color: #666;
}
.cell-icon {
  margin-top: 2px;
}
.diy-center-menu-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 0 0 20px;
  text-align: center;
  background: #fff;
}
.order-menu-items {
  padding: 20px 0 0;
}
.order-menu-img {
  max-width: 30px;
  height: 25px;
}
.order-menu-text {
  font-size: 12px;
  padding-top: 10px;
  color: #333;
}
</style>
