<template>
  <div class="diy-rubik-cube">
    <div class="decorate-cube">
      <ul v-for="(n, nIndex) in densityNum" :key="nIndex" class="cube-col">
        <li
          v-for="(i, iIndex) in densityNum"
          :key="iIndex + 100"
          class="cube-item"
          :class="{ 'item-selecting': isSelecting(n, i), 'item-selected': isSelected(n, i) }"
          :style="{ width: cubeCellWidth + 'px', height: cubeCellHeight + 'px' }"
          :data-x="n"
          :data-y="i"
          @click="onClickCubeItem"
          @mouseenter="onEnterCubeItem"
        >
          <i class="el-icon-plus" :style="{ lineHeight: cubeCellHeight + 'px' }" />
        </li>
      </ul>

      <div
        v-for="(item, index) in selectedList"
        :key="index + 100"
        class="cube-selected"
        :class="{ 'click-cube-selected': index === selCubeIndex }"
        :style="{
          width: getSelectedWidth(item) + 'px',
          height: getSelectedHeight(item) + 'px',
          top: getSelectedTop(item) + 'px',
          left: getSelectedLeft(item) + 'px',
        }"
        @click="selCubeInfo(index)"
      >
        <div v-if="!item.img" class="cube-selected-text">
          {{ pixelW(item) }} x {{ pixelH(item) }} 像素
        </div>
        <el-image v-else style="width: 100%; height: 100%" :src="item.img" fit="cover" />
        <div v-show="index === selCubeIndex && styleArr.length === 0" class="cube-del-icon" @click.stop="delCubeList(index)">
          <i class="el-icon-error del-sel-icon" />
        </div>
      </div>
    </div>

    <div :style="{ width: cubeExhibitWidth + 'px', height: cubeExhibitHeight + 'px' }" />

    <DiyImgSetting
      v-show="selCubeIndex !== -1"
      :img-infos="cubeImgInfo"
      :def-img-count="1"
      :suggest-site="99"
      suggest-size-text=""
      :img-contain-style="{ padding: 0, 'margin-top': '20px' }"
      :show-title="false"
      @change="addCubeImg"
    />
  </div>
</template>

<script>
/**
 * 图片魔方控件 —— 在密度网格上框选区域，再给每块区域配图与链接
 * 迁移自 PHP diy-rubik-cube.php
 *
 * 交互沿用原实现：点一次定起点，移动预览，再点一次定终点生成区域；
 * 与已有区域重叠时拒绝并提示。change 事件抛出 selectedList。
 */
import DiyImgSetting from './DiyImgSetting';

