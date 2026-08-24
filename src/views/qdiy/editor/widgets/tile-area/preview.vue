<template>
  <div class="diy-tile-area" :style="wrapStyle">
    <div class="ta-grid" :style="gridStyle">
      <div v-for="(tile, index) in tiles" :key="index" class="ta-tile" :style="tileStyles[index]">
        <img v-if="tile.img" class="ta-bg" :src="tile.img" alt="" />
        <div class="ta-text">
          <div v-if="tile.title" class="ta-title" :style="{ color: fontColorOf(tile) }">{{ tile.title }}</div>
          <div v-if="tile.subTitle" class="ta-sub" :style="{ color: fontColorOf(tile) }">{{ tile.subTitle }}</div>
        </div>
      </div>
    </div>
    <div v-if="!tiles.length" class="ta-empty">请在右侧添加瓷片</div>
  </div>
</template>

<script>
/**
 * 瓷片区 —— 画布预览
 *
 * 字段与 App 端 components/qdiy/widgets/qdiyTileArea.vue 严格对齐：
 *   data.tiles     [{ img, title, subTitle, bgColor, fontColor, link_params }]
 *   data.colCount  一行几块（1~4）
 *   data.ratio     块高相对块宽的百分比
 *   computedStyle.iptBg / gap / tileRadius / spaceStyle
 *
 * 高度用 padding-top 百分比撑开，与 App 端同一套算法，所见即所得。
 */
export default {
  name: 'TileAreaPreview',
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
    tiles() {
      return (this.data.tiles || []).filter((e) => e);
    },
    colCount() {
      const n = Number(this.data.colCount);
      return n >= 1 && n <= 4 ? n : 2;
    },
    ratio() {
      const n = Number(this.data.ratio);
      return n > 0 ? n : 60;
    },
    gap() {
      const g = Number(this.computedStyle.gap);
      return Number.isFinite(g) && g >= 0 ? g : 8;
    },
    radius() {
      const r = Number(this.computedStyle.tileRadius);
      return Number.isFinite(r) && r >= 0 ? r : 8;
    },
    gridStyle() {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${this.colCount}, 1fr)`,
        gap: `${this.gap}px`,
      };
    },
    wrapStyle() {
      return Object.assign(
        { background: this.computedStyle.iptBg || 'transparent' },
        this.computedStyle.spaceStyle || {}
      );
    },
    tileStyles() {
      return this.tiles.map((t) => ({
        background: t.bgColor || '#f5f5f5',
        borderRadius: `${this.radius}px`,
        paddingTop: `${this.ratio}%`,
      }));
    },
  },
  methods: {
    fontColorOf(tile) {
      return tile.fontColor || '#333333';
    },
  },
};
</script>

<style scoped lang="scss">
.diy-tile-area {
  box-sizing: border-box;
  padding: 6px 0;
}
.ta-tile {
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
}
.ta-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ta-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px 12px;
}
.ta-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 19px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ta-sub {
  margin-top: 2px;
  font-size: 11px;
  line-height: 16px;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ta-empty {
  padding: 30px 0;
  text-align: center;
  color: #bbb;
  font-size: 12px;
}
</style>
