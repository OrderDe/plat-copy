<template>
  <div class="scroll-nav-style">
    <diy-style-contain title="综合样式设置">
      <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    </diy-style-contain>

    <diy-style-contain title="栏目设置">
      <div
        v-for="(item, index) in catList"
        :key="index"
        class="tab-items"
        :class="{ 'tab-active': activeIndex === index }"
        @click="changeTab(index)"
        @mouseover="selModelIndex = index"
        @mouseleave="selModelIndex = -1"
      >
        <span>{{ item.title || '栏目名称' }}</span>
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
        <span>添加标题</span>
      </div>
    </diy-style-contain>

    <diy-style-contain title="栏目内容设置">
      <diy-operation-list v-model="optionSettings" @on-change="titleOnChange" />
      <div class="position-tips">使用「锚点」组件，在页面不同位置设置锚点，并将 ID 填于以上输入框。</div>
    </diy-style-contain>
  </div>
</template>

<script>
/**
 * 滚动导航 —— 属性面板。迁移自 PHP common/scroll-nav/style.php
 *
 * 栏目最多 5 个，每个栏目配「标题 + 锚点ID」，锚点 ID 来自 scroll-position 组件。
 */
import basicMixins from '../../controls/basicMixins';
import { deepClone, getObjValue } from '../../controls/utils';

export default {
  name: 'ScrollNavStyle',
  mixins: [basicMixins],
  data() {
    return {
      catList: [],
      selModelIndex: -1,
      childItem: null,
      activeIndex: 0,
      optionSettings: [],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});

      this.defaultForm.colorInfos = [
        { name: '背景颜色', color: getObjValue(this.result, ['computedStyle', 'bgColor'], 'transparent'), showAlpha: true },
        { name: '标题颜色', color: getObjValue(this.result, ['computedStyle', 'titleColor'], '#333'), showAlpha: false },
        {
          name: '标题背景颜色',
          color: getObjValue(this.result, ['computedStyle', 'titleBgColor'], '#FFFFFF'),
          showAlpha: false,
        },
        {
          name: '活动标题颜色',
          color: getObjValue(this.result, ['computedStyle', 'activeTitleColor'], '#000'),
          showAlpha: false,
        },
      ];

      if (this.result.data.catList && this.result.data.catList.length) {
        this.catList = this.result.data.catList;
        this.activeIndex = this.result.data.activeIndex || 0;
        this.childItem = this.catList[this.activeIndex];
      } else {
        this.childItem = this.getChildItem();
        this.catList = [this.childItem];
        this.activeIndex = 0;
        this.$set(this.result.data, 'catList', this.catList);
      }
      this.initOptionSettings();
    },
    initOptionSettings() {
      const item = this.childItem || {};
      this.optionSettings = [
        { type: 'input', label: '标题', value: item.title || '', max: 5, showLimit: true },
        { type: 'input', label: '锚点ID', value: item.position || '', max: 50, showLimit: true },
      ];
    },
    getChildItem() {
      return { title: '标题', position: '' };
    },
    addTab() {
      if (this.catList.length >= 5) {
        this.$message({ message: '最多添加5个哦', type: 'warning' });
        return;
      }
      this.catList.push(this.getChildItem());
      this.updateData('catList', this.catList);
    },
    changeTab(index) {
      if (this.activeIndex === index) return;
      this.activeIndex = index;
      this.childItem = this.catList[index];
      this.initOptionSettings();
      this.updateData('activeIndex', index);
    },
    deleteTab(item, index) {
      this.$set(item, 'visible', false);
      this.catList.splice(index, 1);
      if (this.activeIndex >= this.catList.length) this.activeIndex = this.catList.length - 1;
      this.childItem = this.catList[this.activeIndex];
      this.initOptionSettings();
      this.updateData('catList', this.catList);
    },
    titleOnChange([title, position]) {
      const list = deepClone(this.catList);
      list[this.activeIndex] = Object.assign({}, list[this.activeIndex], {
        title: title.value,
        position: position.value,
      });
      this.catList = list;
      this.childItem = list[this.activeIndex];
      this.updateData('catList', list);
    },
    updateData(key, value) {
      this.$set(this.result.data, key, value);
      this.$emit('update', this.result);
    },
    updateColor(e) {
      const cs = this.result.computedStyle;
      cs.bgColor = e[0] && e[0].color;
      cs.titleColor = e[1] && e[1].color;
      cs.titleBgColor = e[2] && e[2].color;
      cs.activeTitleColor = e[3] && e[3].color;
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
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
.position-tips {
  background-color: rgba(193, 221, 252, 0.27);
  font-size: 13px;
  color: #999;
  padding: 14px 20px;
  border-radius: 8px;
  margin-top: 5px;
}
.del-btns {
  display: flex;
  align-items: center;
}
</style>
