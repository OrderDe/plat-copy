<template>
  <div class="hot-zone-editor">
    <div class="editor-toolbar">
      <div class="tips">
        在图片空白处按住并拖动可添加热区；拖动方块可移动，拖右下角可缩放。
      </div>
      <el-button size="mini" icon="el-icon-picture-outline" @click="replaceImage">更换图片</el-button>
    </div>

    <div class="editor-body">
      <div ref="stage" class="stage" @mousedown="onStageDown">
        <img :src="image" class="stage-img" draggable="false" @load="onImgLoad" />
        <div
          v-for="(zone, index) in zones"
          :key="index"
          class="zone"
          :class="{ active: index === activeIndex }"
          :style="zoneStyle(zone)"
          @mousedown.stop="onZoneDown($event, index)"
        >
          <!-- 带序号，方便和右侧热区列表对上号；没设链接的标出来，免得漏配 -->
          <span class="zone-name">{{ index + 1 }}. {{ zone.urlName || '未设链接' }}</span>
          <i class="el-icon-close zone-del" @mousedown.stop @click.stop="removeZone(index)" />
          <span class="zone-resize" @mousedown.stop="onResizeDown($event, index)" />
        </div>
      </div>

      <!-- 高度跟画布对齐并自己滚动，否则热区一多，列表就把弹窗撑高、图片旁边留一大片点不了的空白 -->
      <div class="side" :style="{ maxHeight: sideMaxHeight }">
        <div class="side-head">
          <span>热区列表（{{ zones.length }}）</span>
          <span>
            <el-button type="text" size="mini" @click="addZone">新增热区</el-button>
            <el-button v-if="zones.length" type="text" size="mini" class="side-item-del" @click="clearZones">
              清空
            </el-button>
          </span>
        </div>
        <!-- 四宫格、通栏这类规整长图，一个个拖太费劲，直接按行列均分 -->
        <div class="side-tools">
          <span class="tool-label">平均分割</span>
          <el-input-number v-model="splitRows" :min="1" :max="10" size="mini" controls-position="right" />
          <span class="tool-x">行 ×</span>
          <el-input-number v-model="splitCols" :min="1" :max="10" size="mini" controls-position="right" />
          <span class="tool-x">列</span>
          <el-button type="text" size="mini" @click="splitGrid">生成</el-button>
        </div>
        <div class="side-tools">
          <el-button type="text" size="mini" @click="sortZones">按位置重新排序</el-button>
        </div>

        <div v-if="!zones.length" class="side-empty">还没有热区，在左侧图片上拖一个出来</div>
        <div
          v-for="(zone, index) in zones"
          :key="index"
          class="side-item"
          :class="{ active: index === activeIndex }"
          @click="activeIndex = index"
        >
          <div class="side-item-title">热区 {{ index + 1 }}</div>
          <DiyUrl :text="zone.urlName" @add="pickLink(index)" />
          <el-button type="text" size="mini" class="side-item-del" @click.stop="removeZone(index)">删除</el-button>
        </div>
      </div>
    </div>

    <div class="footer">
      <el-button size="small" @click="$emit('cancel')">取 消</el-button>
      <el-button type="primary" size="small" @click="handleSave">确 定</el-button>
    </div>

    <LinkPickerDialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 热区编辑器
 *
 * 对应 PHP 侧的 HotZone 组件。热区坐标一律存百分比（leftPer / topPer / widthPer / heightPer，0~1），
 * 这样 App 端按任意宽度渲染都能对上，与 diy-img-setting 里原有的预览、以及已存量数据保持一致。
 */
import DiyUrl from './DiyUrl';
import LinkPickerDialog from './LinkPickerDialog';
import { getOtherUrlName } from './utils';

