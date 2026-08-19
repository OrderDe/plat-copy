<template>
  <div class="diy-button-group" :style="{ background: computedStyle.searchBox }">
    <div class="diy-button-boxs" :style="contentStyle">
      <div class="btn-rows" :class="'diy-button-' + pattern">
        <div
          v-for="(item, index) in renderList"
          :key="index"
          class="btn-group-list"
          :class="'col-' + singleLine"
        >
          <div v-if="btnData.buttonData && btnData.buttonData.style != 3" class="btn-group-image" :style="getBtnGroupImage">
            <el-image v-if="item.img" style="width: 100%; height: 100%" :src="item.img" fit="cover" />
            <i v-else class="el-icon-picture-outline btn-img-holder" />
          </div>
          <div v-if="btnData.buttonData && btnData.buttonData.style != 2" class="btn-group-text" :style="getBtnGroupText">
            {{ item.btnText }}
          </div>
          <div
            v-if="isShowTags && item.is_show_tag"
            class="btn-group-tags"
            :style="{ background: item.tagsBgColor, color: item.tagsTextColor }"
          >
            {{ item.tags }}
          </div>
        </div>
      </div>

      <template v-if="pattern == 'swiper'">
        <div class="swiper-arrow left" @click.stop="toggleHandle('left')">
          <i class="el-icon-arrow-left" />
        </div>
        <div class="swiper-arrow right" @click.stop="toggleHandle('right')">
          <i class="el-icon-arrow-right" />
        </div>
        <div class="swiper-dots">
          <div
            v-for="(it, i) in pages"
            :key="i"
            class="dot-item"
            :class="{ active: i == current }"
            @click.stop="dotClick(i)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
/**
 * 按钮组 —— 画布预览。迁移自 PHP common/button-group/preview.php
 *
 * 三种风格：fixed 固定换行 / scroll 单行滑动 / swiper 分页滑动（带箭头与轮播点）。
 * 默认按钮图 resources/img/decorate/default_btn*.png 平台端无资源，未配图时显示占位图标。
 */
import { deepClone } from '../../controls/utils';

export default {
  name: 'ButtonGroupPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      iconList: [],
      swiperList: [],
      current: 0,
      pages: [],
    };
  },
  computed: {
    btnData() {
      return this.activeItem.data || {};
    },
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    buttonData() {
      return this.btnData.buttonData || {};
    },
    pattern() {
      return this.buttonData.pattern || 'fixed';
    },
    singleLine() {
      return this.buttonData.single_line || 3;
    },
    renderList() {
      return this.pattern === 'swiper' ? this.swiperList : this.iconList;
    },
    // 按钮形状 → 图片圆角
    borderRadius() {
      const map = { square: '0px', round: '8px', circle: '50%' };
      return map[this.buttonData.shape] || map.circle;
    },
    contentStyle() {
      const tabItem = this.computedStyle.tabItem;
      const style = {
        background: this.computedStyle.iptBg,
        ...this.computedStyle.searchIpts,
      };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    isShowTags() {
      return this.buttonData.style !== 3 && this.buttonData.type === 1;
    },
    getBtnGroupText() {
      const style = { color: this.computedStyle.textStyle };
      if (this.pattern === 'scroll') {
        style.fontWeight = this.btnData.fontWeight || 'normal';
        const f = this.btnData.fontSizeInfos;
        style.fontSize = f ? f[0].value + f[0].unit : '12px';
      }
      return style;
    },
    getBtnGroupImage() {
      const style = { borderRadius: this.borderRadius };
      if (this.pattern === 'scroll') {
        const s = this.btnData.imgSizeInfos;
        const size = s ? s[0].value + s[0].unit : '40px';
        style.width = size;
        style.height = size;
      }
      return style;
    },
  },
  watch: {
    activeItem: {
      deep: true,
      immediate: true,
      handler(val) {
        const data = (val && val.data) || {};
        const btn = data.buttonData || {};
        const list = data.iconList || [];
        this.iconList = btn.pattern === 'scroll' ? list.slice(0, btn.single_line) : list;
        if (btn.pattern === 'swiper') this.toggleHandle();
      },
    },
  },
  methods: {
    toggleHandle(name) {
      const btn = this.buttonData;
      const lineNum = btn.line_num || 1;
      const singleLine = btn.single_line || 3;
      this.pages = this.swiperHandle(lineNum, singleLine);
      let n = this.current;
      if (name === 'right' && n < this.pages.length - 1) n++;
      else if (name === 'left' && n > 0) n--;
      if (n > this.pages.length - 1) n = Math.max(this.pages.length - 1, 0);
      this.current = n;
      const size = singleLine * lineNum;
      this.swiperList = this.iconList.slice(size * n, size * (n + 1));
    },
    dotClick(i) {
      this.current = i;
      this.toggleHandle();
    },
    swiperHandle(lineNum, singleLine) {
      const arr = deepClone(this.iconList) || [];
      const len = Math.ceil(arr.length / (lineNum * singleLine));
      const newArr = [];
      for (let i = 0; i < len; i++) {
        newArr[i] = arr.splice(0, lineNum * singleLine);
      }
      return newArr;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-button-group {
  position: relative;
  overflow: hidden;
}
.diy-button-boxs {
  position: relative;
  padding: 4px 0;
  overflow: hidden;
}
.btn-rows {
  display: flex;
  align-items: center;
}
.diy-button-scroll {
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  padding: 0 8px;
}
.diy-button-fixed {
  flex-wrap: wrap;
}
.diy-button-swiper {
  overflow: hidden;
  padding-bottom: 20px;
  flex-wrap: wrap;
}
.btn-group-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 8px 0;
  flex-shrink: 0;
}
.btn-group-tags {
  position: absolute;
  top: -7px;
  left: 50%;
  width: 53px;
  height: 26px;
  transform: scale(0.5);
  color: #fff;
  margin-left: -6px;
  background: #f83287;
  border-radius: 12px 12px 12px 0;
  border: 1px solid #fff;
  text-align: center;
  font-size: 14px;
}
.btn-group-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  background: #f5f5f5;
}
.btn-img-holder {
  font-size: 20px;
  color: #c0c4cc;
}
.btn-group-text {
  font-size: 12px;
  margin-top: 4px;
}
.col-3 {
  width: 33.3%;
}
.col-4 {
  width: 25%;
}
.col-5 {
  width: 20%;
}
.col-6 {
  width: 16.6%;
}
.col-7 {
  width: 14.2%;
}
.diy-button-scroll {
  .col-3 {
    width: 30%;
  }
  .col-4 {
    width: 22%;
  }
}

/* 分页滑动 */
.swiper-arrow {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  top: 50%;
  z-index: 10;
  left: 10px;
  text-align: center;
  line-height: 32px;
  font-size: 20px;
  cursor: pointer;
  margin-top: -16px;
  color: #fff;
  display: none;
}
.diy-button-boxs:hover .swiper-arrow {
  display: block;
}
.swiper-arrow.right {
  left: auto;
  right: 10px;
}
.swiper-dots {
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  height: 30px;
  line-height: 30px;
  text-align: center;
}
.swiper-dots .dot-item {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin: 0 4px;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;

  &.active {
    background: #000;
  }
}
</style>
