<template>
  <div class="diy-img-button-group" :style="{ background: computedStyle.searchBox }">
    <div class="diy-button-boxs" :style="{ ...inputStyle }">
      <div class="btn-row" :class="'diy-button-' + pattern">
        <div
          v-for="(item, index) in pattern === 'swiper' ? swiperList : iconList"
          :key="index"
          class="btn-group-list"
          :class="'col-' + (btnData.buttonData && btnData.buttonData.single_line)"
          :style="{ ...getWhStyle }"
        >
          <div
            v-if="btnData.buttonData && btnData.buttonData.style != 3"
            class="btn-group-image"
            :style="{ borderRadius: borderRadius, ...getImgSizeStyle }"
          >
            <el-image style="width: 100%; height: 100%" :src="item.img" />
          </div>
          <div class="btn-texts">
            <div
              v-if="btnData.buttonData && btnData.buttonData.style != 2"
              class="btn-group-text"
              :style="{ color: computedStyle.textStyle, ...getTopTextStyle }"
            >
              {{ item.btnText }}
            </div>
            <div
              v-if="btnData.buttonData && btnData.buttonData.style != 2"
              class="btn-group-tips"
              :style="{ color: computedStyle.textStyle, ...getBottomTextStyle }"
            >
              {{ item.btnTips }}
            </div>
          </div>
        </div>
      </div>

      <!-- 轮播模式的左右箭头与轮播点 -->
      <template v-if="pattern === 'swiper'">
        <div class="swiper-arrow left" @click.stop="toggleHandle('left')">
          <i class="el-icon-arrow-left" />
        </div>
        <div class="swiper-arrow right" @click.stop="toggleHandle('right')">
          <i class="el-icon-arrow-right" />
        </div>
        <div class="swiper-dots">
          <div
            v-for="(it, i) in list"
            :key="i"
            class="dot-item"
            :class="i === current ? 'active' : ''"
            @click.stop="dotClick(i)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
/**
 * 瓷片区 —— 画布预览
 * 迁移自 PHP common/img-button-group/preview.php
 *
 * 三种排布：fixed 固定换行 / scroll 横向滚动 / swiper 分页轮播。
 * swiper 模式按「每页行数 × 单行数量」切页，箭头与轮播点可点。
 */
import { deepClone } from '../../controls/utils';

export default {
  name: 'ImgButtonGroupPreview',
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
      list: [],
    };
  },
  computed: {
    btnData() {
      return this.activeItem.data || {};
    },
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    borderRadius() {
      const shape = this.btnData.buttonData && this.btnData.buttonData.shape;
      if (shape === 'square') return '0px';
      return shape === 'round' ? '8px' : '50%';
    },
    inputStyle() {
      const tabItem = this.computedStyle.tabItem;
      const style = {
        background: this.computedStyle.iptBg,
        ...(this.computedStyle.searchIpts || {}),
      };
      if (tabItem && tabItem.value === 'border') {
        style.border = `1px solid ${tabItem.color || 'transparent'}`;
      }
      if (tabItem && tabItem.value === 'shandow') {
        style.boxShadow = `0 0 10px ${tabItem.color || 'rgba(226, 231, 244, 0.7)'}`;
      }
      return style;
    },
    pattern() {
      return this.btnData.buttonData && this.btnData.buttonData.pattern;
    },
    // 以下几项尺寸只在 scroll 模式下生效，与原实现一致
    getTopTextStyle() {
      if (this.pattern !== 'scroll') return {};
      const f = this.btnData.iconFontInfos;
      return { fontSize: f && f[0] ? f[0].value + f[0].unit : '12px' };
    },
    getBottomTextStyle() {
      if (this.pattern !== 'scroll') return {};
      const f = this.btnData.iconFontInfos;
      return { fontSize: f && f[1] ? f[1].value + f[1].unit : '12px' };
    },
    getImgSizeStyle() {
      if (this.pattern !== 'scroll') return {};
      const i = this.btnData.iconImgInfos;
      return {
        width: i && i[0] ? i[0].value + i[0].unit : '40px',
        height: i && i[1] ? i[1].value + i[1].unit : '40px',
      };
    },
    getWhStyle() {
      if (this.pattern !== 'scroll') return {};
      const w = this.btnData.widthInfos;
      const h = this.btnData.heightInfos;
      return {
        width: w && w[0] ? w[0].value + w[0].unit : '121px',
        height: h && h[0] ? h[0].value + h[0].unit : '51px',
      };
    },
  },
  watch: {
    activeItem: {
      deep: true,
      immediate: true,
      handler(val) {
        const data = val.data || {};
        this.iconList = data.iconList || [];
        if (data.buttonData && data.buttonData.pattern === 'swiper') {
          this.toggleHandle();
        }
      },
    },
  },
  methods: {
    toggleHandle(name) {
      let n = this.current;
      const lineNum = (this.btnData.buttonData && this.btnData.buttonData.line_num) || 1;
      const singleLine = (this.btnData.buttonData && this.btnData.buttonData.single_line) || 1;
      this.list = this.swiperHandle(lineNum, singleLine);
      if (name === 'right' && n < this.list.length - 1) {
        n++;
      } else if (name === 'left' && n > 0) {
        n--;
      }
      this.current = n;
      this.swiperList = this.iconList.slice(singleLine * lineNum * n, singleLine * lineNum * (n + 1));
    },
    dotClick(i) {
      this.current = i;
      this.toggleHandle();
    },
    // 把 iconList 按每页容量切成二维数组，长度即页数
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
.diy-img-button-group {
  position: relative;
  overflow: hidden;
}
.diy-button-boxs {
  position: relative;
  padding: 4px 0;
  overflow: hidden;
}
.btn-row {
  display: flex;
  align-items: center;
}
.diy-button-scroll {
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
  padding: 0 8px;
  &::-webkit-scrollbar {
    height: 5px;
  }
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  flex-shrink: 0;
  background: rgb(246, 246, 246);
  margin: 0 2px 10px;
  border-radius: 10px;
  box-sizing: border-box;
}
.btn-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.btn-group-image {
  width: 25px;
  height: 25px;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: 50%;
  flex-shrink: 0;
}
.btn-group-text {
  font-size: 12px;
  margin-top: 4px;
  margin-left: 10px;
  font-weight: 700;
}
.btn-group-tips {
  font-size: 12px;
  transform: scale(0.7);
}
.col-3 {
  width: 121px;
  height: 52px;
}
.col-4 {
  width: 25%;
}
.col-5 {
  width: 20%;
}
.diy-button-scroll .col-4 {
  width: 22%;
}
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
  &.right {
    left: auto;
    right: 10px;
  }
}
.diy-button-boxs:hover .swiper-arrow {
  display: block;
}
.swiper-dots {
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  height: 30px;
  line-height: 30px;
  text-align: center;
  .dot-item {
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
}
</style>
