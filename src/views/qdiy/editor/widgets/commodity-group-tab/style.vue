<template>
  <div class="commodity-group-tab-style">
    <diy-style-contain title="背景设置">
      <diy-operation-list v-model="bgColorSet" @on-change="() => updataList('bgColorSet')" />
    </diy-style-contain>

    <diy-style-contain title="选项卡样式">
      <diy-operation-list v-model="list" @on-change="() => updataList('list')">
        <template v-slot:optionbar="{ item }">
          <div class="item-row">
            <div class="diy-operation-name">{{ item.label }}</div>
            <el-radio-group v-model="item.value" @change="() => updataList('list')">
              <el-radio v-for="(childItem, j) in item.list" :key="j" :label="childItem.label">
                {{ childItem.value }}
              </el-radio>
            </el-radio-group>
          </div>
          <div v-if="item.value == 1" class="active-style">
            <diy-operation-list v-model="tabList" @on-change="() => updataList('tabList')" />
          </div>
        </template>

        <template v-slot:subtitle="{ item }">
          <div class="item-row">
            <div class="diy-operation-name">{{ item.label }}</div>
            <el-radio-group v-model="item.value" @change="() => updataList('list')">
              <el-radio v-for="(childItem, j) in item.list" :key="j" :label="childItem.label">
                {{ childItem.value }}
              </el-radio>
            </el-radio-group>
          </div>
          <div v-if="item.value == 1" class="active-style">
            <diy-operation-list v-model="subtitleList" @on-change="() => updataList('subtitleList')" />
          </div>
        </template>

        <template v-slot:selectback="{ item }">
          <div class="item-row">
            <div class="diy-operation-name">{{ item.label }}</div>
            <el-radio-group v-model="item.value" @change="() => updataList('list')">
              <el-radio v-for="(childItem, j) in item.list" :key="j" :label="childItem.label">
                {{ childItem.value }}
              </el-radio>
            </el-radio-group>
          </div>
          <div v-if="item.value == 1" class="active-style">
            <diy-operation-list v-model="selectBackList" @on-change="() => updataList('selectBackList')" />
          </div>
          <div v-if="item.value == 2" class="active-style">
            <diy-operation-list v-model="selectImgList" @on-change="() => updataList('selectImgList')" />
          </div>
        </template>
      </diy-operation-list>
    </diy-style-contain>

    <diy-style-contain title="选项卡设置">
      <div
        v-for="(item, index) in goodList"
        :key="index"
        class="tab-items"
        :class="{ 'tab-active': activeIndex === index }"
        @click="changeTab(index)"
        @mouseover="selModelIndex = index"
        @mouseleave="selModelIndex = -1"
      >
        <span>{{ (item.data && item.data.title) || '标题' }}</span>
        <el-popover v-if="item.visible || selModelIndex === index" v-model="item.visible" placement="bottom">
          <p class="diy-del-text">确定删除吗？</p>
          <div class="del-btns">
            <el-button class="diy-del-btn" size="mini" plain @click="deleteTab(item, index)">删除</el-button>
            <el-button size="mini" plain @click="item.visible = false">取消</el-button>
          </div>
          <i slot="reference" class="el-icon-delete" />
        </el-popover>
      </div>
      <div class="tab-items tab" @click="addTab">
        <i class="el-icon-plus" />
        <span>添加</span>
      </div>
    </diy-style-contain>

    <diy-style-contain title="选项设置">
      <diy-operation-list v-model="optionSettings" @on-change="onOptionChange" />
    </diy-style-contain>

    <!-- 当前选项卡的商品组配置，直接复用 commodity-group 的属性面板 -->
    <transition name="el-fade-in-linear">
      <commodity-group-style v-if="show" :active-item="childItem" @update="update" />
    </transition>
  </div>
</template>

<script>
/**
 * 商品组（选项卡）—— 属性面板。迁移自 PHP common/commodity-group-tab/style.php
 *
 * 每个选项卡挂一份完整的 commodity-group 配置（goodList[i] 就是一个 activeItem 结构），
 * 切换选项卡时把子面板整体重建（show 开关），与 PHP 侧行为一致。
 */
import { deepClone } from '../../controls/utils';

