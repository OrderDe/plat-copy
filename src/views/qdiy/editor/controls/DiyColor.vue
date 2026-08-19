<template>
  <DiyStyleContain :title="topName" :show-title="containObj.showTitle" :contain-style="containStyle">
    <div v-for="(item, index) in newColorInfos" :key="index" class="color-info">
      <div class="diy-name">{{ item.name }}</div>
      <div class="sel-color">
        <el-color-picker
          v-model="item.color"
          :color-format="colorFormat"
          :show-alpha="item.showAlpha"
          @change="updateColor"
        />
      </div>
      <el-input v-model="item.value" class="diy-text-btn" @input="updateInput($event, index)" @focus="focus" />
    </div>
  </DiyStyleContain>
</template>

<script>
/**
 * 颜色选择控件 —— 支持一次配置多个颜色项
 * 迁移自 PHP diy-color.php
 *
 * colorInfos 可以是字符串数组（只给名字），也可以是对象数组：
 *   { name: '底部背景', color: '#FFF', showAlpha: false, value: '#FFF' }
 * 变更时通过 change 事件抛出归一化后的对象数组。
 */
import DiyStyleContain from './DiyStyleContain';

export default {
  name: 'DiyColor',
  components: { DiyStyleContain },
  props: {
    containObj: {
      type: Object,
      default: () => ({ showTitle: true }),
    },
    topName: {
      type: String,
      default: '选择颜色',
    },
    showBorderTop: {
      type: Boolean,
      default: true,
    },
    colorFormat: {
      type: String,
      default: 'hex',
    },
    defColor: {
      type: String,
      default: '',
    },
    defShowAlpha: {
      type: Boolean,
      default: false,
    },
    // colorInfos 为字符串数组时，用它按下标给默认颜色
    strColor: {
      type: Array,
      default: () => [],
    },
    colorInfos: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      newColorInfos: [],
    };
  },
  computed: {
    containStyle() {
      const obj = { 'border-top': this.showBorderTop ? '' : 'none' };
      if (!this.showBorderTop) obj['padding-left'] = 0;
      return obj;
    },
  },
  watch: {
    colorInfos: {
      deep: true,
      immediate: true,
      handler(val) {
        if (val.length > 0 && typeof val[0] === 'string') {
          this.newColorInfos = val.map((v, i) => {
            const color = this.strColor.length > 0 && this.strColor[i] ? this.strColor[i] : this.defColor;
            // el-color-picker 不认 transparent，用空串表示
            const normalized = color === 'transparent' ? '' : color;
            return {
              name: v,
              color: normalized,
              showAlpha: this.defShowAlpha,
              value: normalized || 'transparent',
            };
          });
          this.updateColor();
        } else {
          val.forEach((v, i) => {
            val[i].value = v.color === '' || v.color === 'transparent' ? 'transparent' : v.color;
            val[i].color = v.color === 'transparent' ? '' : v.color;
          });
          this.newColorInfos = val;
        }
      },
    },
  },
  methods: {
    updateColor() {
      this.$emit('change', this.newColorInfos);
    },
    focus(event) {
      if (event && event.currentTarget && event.currentTarget.select) event.currentTarget.select();
    },
    updateInput(val, index) {
      let next = val;
      if (!next || next.length === 0) {
        next = 'transparent';
        this.newColorInfos[index].value = next;
      }
      this.newColorInfos[index].color = next === 'transparent' ? '' : next;
      this.updateColor();
    },
  },
};
</script>

<style scoped lang="scss">
.color-info {
  margin-top: 20px;
  font-size: 14px;
  font-weight: bold;
  color: #999;
  display: flex;
  align-items: center;
}
.diy-name {
  flex: 1;
}
.sel-color {
  margin-right: 12px;
  width: 65px;
  height: 30px;
  ::v-deep .el-color-picker__trigger {
    width: 65px;
    height: 30px;
  }
  ::v-deep .el-color-picker__color .el-icon-close {
    display: none;
  }
}
.diy-text-btn {
  width: 100px;
}
</style>
