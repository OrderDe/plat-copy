<template>
  <div class="pick-goods">
    <div class="add-goods-btn" @click="openPicker">
      <slot>
        <i class="el-icon-plus" />
        <span>{{ title || '选择商品' }}</span>
      </slot>
    </div>

    <div v-if="pickImgList.length" class="pick-list">
      <div
        v-for="(item, index) in pickImgList"
        :key="index"
        class="pick-item"
        @mouseenter="pickIndex = index"
        @mouseleave="pickIndex = -1"
      >
        <el-image style="width: 50px; height: 50px" :src="imgOf(item)" fit="contain" />
        <el-popover v-if="index === pickIndex || item.visible" v-model="item.visible" placement="bottom">
          <p class="diy-del-text">确定删除吗？</p>
          <div class="popover-btns">
            <el-button class="diy-del-btn" size="mini" plain @click="delModel(index)">删除</el-button>
            <el-button size="mini" plain @click="item.visible = false">取消</el-button>
          </div>
          <i slot="reference" class="el-icon-close" />
        </el-popover>
      </div>
    </div>

    <!-- 原 PHP 用的是 com-pick-link 弹窗，Java 平台端对应组件是 @/components/goodList -->
    <el-dialog title="选择商品" :visible.sync="pickerVisible" width="960px" append-to-body :close-on-click-modal="false">
      <goodList v-if="pickerVisible" :handle-num="multiple ? 'many' : ''" :checked="selectList" @getStoreItem="onPicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 商品选择控件 —— 维护已选商品列表，支持上限与去重
 * 迁移自 PHP diy-goods-group.php
 *
 * change 事件参数与原实现保持一致：(list, index, action)
 *   action = 'add' 时 list 为本次新增项，'del' 时 list 为删除后的完整列表。
 */
import goodList from '@/components/goodList';

export default {
  name: 'DiyGoodsGroup',
  components: { goodList },
  props: {
    // 最大数量，-1 表示不限制
    maxLength: {
      type: [String, Number],
      default: -1,
    },
    multiple: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: '',
    },
    // 已选商品列表，元素形如 { params: { id, img } }
    list: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      pickIndex: -1,
      pickerVisible: false,
      pickImgList: [],
      selectList: [],
    };
  },
  watch: {
    list: {
      immediate: true,
      handler(val) {
        this.pickImgList = [...(val || [])];
        this.setDefaultSelectIds();
      },
    },
  },
  methods: {
    imgOf(item) {
      return (item.params && item.params.img) || item.image || '';
    },
    openPicker() {
      this.pickerVisible = true;
    },
    // goodList 单选时回传对象，多选时回传数组，这里统一成数组
    onPicked(res) {
      const rows = Array.isArray(res) ? res : [res];
      const normalized = rows
        .filter((e) => e)
        .map((e) => ({
          params: { id: e.id, img: e.image },
          visible: false,
        }));
      // 去掉已选过的
      const added = normalized.filter((e) => !this.selectList.includes(e.params.id));

      const max = Number(this.maxLength);
      if (max !== -1 && this.pickImgList.length + added.length > max) {
        this.$message.warning(`最多添加 ${max} 件商品噢`);
        return;
      }

      this.pickImgList.push(...added);
      this.pickerVisible = false;
      this.$emit('change', added, -1, 'add');
      this.setDefaultSelectIds();
    },
    setDefaultSelectIds() {
      const ids = this.pickImgList.map((item) => item.params && item.params.id);
      this.selectList = ids.filter((item, index) => ids.indexOf(item) === index);
    },
    delModel(index) {
      this.pickImgList.splice(index, 1);
      this.$emit('change', this.pickImgList, index, 'del');
      this.setDefaultSelectIds();
    },
  },
};
</script>

<style scoped lang="scss">
.add-goods-btn {
  border: 1px dashed #6b7685;
  line-height: 32px;
  height: 32px;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  color: #6b7685;
  font-size: 13px;
}
.pick-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 20px;
}
.pick-item {
  position: relative;
  width: 50px;
  height: 50px;
  margin: 0 9px 9px 0;
  background-color: #ddd;
  cursor: pointer;
  .el-icon-close {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 12px;
    color: #999;
  }
}
.popover-btns {
  display: flex;
  align-items: center;
}
.diy-del-text {
  margin-bottom: 8px;
}
</style>