/** 热区最小尺寸（占图片比例），太小了点不中也拖不动 */
const MIN_PER = 0.03;
/** 防止普通单击、轻微手抖被误判为新增热区 */
const CREATE_THRESHOLD_PX = 8;

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export default {
  name: 'HotZoneEditor',
  components: { DiyUrl, LinkPickerDialog },
  props: {
    image: {
      type: String,
      default: '',
    },
    value: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      zones: [],
      activeIndex: -1,
      // 当前拖拽状态：type = create | move | resize
      drag: null,
      linkIndex: -1,
      splitRows: 2,
      splitCols: 2,
      stageHeight: 0,
    };
  },
  computed: {
    /** 图片太矮时给列表留个最低高度，不然只剩一两行没法看 */
    sideMaxHeight() {
      return Math.max(this.stageHeight || 0, 280) + 'px';
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.zones = JSON.parse(JSON.stringify(val || []));
        this.activeIndex = this.zones.length ? 0 : -1;
      },
    },
  },
  mounted() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  },
  methods: {
    zoneStyle(zone) {
      return {
        left: zone.leftPer * 100 + '%',
        top: zone.topPer * 100 + '%',
        width: zone.widthPer * 100 + '%',
        height: zone.heightPer * 100 + '%',
      };
    },
    onImgLoad() {
      // 热区靠百分比自适应，这里只需要记下画布高度，用来跟右侧列表对齐
      this.$nextTick(() => {
        if (this.$refs.stage) this.stageHeight = this.$refs.stage.getBoundingClientRect().height;
      });
    },
    stageRect() {
      return this.$refs.stage.getBoundingClientRect();
    },
    /** 鼠标位置 → 图片内百分比坐标 */
    toPer(e) {
      const rect = this.stageRect();
      return {
        x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
        y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
      };
    },
    /** 先记录按下位置，真正拖动超过阈值后才创建，避免单击不断累积热区 */
    onStageDown(e) {
      if (e.button !== 0) return;
      const start = this.toPer(e);
      this.drag = {
        type: 'create',
        start,
        startClientX: e.clientX,
        startClientY: e.clientY,
        index: -1,
        previousActiveIndex: this.activeIndex,
      };
    },
    onZoneDown(e, index) {
      this.activeIndex = index;
      const zone = this.zones[index];
      const point = this.toPer(e);
      this.drag = {
        type: 'move',
        index,
        offsetX: point.x - zone.leftPer,
        offsetY: point.y - zone.topPer,
      };
    },
    onResizeDown(e, index) {
      this.activeIndex = index;
      this.drag = { type: 'resize', index };
    },
    onMouseMove(e) {
      if (!this.drag) return;
      const point = this.toPer(e);

      if (this.drag.type === 'create') {
        const { start, startClientX, startClientY } = this.drag;
        if (this.drag.index === -1) {
          const distance = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);
          if (distance < CREATE_THRESHOLD_PX) return;
          this.zones.push({
            leftPer: start.x,
            topPer: start.y,
            widthPer: 0,
            heightPer: 0,
            url: '',
            urlName: '',
            urlType: '',
          });
          this.drag.index = this.zones.length - 1;
          this.activeIndex = this.drag.index;
        }
        const zone = this.zones[this.drag.index];
        this.$set(zone, 'leftPer', Math.min(start.x, point.x));
        this.$set(zone, 'topPer', Math.min(start.y, point.y));
        this.$set(zone, 'widthPer', Math.abs(point.x - start.x));
        this.$set(zone, 'heightPer', Math.abs(point.y - start.y));
        return;
      }

      const zone = this.zones[this.drag.index];
      if (!zone) return;

      if (this.drag.type === 'move') {
        this.$set(zone, 'leftPer', clamp(point.x - this.drag.offsetX, 0, 1 - zone.widthPer));
        this.$set(zone, 'topPer', clamp(point.y - this.drag.offsetY, 0, 1 - zone.heightPer));
      } else if (this.drag.type === 'resize') {
        this.$set(zone, 'widthPer', clamp(point.x - zone.leftPer, MIN_PER, 1 - zone.leftPer));
        this.$set(zone, 'heightPer', clamp(point.y - zone.topPer, MIN_PER, 1 - zone.topPer));
      }
    },
    onMouseUp() {
      if (!this.drag) return;
      if (this.drag.type === 'create') {
        const zone = this.zones[this.drag.index];
        if (!zone) {
          this.activeIndex = this.drag.previousActiveIndex;
        } else if (zone.widthPer < MIN_PER || zone.heightPer < MIN_PER) {
          this.zones.splice(this.drag.index, 1);
          this.activeIndex = this.drag.previousActiveIndex;
          this.$message.warning('请按住鼠标拖出一个有效大小的热区');
        }
      }
      this.drag = null;
    },
    addZone() {
      this.zones.push({
        leftPer: 0.1,
        topPer: 0.1,
        widthPer: 0.3,
        heightPer: 0.2,
        url: '',
        urlName: '',
        urlType: '',
      });
      this.activeIndex = this.zones.length - 1;
    },
    /**
     * 按行列把整张图均分成热区。
     * 已设好的链接按「从上到下、从左到右」的顺序尽量续用，避免重新分割后要把链接全配一遍。
     */
    splitGrid() {
      const rows = Number(this.splitRows) || 1;
      const cols = Number(this.splitCols) || 1;
      const old = this.sortedZones();
      const next = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const prev = old[next.length] || {};
          next.push({
            leftPer: c / cols,
            topPer: r / rows,
            widthPer: 1 / cols,
            heightPer: 1 / rows,
            url: prev.url || '',
            urlName: prev.urlName || '',
            urlType: prev.urlType || '',
          });
        }
      }
      this.zones = next;
      this.activeIndex = 0;
    },
    /** 从上到下、从左到右；同一行内（相差不到半格高）算同一排 */
    sortedZones() {
      return this.zones.slice().sort((a, b) => {
        const rowGap = Math.min(a.heightPer, b.heightPer) / 2;
        if (Math.abs(a.topPer - b.topPer) > rowGap) return a.topPer - b.topPer;
        return a.leftPer - b.leftPer;
      });
    },
    sortZones() {
      this.zones = this.sortedZones();
      this.activeIndex = this.zones.length ? 0 : -1;
    },
    clearZones() {
      this.zones = [];
      this.activeIndex = -1;
    },
    removeZone(index) {
      this.zones.splice(index, 1);
      this.activeIndex = Math.min(this.activeIndex, this.zones.length - 1);
    },
    pickLink(index) {
      this.linkIndex = index;
      this.$refs.linkPicker.open();
    },
    onLinkPicked(urlInfo) {
      const zone = this.zones[this.linkIndex];
      if (!zone) return;
      this.$set(zone, 'urlName', getOtherUrlName(urlInfo.open_type) || urlInfo.title);
      this.$set(zone, 'url', urlInfo.params);
      this.$set(zone, 'urlType', urlInfo.open_type);
    },
    replaceImage() {
      this.$emit('replace-image');
    },
    handleSave() {
      this.$emit('save', JSON.parse(JSON.stringify(this.zones)));
    },
  },
};
</script>

