<template>
  <div class="commodity-group-tab-preview" :style="containStyle">
    <div class="tab-contain" :style="tabContainStyle">
      <div class="tab-list" :class="{ 'tab-flex': goodList.length <= 4 }">
        <div
          v-for="(item, index) in goodList"
          :key="index"
          class="commodity-group-tab-item"
          :style="itemStyle(index)"
        >
          <div v-if="isShowLine(index)" class="tab-active-line" :style="lineStyle" />
          <div class="tab-title" :style="titleStyle(index)">{{ (item.data && item.data.title) || '标题' }}</div>
          <div v-if="isShowSubTitle" class="tab-subTitle" :style="subTitleStyle(index)">
            {{ (item.data && item.data.subTitle) || '副标题' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 当前选项卡对应的商品组，直接复用 commodity-group 的预览组件 -->
    <commodity-group-preview :active-item="goodsItem" />
  </div>
</template>

<script>
/** 商品组（选项卡）—— 画布预览。迁移自 PHP common/commodity-group-tab/preview.php */
export default {
  name: 'CommodityGroupTabPreview',
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
    goodList() {
      return (this.activeItem.data && this.activeItem.data.goodList) || [];
    },
    activeIndex() {
      return (this.activeItem.data && this.activeItem.data.activeIndex) || 0;
    },
    goodsItem() {
      return this.goodList[this.activeIndex] || { computedStyle: {}, data: {} };
    },
    isShowSubTitle() {
      return this.computedStyle.subtitle || false;
    },
    tabContainStyle() {
      const cs = this.computedStyle;
      return {
        backgroundColor: cs.tabBgColor,
        margin: `${cs.tabMarginTop || 0}px ${cs.tabMarginLR || 0}px ${cs.tabMarginBot || 0}px`,
        borderRadius: `${cs.tabBordeRadiusTop || 0}px ${cs.tabBordeRadiusTop || 0}px ${cs.tabBordeRadiusBot || 0}px ${
          cs.tabBordeRadiusBot || 0
        }px`,
      };
    },
    containStyle() {
      return { backgroundColor: this.computedStyle.containBgColor };
    },
    lineStyle() {
      return { backgroundColor: this.computedStyle.upLineColor };
    },
  },
  methods: {
    isShowLine(index) {
      const boo = this.computedStyle.optionbar;
      if (boo === undefined) return index === this.activeIndex;
      return !!boo && index === this.activeIndex;
    },
    itemStyle(index) {
      const cs = this.computedStyle;
      const isActive = index === this.activeIndex;
      const obj = {
        height: `${cs.subtitle ? 58 : 40}px`,
        margin: `0 ${cs.tabMargin || 0}px`,
      };
      if (isActive && cs.selectback == 1) {
        obj.backgroundColor = cs.tabSelectColor;
      } else if (isActive && cs.selectback == 2) {
        obj.backgroundImage = `url(${cs.tabSelectImg})`;
        obj.backgroundSize = 'cover';
      }
      if (this.goodList.length > 1) obj.flex = 1;
      return obj;
    },
    titleStyle(index) {
      const cs = this.computedStyle;
      return { color: index === this.activeIndex ? cs.titleSelect : cs.titleUnselect };
    },
    subTitleStyle(index) {
      const cs = this.computedStyle;
      return { color: index === this.activeIndex ? cs.subSelectColor : cs.subUnselectColor };
    },
  },
};
</script>

<style scoped lang="scss">
.commodity-group-tab-preview {
  box-sizing: border-box;
  background: #fff;
  overflow: hidden;
}
.tab-contain {
  overflow: hidden;
  background: #fff;
}
.tab-list {
  white-space: nowrap;
  overflow: hidden;
}
.tab-flex {
  display: flex;
  width: 100%;
}
.commodity-group-tab-item {
  display: inline-block;
  position: relative;
  padding: 0 12px;
  text-align: center;
}
.tab-title {
  font-size: 14px;
  height: 20px;
  line-height: 40px;
  white-space: nowrap;
}
.tab-subTitle {
  font-size: 12px;
  height: 20px;
  line-height: 40px;
  white-space: nowrap;
}
.tab-active-line {
  position: absolute;
  left: 38%;
  right: 38%;
  bottom: 0;
  height: 2px;
  background: #fb6638;
  border-radius: 10px;
  z-index: 1;
}
</style>