export default {
  name: 'DiyRubikCube',
  components: { DiyImgSetting },
  props: {
    // 网格密度
    density: {
      type: [String, Number],
      default: 4,
    },
    cubeWidth: {
      type: [String, Number],
      default: 750,
    },
    cubeHeight: {
      type: [String, Number],
      default: 750,
    },
    cubeExhibitWidth: {
      type: [String, Number],
      default: 320,
    },
    cubeExhibitHeight: {
      type: [String, Number],
      default: 320,
    },
    cubeList: {
      type: Array,
      default: () => [],
    },
    // 预设风格，传入后按预设生成区域
    styleArr: {
      type: Array,
      default: () => [],
    },
    // 装修切回来时用于保留已有数据
    styleBoo: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectingItem: { tempStart: null, tempEnd: null, start: null, end: null },
      selectedList: [],
      selCubeIndex: -1,
      // 已被占用的格子
      addGridArr: [],
      cubeImgInfo: [],
      maxHeight: 0,
    };
  },
  computed: {
    densityNum() {
      return parseInt(this.density, 10);
    },
    cubeCellHeight() {
      return this.cubeExhibitHeight / this.density;
    },
    cubeCellWidth() {
      return this.cubeExhibitWidth / this.density;
    },
  },
  watch: {
    cubeList: {
      deep: true,
      immediate: true,
      handler(val) {
        this.selectedList = val;
        this.addGridArr = [];
        this.selectedList.forEach((v) => {
          this.addGridArr.push(...this.getGridSeat(v.start, v.end));
        });
      },
    },
    styleArr: {
      deep: true,
      immediate: true,
      handler(val, oldV) {
        if (!oldV) return;
        this.addGridArr = [];
        const newList = [];
        val.forEach((v) => {
          const gridData = this.getGridSeat(v.start, v.end);
          let dataObj = { start: v.start, end: v.end, img: '', url: '', originalData: [] };
          // 切回来时复用已有的图片数据
          if (this.selectedList.length > 0 && this.styleBoo) {
            const dataIndex = this.selectedList.findIndex(
              (l) =>
                l.start.x === v.start.x && l.start.y === v.start.y && l.end.x === v.end.x && l.end.y === v.end.y,
            );
            if (dataIndex !== -1) dataObj = this.selectedList[dataIndex];
          }
          this.$set(dataObj, 'style', this.getCubeStyle(v.start, v.end));
          this.addGridArr.push(...gridData);
          newList.push(dataObj);
        });
        this.selCubeIndex = -1;
        this.cubeImgInfo = [];
        this.selectedList = newList;
        this.getCubeMaxHeight();
        this.updateData();
      },
    },
  },
  methods: {
    pixelW(item) {
      return Math.round((this.cubeHeight / this.density) * (parseInt(item.end.x, 10) - parseInt(item.start.x, 10) + 1));
    },
    pixelH(item) {
      return Math.round((this.cubeWidth / this.density) * (parseInt(item.end.y, 10) - parseInt(item.start.y, 10) + 1));
    },
    updateSelecting() {
      const { tempStart, tempEnd } = this.selectingItem;
      this.selectingItem.start = { x: Math.min(tempStart.x, tempEnd.x), y: Math.min(tempStart.y, tempEnd.y) };
      this.selectingItem.end = { x: Math.max(tempStart.x, tempEnd.x), y: Math.max(tempStart.y, tempEnd.y) };
    },
    clearSelecting() {
      this.selectingItem = { tempStart: null, tempEnd: null, start: null, end: null };
    },
    coordFromCubeEvent(event) {
      const el = event.currentTarget;
      return { x: el.getAttribute('data-x'), y: el.getAttribute('data-y') };
    },
    isContain(x, y, item) {
      return item.start.x <= x && x <= item.end.x && item.start.y <= y && y <= item.end.y;
    },
    onClickCubeItem(event) {
      const domclass = event.currentTarget.getAttribute('class');
      if (domclass.indexOf('item-selected') !== -1) return;

      const coord = this.coordFromCubeEvent(event);
      // 第一次点击：定起点
      if (this.selectingItem.tempStart == null) {
        this.selectingItem.tempStart = coord;
        this.selectingItem.tempEnd = coord;
        this.selectingItem.start = coord;
        this.selectingItem.end = coord;
        return;
      }

      this.selectingItem.tempEnd = coord;
      this.updateSelecting();

      const gridData = this.getGridSeat(this.selectingItem.start, this.selectingItem.end);
      if (this.verifyGridExist(this.selectingItem.start, this.selectingItem.end)) return;

      this.addGridArr.push(...gridData);
      this.getCubeMaxHeight();

      const selectedItem = {
        start: this.selectingItem.start,
        end: this.selectingItem.end,
        img: '',
        url: '',
        originalData: [],
      };
      this.$set(selectedItem, 'style', this.getCubeStyle(selectedItem.start, selectedItem.end));
      this.selectedList.push(selectedItem);
      this.selCubeInfo(this.selectedList.length - 1);
      this.clearSelecting();
      this.updateData();
    },
    // type: 1 取格子 2 从已占用中移除
    getGridSeat(start, end, type = 1) {
      const gridData = [];
      for (let i = start.x; i <= end.x; i++) {
        const arr = [];
        for (let j = start.y; j <= end.y; j++) {
          arr.push({ x: i, y: j });
        }
        if (type === 1) {
          gridData.push(...arr);
        } else {
          arr.forEach((val) => {
            const startIndex = this.addGridArr.findIndex((v) => v.x === val.x && v.y === val.y);
            if (startIndex !== -1) this.addGridArr.splice(startIndex, 1);
          });
          this.getCubeMaxHeight();
        }
      }
      return gridData;
    },
    verifyGridExist(start, end) {
      const gridData = this.getGridSeat(start, end);
      const mergeArr = [...this.addGridArr, ...gridData];
      const delRepeatArr = [];
      let repeatCount = 0;
      mergeArr.forEach((a) => {
        const boo = delRepeatArr.every((b) => a.x !== b.x || a.y !== b.y);
        if (boo) {
          delRepeatArr.push(a);
        } else {
          repeatCount++;
        }
      });
      if (repeatCount > 0) {
        this.$message.error('该位置无法选择');
        return true;
      }
      return false;
    },
    getCubeMaxHeight() {
      const size = this.cubeWidth / this.density;
      let maxY = 0;
      for (let i = 1; i <= this.density; i++) {
        const yInfo = this.addGridArr.filter((v) => Number(v.y) === i);
        if (yInfo.length) {
          const y = Number(yInfo[yInfo.length - 1].y);
          if (y > maxY) maxY = y;
        }
      }
      this.maxHeight = maxY * size;
      this.$emit('max', this.maxHeight);
    },
    getCubeStyle(start, end) {
      const infoWidth = Math.round((this.cubeHeight / this.density) * (parseInt(end.x, 10) - parseInt(start.x, 10) + 1));
      const infoHeight = Math.round((this.cubeWidth / this.density) * (parseInt(end.y, 10) - parseInt(start.y, 10) + 1));
      const infoTop = Math.round((this.cubeWidth / this.density) * (start.y - 1));
      const infoLeft = Math.round((this.cubeWidth / this.density) * (start.x - 1));
      return {
        top: `${infoTop / 2}px`,
        left: `${infoLeft / 2}px`,
        width: `${infoWidth / 2}px`,
        height: `${infoHeight / 2}px`,
      };
    },
    onEnterCubeItem(event) {
      if (this.selectingItem.tempStart) {
        this.selectingItem.tempEnd = this.coordFromCubeEvent(event);
        this.updateSelecting();
      }
    },
    isSelecting(x, y) {
      const item = this.selectingItem;
      return item.tempStart ? this.isContain(x, y, item) : false;
    },
    isSelected(x, y) {
      return this.selectedList.some((item) => this.isContain(x, y, item));
    },
    selCubeInfo(index) {
      this.selCubeIndex = index;
      if (this.selectedList[this.selCubeIndex]) {
        this.cubeImgInfo = this.selectedList[this.selCubeIndex].originalData;
      }
    },
    delCubeList(index) {
      this.getGridSeat(this.selectedList[index].start, this.selectedList[index].end, 2);
      this.selectedList.splice(index, 1);
      if (index === this.selCubeIndex) this.selCubeInfo(this.selCubeIndex - 1);
      this.updateData();
    },
    updateData() {
      this.$emit('change', this.selectedList);
    },
    addCubeImg(imgArr) {
      if (this.selCubeIndex !== -1 && imgArr && imgArr.length) {
        this.selectedList[this.selCubeIndex].img = imgArr[0].imgUrl;
        this.selectedList[this.selCubeIndex].url = imgArr[0].url;
        this.selectedList[this.selCubeIndex].originalData = imgArr;
      }
      this.updateData();
    },
    getSelectedWidth(item) {
      return (parseInt(item.end.x, 10) - parseInt(item.start.x, 10) + 1) * this.cubeCellWidth;
    },
    getSelectedHeight(item) {
      return (parseInt(item.end.y, 10) - parseInt(item.start.y, 10) + 1) * this.cubeCellHeight;
    },
    getSelectedTop(item) {
      return (item.start.y - 1) * this.cubeCellHeight;
    },
    getSelectedLeft(item) {
      return (item.start.x - 1) * this.cubeCellWidth;
    },
  },
};
</script>

