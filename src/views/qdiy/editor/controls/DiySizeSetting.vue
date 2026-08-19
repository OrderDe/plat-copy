<template>
  <DiyStyleContain :title="topName" :show-title="containObj.showTitle">
    <div v-for="(item, index) in newSizeInfos" v-show="!item.hidden" :key="index" class="size-info">
      <div class="diy-name">{{ item.name }}</div>
      <div class="sel-size">
        <el-slider v-model="item.value" :min="minValue" :max="item.maxValue" :disabled="item.disabled" @change="updateSize" />
      </div>
      <div class="diy-text-btn">{{ item.value + item.unit }}</div>
    </div>
  </DiyStyleContain>
</template>

<script>
/**
 * 尺寸/边距设置控件 —— 一组滑块
 * 迁移自 PHP diy-size-setting.php
 *
 * sizeInfos 可以是字符串数组（只给名字），也可以是对象数组：
 *   { name: '上边距', value: 0, unit: 'px', disabled: false, maxValue: 50, hidden: false }
 */
import DiyStyleContain from './DiyStyleContain';

export default {
  name: 'DiySizeSetting',
  components: { DiyStyleContain },
  props: {
    containObj: {
      type: Object,
      default: () => ({ showTitle: true }),
    },
    topName: {
      type: String,
      default: '大小设置',
    },
    minValue: {
      type: [String, Number],
      default: 0,
    },
    maxValue: {
      type: [String, Number],
      default: 100,
    },
    defUnit: {
      type: String,
      default: 'px',
    },
    // 需要禁用的项下标
    disabledArr: {
      type: Array,
      default: () => [],
    },
    // sizeInfos 为字符串数组时，按下标指定最大值，优先级高于 maxValue
    strMaxSizeVal: {
      type: Array,
      default: () => [],
    },
    sizeInfos: {
      type: Array,
      default: () => [],
    },
    // sizeInfos 为字符串数组时，按下标给初始值
    sizeInfosValue: {
      type: Array,
      default: () => [],
    },
    sizeInfosMax: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      newSizeInfos: [],
    };
  },
  watch: {
    sizeInfos: {
      deep: true,
      immediate: true,
      handler(val) {
        if (val.length > 0 && typeof val[0] === 'string') {
          this.newSizeInfos = val.map((v, index) => {
            let max = this.sizeInfosMax.length > 0 && this.sizeInfosMax[index] ? this.sizeInfosMax[index] : this.maxValue;
            if (this.strMaxSizeVal.length > 0 && this.strMaxSizeVal[index]) {
              max = this.strMaxSizeVal[index];
            }
            return {
              name: v,
              value:
                this.sizeInfosValue.length > 0 && this.sizeInfosValue[index] ? this.sizeInfosValue[index] : this.minValue,
              unit: this.defUnit,
              disabled: this.disabledArr.indexOf(index) !== -1,
              maxValue: max,
              hidden: false,
            };
          });
          this.updateSize();
        } else {
          this.newSizeInfos = val;
        }
      },
    },
  },
  methods: {
    updateSize() {
      this.$emit('change', this.newSizeInfos);
    },
  },
};
</script>

<style scoped lang="scss">
.size-info {
  margin-top: 20px;
  font-size: 14px;
  font-weight: bold;
  color: #999;
  display: flex;
  align-items: center;
}
.diy-name {
  width: 70px;
  flex-shrink: 0;
}
.sel-size {
  flex: 1;
  margin-right: 12px;
  height: 30px;
}
.diy-text-btn {
  width: 50px;
  text-align: center;
}
</style>
