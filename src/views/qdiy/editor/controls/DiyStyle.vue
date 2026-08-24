<template>
  <DiyStyleContain class="diy-style" :title="topName">
    <div class="diy-style-exhibit">
      <div v-if="layoutOf(currentItem)" class="exhibit-img" :style="{ ...imgStyle }">
        <div class="layout-thumb" :style="gridStyle(currentItem)">
          <span v-for="(cell, i) in layoutOf(currentItem).info" :key="i" :style="cellStyle(cell)" />
          <span v-if="!layoutOf(currentItem).info.length" class="layout-free">自由布局</span>
        </div>
      </div>
      <el-image v-else-if="currentImg" class="exhibit-img" :style="{ ...imgStyle }" :src="currentImg" fit="fill" />
      <div class="diy-update-style" @click="stylePop = true">修改风格</div>
    </div>

    <el-dialog :title="topName" :visible.sync="stylePop" width="66%" :modal-append-to-body="false" append-to-body>
      <div class="diy-style-info">
        <div v-for="(item, index) in imgInfo" :key="index" :style="{ width: 100 / count + '%' }">
          <div class="diy-style-img" :class="{ 'diy-style-sel-img': index === selIndex }" @click="selIndex = index">
            <!-- 有布局数据的（比如魔方）直接按网格画出来，不依赖示意图资源 -->
            <div v-if="layoutOf(item)" class="layout-thumb" :style="gridStyle(item)">
              <span v-for="(cell, i) in layoutOf(item).info" :key="i" :style="cellStyle(cell)" />
              <span v-if="!layoutOf(item).info.length" class="layout-free">自由布局</span>
            </div>
            <el-image v-else :style="{ height: imgStyle.height }" style="width: 100%" :src="imgUrl + item.img" fit="fill" />
            <i v-show="index === selIndex" class="el-icon-success diy-style-icon" />
          </div>
          <div class="diy-style-text">{{ item.text }}</div>
          <div v-if="item.desc" class="diy-style-text">{{ item.desc }}</div>
        </div>
      </div>
      <div class="diy-style-bottom">
        <el-button size="mini" plain @click="stylePop = false">取消</el-button>
        <el-button size="mini" type="primary" @click="saveStyle">确定</el-button>
      </div>
    </el-dialog>
  </DiyStyleContain>
</template>

<script>
/**
 * 风格选择控件 —— 弹窗里挑一个样式图
 * 迁移自 PHP diy-style.php
 *
 * imgUrl 原默认值是 PHP 项目的 `resources/img/decorate/`，Java 平台端没有这批示意图，
 * 使用方需按实际情况传入前缀；缺图时 el-image 会显示占位，不影响选择逻辑。
 *
 * change 事件参数 (selIndex, item)，对应原实现的 chang 事件。
 */
import DiyStyleContain from './DiyStyleContain';

export default {
  name: 'DiyStyle',
  components: { DiyStyleContain },
  props: {
    topName: {
      type: String,
      default: '选择风格',
    },
    imgStyle: {
      type: Object,
      default: () => ({ width: '206px', height: 'auto' }),
    },
    // 弹窗里每行几个
    count: {
      type: [String, Number],
      default: 4,
    },
    imgUrl: {
      type: String,
      default: '',
    },
    defIndex: {
      type: Number,
      default: 0,
    },
    // [{ img: '', text: '', desc: '' }]
    imgInfo: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      stylePop: false,
      selIndex: 0,
    };
  },
  computed: {
    currentItem() {
      return this.imgInfo[this.selIndex] || null;
    },
    currentImg() {
      return this.currentItem ? this.imgUrl + this.currentItem.img : '';
    },
  },
  created() {
    this.selIndex = this.defIndex;
  },
  methods: {
    /**
     * 带网格布局数据的风格项（目前是图片魔方）直接画示意图。
     * 原实现依赖 PHP 的 resources/img/decorate/ 示意图，平台端没有这批资源，
     * 与其补一堆静态图，不如按数据把布局画出来，还能永远和实际布局一致。
     */
    layoutOf(item) {
      const data = item && item.data;
      return data && data.density && Array.isArray(data.info) ? data : null;
    },
    gridStyle(item) {
      const layout = this.layoutOf(item);
      if (!layout) return {};
      const n = parseInt(layout.density, 10) || 4;
      return {
        gridTemplateColumns: `repeat(${n}, 1fr)`,
        gridTemplateRows: `repeat(${n}, 1fr)`,
      };
    },
    // start/end 是 1 基的网格坐标，且 end 那一格本身也占用
    cellStyle(cell) {
      return {
        gridColumn: `${cell.start.x} / ${Number(cell.end.x) + 1}`,
        gridRow: `${cell.start.y} / ${Number(cell.end.y) + 1}`,
      };
    },
    saveStyle() {
      this.$emit('change', this.selIndex, this.imgInfo[this.selIndex]);
      this.stylePop = false;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-style-exhibit {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f3f7;
  height: 184px;
  position: relative;
}
.diy-update-style {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 35px;
  line-height: 35px;
  text-align: center;
  background: rgba(102, 102, 102, 0.72);
  font-weight: bold;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
}
.diy-style-info {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
}
.diy-style-img {
  background: #f7f8fa;
  border: 1px solid #ededed;
  width: 95%;
  position: relative;
  font-size: 0;
  cursor: pointer;
}
.layout-thumb {
  display: grid;
  gap: 3px;
  width: 100%;
  height: 100%;
  min-height: 96px;
  padding: 3px;
  background: #fff;
  box-sizing: border-box;
  span {
    background: #dcecfd;
    border: 1px solid #a3cdf7;
    border-radius: 2px;
  }
}
.layout-free {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
  background: #f7f8fa !important;
  border: 1px dashed #dcdfe6 !important;
}
.diy-style-sel-img {
  border: 1px solid #3892f1;
}
.diy-style-icon {
  position: absolute;
  font-size: 16px;
  bottom: -8px;
  right: -8px;
  background: #fff;
  border-radius: 50%;
  color: #2d8cf0;
}
.diy-style-text {
  width: 95%;
  text-align: center;
  margin: 10px 0;
}
.diy-style-bottom {
  border-top: 1px solid #f2f2f2;
  padding: 10px 20px;
  text-align: end;
}
</style>
