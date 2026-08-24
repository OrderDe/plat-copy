<template>
  <div class="diy-goods-cate" :style="wrapStyle">
    <!-- 宫格 -->
    <div v-if="mode === 'grid'" class="cate-grid">
      <div v-for="(cate, index) in cateList" :key="index" class="cate-cell" :style="cellStyle">
        <div v-if="showImage" class="cate-img">
          <img v-if="cate.img" :src="cate.img" alt="" />
        </div>
        <div class="cate-name" :style="{ color: nameColor }">{{ cate.btnText || '分类名' }}</div>
      </div>
    </div>

    <!-- 横向滑动 -->
    <div v-else class="cate-scroll">
      <div v-for="(cate, index) in cateList" :key="index" class="cate-cell cate-cell--scroll">
        <div v-if="showImage" class="cate-img">
          <img v-if="cate.img" :src="cate.img" alt="" />
        </div>
        <div class="cate-name" :style="{ color: nameColor }">{{ cate.btnText || '分类名' }}</div>
      </div>
    </div>

    <div v-if="!cateList.length" class="cate-empty">请在右侧添加分类</div>
  </div>
</template>

<script>
/**
 * 分类展示 —— 画布预览
 *
 * 走「手动配置 + 链接」，与 commonly-icon-group 同一套数据结构，
 * 所以预览直接渲染配好的项，不需要占位假数据。
 *
 * 字段与 App 端 components/qdiy/widgets/qdiyGoodsCate.vue 严格对齐：
 *   data.cateList  [{ img, btnText, link_params }]
 *   data.mode      grid 宫格 / scroll 横向滑动
 *   data.colCount  宫格每行个数（3~5）
 *   data.showImage 是否显示分类图
 *   computedStyle.textStyle / iptBg / spaceStyle
 */
export default {
  name: 'GoodsCatePreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    data() {
      return this.activeItem.data || {};
    },
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    cateList() {
      return (this.data.cateList || []).filter((e) => e);
    },
    mode() {
      return this.data.mode === 'scroll' ? 'scroll' : 'grid';
    },
    colCount() {
      const n = Number(this.data.colCount);
      return n >= 3 && n <= 5 ? n : 4;
    },
    cellStyle() {
      return { width: 100 / this.colCount + '%' };
    },
    showImage() {
      return this.data.showImage === undefined ? true : !!this.data.showImage;
    },
    nameColor() {
      return this.computedStyle.textStyle || '#333333';
    },
    wrapStyle() {
      return Object.assign(
        { background: this.computedStyle.iptBg || 'transparent' },
        this.computedStyle.spaceStyle || {}
      );
    },
  },
};
</script>

<style scoped lang="scss">
.diy-goods-cate {
  box-sizing: border-box;
  padding: 6px 0;
}

.cate-grid {
  display: flex;
  flex-wrap: wrap;
}
.cate-scroll {
  display: flex;
  overflow-x: auto;
  &::-webkit-scrollbar {
    height: 0;
  }
}
.cate-cell {
  box-sizing: border-box;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cate-cell--scroll {
  width: 75px;
  flex: none;
}
.cate-img {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: #f0f0f0;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}
.cate-name {
  margin-top: 6px;
  font-size: 12px;
  line-height: 17px;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cate-empty {
  padding: 30px 0;
  text-align: center;
  color: #bbb;
  font-size: 12px;
}
</style>