<style scoped lang="scss">
.diy-rubik-cube {
  display: inline-block;
  width: 100%;
}
.decorate-cube {
  position: relative;
}
.cube-col {
  float: left;
  list-style: none;
  padding: 0;
  margin: 0;
}
.cube-item {
  background: #fff;
  border-left: 1px solid #b7b7b7;
  border-bottom: 1px solid #b7b7b7;
  border-right: 1px solid #b7b7b7;
  cursor: pointer;
  text-align: center;
  box-sizing: border-box;
  color: #b7b7b7;
  &:first-child {
    border-top: 1px solid #b7b7b7;
  }
  &.item-selecting {
    background: #e0edff;
  }
  &.item-selected {
    background: #e0edff;
    visibility: hidden;
  }
}
.cube-selected {
  position: absolute;
  background-color: #e8f7fd;
  border: 1px solid #bdf;
  text-align: center;
  color: #88c4dc;
  cursor: pointer;
  box-sizing: border-box;
}
.click-cube-selected {
  border: 1px solid #38f;
}
.cube-selected-text {
  font-size: 12px;
  width: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
}
.cube-del-icon {
  position: absolute;
  right: -8px;
  top: -8px;
  z-index: 10;
}
.del-sel-icon {
  font-size: 19px;
  color: #666;
  background: #fff;
  border-radius: 50%;
}
</style>
