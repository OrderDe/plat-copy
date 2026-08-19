<template>
  <div>
    <div v-for="(item, index) in value" :key="index" class="diy-operation-item">
      <div :style="gutterStyle">
        <!-- 具名插槽：item.slot 指定时，整行交给使用方渲染 -->
        <div v-if="item.slot">
          <slot :name="item.slot" :item="item" :index="index" />
        </div>

        <!-- 多行文本 -->
        <div v-else-if="item.type === 'textarea'" class="item-row">
          <div v-if="item.isShowLabel !== false" class="diy-operation-name" :style="labelStyle(item)">{{ item.label }}</div>
          <el-input
            v-model="item.value"
            class="flex-1"
            type="textarea"
            :placeholder="item.placeholder"
            :maxlength="item.max"
            :show-word-limit="item.showLimit"
            @input="onChange"
          />
        </div>

        <!-- 单行文本 -->
        <div v-else-if="item.type === 'input'" class="item-row diy-operation-input">
          <div v-if="item.isShowLabel !== false" class="diy-operation-name" :style="labelStyle(item)">{{ item.label }}</div>
          <el-input
            v-model="item.value"
            class="diy-input"
            :placeholder="item.placeholder"
            :maxlength="item.max"
            :show-word-limit="item.showLimit"
            @input="onChange"
          />
        </div>

        <!-- 颜色 -->
        <div v-else-if="item.type === 'color'" class="item-row diy-operation-color">
          <div v-if="item.isShowLabel !== false" class="diy-operation-name" :style="labelStyle(item)">{{ item.label }}</div>
          <el-color-picker
            v-model="item.value"
            :color-format="colorFormat"
            :show-alpha="item.showAlpha"
            :predefine="item.predefineColors || []"
            @change="onChange"
          />
          <el-input v-model="item.value" class="diy-color-input" maxlength="10" @input="onChange" />
        </div>

        <!-- 尺寸滑块 -->
        <div v-else-if="item.type === 'size'" class="item-row diy-operation-size">
          <div v-if="item.isShowLabel !== false" class="diy-operation-name" :style="labelStyle(item)">{{ item.label }}</div>
          <div class="slider-wrap">
            <el-slider
              v-model="item.value"
              :min="getRange(item, 'minValue')"
              :max="getRange(item, 'maxValue')"
              :disabled="item.disabled"
              @change="onChange"
            />
          </div>
          <div class="diy-text-btn">{{ getSizeText(item) }}</div>
        </div>

        <!-- 单选 -->
        <div v-else-if="item.type === 'radio'" class="item-row diy-operation-radio">
          <div v-if="item.isShowLabel !== false" class="diy-operation-name" :style="labelStyle(item)">{{ item.label }}</div>
          <el-radio-group v-model="item.value" class="flex-1" @change="onChange">
            <el-radio v-for="(childItem, j) in item.list" :key="j" :label="childItem.label">{{ childItem.value }}</el-radio>
          </el-radio-group>
        </div>

        <!-- 多选 -->
        <div v-else-if="item.type === 'checkbox'" class="item-row diy-operation-checkbox">
          <div v-if="item.isShowLabel !== false" class="diy-operation-name" :style="labelStyle(item)">{{ item.label }}</div>
          <el-checkbox-group v-model="item.value" class="flex-1" @change="onChange">
            <el-checkbox v-for="(childItem, j) in item.list" :key="j" :label="childItem.label">
              {{ childItem.value }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 单图上传 -->
        <div v-else-if="item.type === 'image'" class="diy-operation-image">
          <div v-if="item.isShowLabel !== false" class="diy-operation-name" :style="labelStyle(item)">{{ item.label }}</div>
          <div>
            <div v-if="!item.value" class="card-upload" :style="imgBoxStyle" @click="openPicker(item)">
              <i class="el-icon-plus" />
            </div>
            <div
              v-else
              class="diy-sty-img"
              :style="imgBoxStyle"
              @mouseover="mouseOverImg(item)"
              @mouseleave="mouseLeaveImg(item)"
              @click="openPicker(item)"
            >
              <el-image :style="imgBoxStyle" :src="item.value" />
              <div v-show="item.showIcon" class="diy-upd-img">替换</div>
              <i v-show="item.showIcon" class="el-icon-close diy-upd-icon" @click.stop="delImg(item)" />
            </div>
            <slot name="tips" />
          </div>
        </div>
      </div>
    </div>

    <!-- 原实现用的是 com-attachment，Java 平台端对应组件是 base/uploadPicture -->
    <el-dialog title="选择图片" :visible.sync="pickerVisible" width="960px" append-to-body :close-on-click-modal="false">
      <uploadPictures v-if="pickerVisible" :multiple="false" @getImage="onPicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 通用属性行渲染器 —— P6 组件的属性面板主力控件
 * 迁移自 PHP diy-operation-list.php
 *
 * value 是一个配置数组，每项形如：
 *   { type: 'color'|'input'|'textarea'|'size'|'radio'|'checkbox'|'image', label, value, ... }
 *   带 slot 字段时整行走同名具名插槽。
 * 任一项变更后通过 on-change 事件抛出整个数组的深拷贝。
 */
import uploadPictures from '@/components/base/uploadPicture';
import { deepClone } from './utils';

export default {
  name: 'DiyOperationList',
  components: { uploadPictures },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    labelWidth: {
      type: [String, Number],
      default: 70,
    },
    labelAlign: {
      type: String,
      default: 'end',
    },
    minValue: {
      type: [String, Number],
      default: 0,
    },
    maxValue: {
      type: [String, Number],
      default: 100,
    },
    gutter: {
      type: [String, Number],
      default: 0,
    },
    colorFormat: {
      type: String,
      default: 'hex',
    },
  },
  data() {
    return {
      pickerVisible: false,
      // 当前正在选图的那一项
      pickingItem: null,
    };
  },
  computed: {
    imgBoxStyle() {
      return { width: '60px', height: '60px' };
    },
    gutterStyle() {
      return { margin: `${this.gutter}px 0` };
    },
  },
  methods: {
    onChange() {
      this.$nextTick(() => {
        this.$emit('on-change', deepClone(this.value));
      });
    },
    getSizeText(item) {
      return `${item.value}${item.unit ? item.unit : 'px'}`;
    },
    // 单项没配 minValue/maxValue 时回落到组件级的默认值
    getRange(item, type) {
      return item[type] !== undefined && item[type] !== null ? item[type] : this[type];
    },
    openPicker(item) {
      this.pickingItem = item;
      this.pickerVisible = true;
    },
    onPicked(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url && this.pickingItem) {
        this.$set(this.pickingItem, 'value', url);
        this.onChange();
      }
      this.pickerVisible = false;
    },
    mouseOverImg(item) {
      this.$set(item, 'showIcon', true);
    },
    mouseLeaveImg(item) {
      this.$set(item, 'showIcon', false);
    },
    delImg(item) {
      this.$set(item, 'value', '');
      this.onChange();
    },
    labelStyle(item) {
      return {
        width: `${item.labelWidth ? item.labelWidth : this.labelWidth}px`,
        'text-align': item.labelAlign ? item.labelAlign : this.labelAlign,
      };
    },
  },
};
</script>

<style scoped lang="scss">
.item-row {
  min-height: 40px;
  display: flex;
  align-items: center;
}
.diy-operation-image {
  display: flex;
  align-items: center;
}
.diy-operation-name {
  margin-right: 15px;
  text-align: end;
  color: #999;
  flex-shrink: 0;
}
.flex-1 {
  flex: 1;
}
.diy-operation-input .diy-input {
  flex: 1;
}
.diy-color-input {
  width: 74px;
  margin-left: 15px;
  ::v-deep .el-input__inner {
    height: 28px;
    line-height: 28px;
    padding: 0 6px;
    background: #f4f3f7;
    text-align: center;
    color: #666;
  }
}
.slider-wrap {
  flex: 1;
  padding-left: 2px;
  margin-right: 15px;
}
.diy-text-btn {
  width: 44px;
  text-align: center;
  color: #666;
}
.card-upload {
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c0c4cc;
}
.diy-sty-img {
  position: relative;
  cursor: pointer;
  .diy-upd-img {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 20px;
    line-height: 20px;
    text-align: center;
    font-size: 12px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
  }
  .diy-upd-icon {
    position: absolute;
    top: 0;
    right: 0;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    font-size: 12px;
  }
}
</style>