<style scoped lang="scss">
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.tips {
  flex: 1;
  font-size: 12px;
  color: #909399;
}
.editor-body {
  display: flex;
  gap: 16px;
  // 不能让右侧列表把 stage 拉高：热区坐标是按 stage 尺寸算百分比的，
  // stage 一旦高于图片，图片下方的空白也会变成可点区域，热区位置就全错位了
  align-items: flex-start;
}
.stage {
  position: relative;
  flex: 1;
  min-width: 0;
  align-self: flex-start;
  user-select: none;
  cursor: crosshair;
  background: #f5f7fa;
  font-size: 0;
}
.stage-img {
  display: block;
  width: 100%;
}
.zone {
  position: absolute;
  border: 1px solid #409eff;
  background: rgba(64, 158, 255, 0.25);
  cursor: move;
  font-size: 12px;
  color: #fff;
  overflow: hidden;
  &.active {
    border-color: #f56c6c;
    background: rgba(245, 108, 108, 0.28);
  }
}
.zone-name {
  position: absolute;
  left: 2px;
  top: 2px;
  background: rgba(0, 0, 0, 0.45);
  padding: 0 3px;
  border-radius: 2px;
  white-space: nowrap;
}
.zone-del {
  position: absolute;
  right: 2px;
  top: 2px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  padding: 1px;
}
.zone-resize {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #409eff;
  cursor: nwse-resize;
}
.side {
  width: 240px;
  flex: none;
  overflow-y: auto;
}
.side-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 8px;
}
.side-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  // 默认宽度会被上下箭头挤掉数字，看着像空的
  ::v-deep .el-input-number--mini {
    width: 78px;
  }
}
.tool-label {
  flex: none;
}
.tool-x {
  flex: none;
  color: #909399;
}
.side-empty {
  font-size: 12px;
  color: #c0c4cc;
  padding: 20px 0;
  text-align: center;
}
.side-item {
  border: 1px solid #ebeef5;
  border-radius: 3px;
  padding: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  &.active {
    border-color: #409eff;
  }
}
.side-item-title {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}
.side-item-del {
  color: #f56c6c;
}
.footer {
  margin-top: 16px;
  text-align: right;
}
</style>
