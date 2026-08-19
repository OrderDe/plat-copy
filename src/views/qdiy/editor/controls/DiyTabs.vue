<template>
  <DiyStyleContain :title="title">
    <div class="tabs-radios">
      <el-radio-group v-model="radioType" class="radio-group" @change="radioChange">
        <el-radio-button v-for="(item, index) in list" :key="index" class="radio-btn" :label="item.value">
          <span v-if="radioText === 'text'">{{ item[name] }}</span>
          <el-image v-else-if="radioText === 'image'" class="tabs-img" :style="imgStyle" :src="item[name]" />
          <slot v-else name="icons" :item="item" />
        </el-radio-button>
      </el-radio-group>

      <!-- 选中项标记了 is_show 时，额外提供描边颜色配置 -->
      <div v-if="current.is_show" class="tabs-stroke">
        <span class="stroke-title">描边颜色</span>
        <div class="stroke-picker">
          <el-color-picker v-model="current.color" :show-alpha="showAlpha" @change="colorChange" />
          <el-input v-model="current.color" class="stroke-ipt" size="mini" placeholder="选择颜色" @focus="onFocus" />
        </div>
      </div>
    </div>
  </DiyStyleContain>
</template>

<script>
/**
 * 样式切换控件 —— 单选按钮组，可显示文字/图片/自定义图标
 * 迁移自 PHP diy-tabs.php
 *
 * change 事件抛出 { item, index }
 */
import DiyStyleContain from './DiyStyleContain';
import { iptSelect } from './utils';

export default {
  name: 'DiyTabs',
  components: { DiyStyleContain },
  props: {
    title: {
      type: String,
      default: '样式',
    },
    // text: 文字，image: 图片，其余走 icons 插槽
    radioText: {
      type: String,
      default: '',
    },
    // 用来替换 list 的 label 属性名
    name: {
      type: String,
      default: 'label',
    },
    list: {
      type: Array,
      default: () => [
        { label: '默认', value: 'default', is_show: false, color: '#DDDDDD' },
        { label: '投影', value: 'shandow', is_show: false, color: '#DDDDDD' },
        { label: '描边', value: 'border', is_show: true, color: '#DDDDDD' },
      ],
    },
    defaultItem: {
      type: Object,
      default: null,
    },
    showAlpha: {
      type: Boolean,
      default: false,
    },
    imgStyle: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      radioType: '',
      current: {},
    };
  },
  mounted() {
    this.tabInit();
  },
  methods: {
    tabInit() {
      this.current = this.defaultItem || this.list[0] || {};
      this.radioType = this.current.value;
    },
    onChange(data) {
      this.$emit('change', data);
    },
    radioChange(e) {
      const index = this.list.findIndex((it) => it.value === e);
      this.radioType = e;
      this.current = this.list[index] || {};
      this.onChange({ item: this.current, index });
    },
    colorChange() {
      const index = this.list.findIndex((it) => it.value === this.current.value);
      this.onChange({ item: this.current, index });
    },
    onFocus: iptSelect,
  },
};
</script>

<style scoped lang="scss">
.radio-group {
  display: flex;
  width: 100%;
}
.radio-btn {
  flex: 1;
  ::v-deep .el-radio-button__inner {
    display: block;
    width: 100%;
  }
}
.tabs-img {
  width: 30px;
  height: 25px;
}
.tabs-stroke {
  height: 54px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(112, 112, 112, 0.2);
  padding: 0 10px;
  margin-top: 10px;
}
.stroke-title {
  font-size: 14px;
  color: #999;
  font-weight: 700;
  padding-right: 27px;
}
.stroke-picker {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: space-between;
  ::v-deep .el-color-picker__trigger {
    width: 64px;
    height: 30px;
  }
  ::v-deep .el-color-picker__icon,
  ::v-deep .el-color-picker__empty {
    display: none;
  }
}
.stroke-ipt {
  width: 90px;
}
</style>