export default {
  name: 'CommodityGroupTabStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      show: true,
      result: {},
      goodList: [],
      childItem: null,
      activeIndex: 0,
      selModelIndex: -1,

      bgColorSet: [{ type: 'color', label: '背景色', value: '', setKey: 'containBgColor' }],
      optionSettings: [],
      selectImgList: [{ type: 'image', label: '', value: '', setKey: 'tabSelectImg' }],
      selectBackList: [{ type: 'color', label: '', value: '#965757', setKey: 'tabSelectColor' }],
      tabList: [{ type: 'color', label: '颜色', value: '#965757', setKey: 'upLineColor' }],
      subtitleList: [
        { type: 'color', label: '未选中', value: '#965757', setKey: 'subUnselectColor' },
        { type: 'color', label: '选中', value: '#965757', setKey: 'subSelectColor' },
      ],
      list: [
        { type: 'color', label: '背景', value: '#ffffff', setKey: 'tabBgColor' },
        { type: 'color', label: '标题未选', value: '#666666', setKey: 'titleUnselect' },
        { type: 'color', label: '标题选中', value: '#ef4f4f', setKey: 'titleSelect' },
        {
          type: 'radio',
          label: '选项条',
          value: 1,
          list: [
            { label: 0, value: '关闭' },
            { label: 1, value: '开启' },
          ],
          slot: 'optionbar',
          setKey: 'optionbar',
        },
        {
          type: 'radio',
          label: '副标题',
          value: 0,
          list: [
            { label: 0, value: '关闭' },
            { label: 1, value: '开启' },
          ],
          slot: 'subtitle',
          setKey: 'subtitle',
        },
        {
          type: 'radio',
          label: '选中背景',
          value: 0,
          list: [
            { label: 0, value: '无' },
            { label: 1, value: '背景色' },
            { label: 2, value: '背景图片' },
          ],
          slot: 'selectback',
          setKey: 'selectback',
        },
        { type: 'size', label: '间距', value: 0, setKey: 'tabMargin', maxValue: 20 },
        { type: 'size', label: '上边距', value: 0, setKey: 'tabMarginTop', maxValue: 20 },
        { type: 'size', label: '下边距', value: 0, setKey: 'tabMarginBot', maxValue: 20 },
        { type: 'size', label: '左右边距', value: 0, setKey: 'tabMarginLR', maxValue: 20 },
        { type: 'size', label: '上圆角', value: 0, setKey: 'tabBordeRadiusTop', maxValue: 20 },
        { type: 'size', label: '下圆角', value: 0, setKey: 'tabBordeRadiusBot', maxValue: 20 },
      ],
    };
  },
  created() {
    this.result = deepClone(this.activeItem);
    if (!this.result.data) this.$set(this.result, 'data', {});
    if (!this.result.computedStyle) this.$set(this.result, 'computedStyle', {});

    if (this.result.data.goodList && this.result.data.goodList.length) {
      this.goodList = this.result.data.goodList;
      this.activeIndex = this.result.data.activeIndex || 0;
      this.childItem = this.goodList[this.activeIndex];
    } else {
      this.childItem = this.getChildItem();
      this.goodList = [this.childItem];
      this.activeIndex = 0;
      this.$set(this.result.data, 'goodList', this.goodList);
    }
    this.initOptionSettings();
    ['list', 'tabList', 'selectImgList', 'selectBackList', 'subtitleList', 'bgColorSet'].forEach((t) => this.initList(t));
  },
  methods: {
    getChildItem() {
      return { data: {}, computedStyle: {} };
    },
    initOptionSettings() {
      const data = (this.childItem && this.childItem.data) || {};
      this.optionSettings = [
        { type: 'input', label: '标题', value: data.title || '', max: 5, showLimit: true },
        { type: 'input', label: '副标题', value: data.subTitle || '', max: 5, showLimit: true },
      ];
    },
    /** 已有 computedStyle 的值回填到控件配置里 */
    initList(target) {
      const data = this.result.computedStyle;
      if (!this[target] || !this[target].length) return;
      this[target] = this[target].map((item) => {
        const obj = Object.assign({}, item);
        if (item.setKey in data && data[item.setKey] !== '') obj.value = data[item.setKey];
        return obj;
      });
    },
    /** 控件值写回 computedStyle */
    updataList(target) {
      this[target].forEach((item) => {
        if (item.setKey) this.updateStyle(item.setKey, item.value);
      });
    },
    onOptionChange([title, subTitle]) {
      if (!this.childItem.data) this.$set(this.childItem, 'data', {});
      this.$set(this.childItem.data, 'title', title.value);
      this.$set(this.childItem.data, 'subTitle', subTitle.value);
      this.update(this.childItem);
    },
    changeTab(index) {
      if (this.activeIndex === index) return;
      this.activeIndex = index;
      this.childItem = this.goodList[index];
      this.initOptionSettings();
      this.updateData('activeIndex', index);
      // 子面板整体重建，避免复用上一个选项卡的内部状态
      this.show = false;
      this.$nextTick(() => {
        this.show = true;
      });
    },
    addTab() {
      this.goodList.push(this.getChildItem());
      this.updateData('goodList', this.goodList);
    },
    deleteTab(item, index) {
      this.$set(item, 'visible', false);
      this.goodList.splice(index, 1);
      if (this.activeIndex >= this.goodList.length) this.activeIndex = this.goodList.length - 1;
      this.childItem = this.goodList[this.activeIndex];
      this.initOptionSettings();
      this.updateData('goodList', this.goodList);
    },
    updateStyle(key, value) {
      this.$set(this.result.computedStyle, key, value);
      this.$emit('update', this.result);
    },
    updateData(key, value) {
      this.$set(this.result.data, key, value);
      this.$emit('update', this.result);
    },
    /** 子面板（commodity-group-style）回传的整项，覆盖当前选项卡 */
    update(item) {
      const list = deepClone(this.goodList);
      list[this.activeIndex] = Object.assign({}, list[this.activeIndex], item);
      this.goodList = list;
      this.childItem = list[this.activeIndex];
      this.updateData('goodList', list);
    },
  },
};
</script>

<style scoped lang="scss">
.item-row {
  display: flex;
  align-items: center;
}
.diy-operation-name {
  width: 70px;
  color: #999;
  flex-shrink: 0;
}
.active-style {
  background: #f4f3f7;
  border-radius: 4px;
  padding: 6px 20px 6px 4px;
  color: #999;
  margin: 10px 0 20px;
}
.tab-items {
  position: relative;
  padding-left: 20px;
  border: 1px solid #f1f1f1;
  border-bottom: none;
  height: 36px;
  line-height: 36px;
  cursor: pointer;
  color: #999;
  font-size: 14px;

  .el-icon-delete {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 10px;
    margin: auto;
    height: 16px;
  }
  &.tab-active {
    border: 1px solid #2d8cf0;
  }
}
.tab {
  border: 1px solid rgba(0, 0, 0, 0.6);
  font-size: 12px;
  border-radius: 0 0 6px 6px;
  text-align: center;
  padding-left: 0;
}
.del-btns {
  display: flex;
  align-items: center;
}
</style>
