<template>
  <div class="cat-level-panel">
    <diy-style-contain :title="`${levelName}设置`">
      <div
        v-for="(item, index) in catList"
        :key="index"
        class="tab-items"
        :class="{ 'tab-active': activeIndex === index }"
        @click="changeTab(index)"
        @mouseover="selModelIndex = index"
        @mouseleave="selModelIndex = -1"
      >
        <span>{{ item.title || '标题' }}</span>
        <el-popover v-if="item.visible || selModelIndex === index" v-model="item.visible" placement="bottom">
          <p class="diy-del-text">确定删除吗？</p>
          <div class="popover-btns">
            <el-button class="diy-del-btn" size="mini" plain @click="deleteTab(item, index)">删除</el-button>
            <el-button size="mini" plain @click="cancel(item)">取消</el-button>
          </div>
          <i slot="reference" class="el-icon-delete" />
        </el-popover>
      </div>

      <div class="tab-items tab" @click="addTab">
        <i class="el-icon-plus" />
        <span>添加标题</span>
      </div>
    </diy-style-contain>

    <diy-style-contain :title="`${levelName}内容设置`">
      <diy-operation-list v-model="optionSettings" @on-change="titleOnChange" />
      <div class="img-wrap">
        <diy-img-setting
          ref="imgSetting"
          :img-infos="imgCatUrl"
          :def-img-count="1"
          :show-url="true"
          :suggest-site="2"
          suggest-size-text=""
          :img-contain-style="{ padding: 0 }"
          :show-title="false"
          @change="addCatImg"
          @pick-link="(index, item) => openLinkPicker('imgSetting', item)"
        />
      </div>
    </diy-style-contain>

    <!-- 二级面板里再嵌一层三级 -->
    <transition v-if="hasChild" name="el-fade-in-linear">
      <CatLevelPanel v-if="show && showChildPanel" :active-item="childItem" :level="3" @update="updateChild" />
    </transition>

    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 微主题的分类层级面板（二级 / 三级共用）
 * 迁移自 PHP style-components 里的 micro-theme-two-style（285 行）与 micro-theme-three-style（272 行）
 *
 * 这两个 PHP 文件内容几乎完全一致，仅「分类标题 / 子标题」文案与是否嵌套下一级不同，
 * 因此合并成一个递归组件，用 level 区分，行为与原实现一致。
 *
 * 注意：它们在 PHP 侧只有 style.php、没有 preview.php，
 * 是被 micro-theme/style.php 内部引用的子面板，不是独立的画布组件。
 */
import { deepClone } from '../../controls/utils';
import linkPickerMixins from '../../controls/linkPickerMixins';

export default {
  name: 'CatLevelPanel',
  mixins: [linkPickerMixins],
  props: {
    // 该层级对应的数据宿主，直接挂 catList / activeIndex
    activeItem: {
      type: Object,
      default: () => ({}),
    },
    // 2 = 分类标题（可再嵌三级），3 = 子标题
    level: {
      type: Number,
      default: 2,
    },
    // 上级传下来的「是否显示子标题」开关
    showChildPanel: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      show: true,
      imgCatUrl: [],
      catList: [],
      selModelIndex: -1,
      childItem: null,
      activeIndex: 0,
      optionSettings: [{ type: 'input', label: '标题', value: '', max: 5, showLimit: true }],
    };
  },
  computed: {
    levelName() {
      return this.level === 2 ? '分类标题' : '子标题';
    },
    hasChild() {
      return this.level === 2;
    },
  },
  watch: {
    // 切换 tab 时把子面板重建一次，避免残留上一项的数据
    activeIndex(newVal, oldVal) {
      this.show = false;
      if (newVal !== oldVal) this.updateData('activeIndex', newVal);
      setTimeout(() => {
        this.show = true;
      }, 200);
    },
    catList: {
      immediate: true,
      handler(newValue) {
        if (newValue && newValue.length) this.updateData('catList', newValue);
      },
    },
  },
  created() {
    this.init();
  },
  methods: {
    init() {
      if (this.activeItem && this.activeItem.catList) {
        this.catList = this.activeItem.catList;
        this.activeIndex = this.activeItem.activeIndex || 0;
        this.childItem = this.catList[this.activeIndex];
        this.imgCatUrl = this.childItem && this.childItem.catImg ? [this.childItem.catImg] : [];
      } else {
        const childItem = this.getChildItem();
        this.catList = [childItem];
        this.childItem = childItem;
        this.activeIndex = 0;
      }
      this.initOptionSettings();
    },
    initOptionSettings() {
      const arr = [{ type: 'input', label: '标题', value: '', max: 5, showLimit: true }];
      if (this.childItem && this.childItem.title) arr[0].value = this.childItem.title;
      this.optionSettings = arr;
    },
    addTab() {
      if (this.catList.length >= 5) {
        this.$message({ message: '最多添加5个哦', type: 'warning' });
        return;
      }
      this.catList.push(this.getChildItem());
    },
    changeTab(index) {
      if (this.activeIndex === index) return;
      this.activeIndex = index;
      this.childItem = this.catList[index];
      this.initOptionSettings();
      this.imgCatUrl = this.childItem && this.childItem.catImg ? [this.childItem.catImg] : [];
    },
    deleteTab(item, index) {
      item.visible = false;
      this.catList.splice(index, 1);
      this.childItem = this.catList[this.activeIndex];
    },
    cancel(item) {
      item.visible = false;
    },
    getChildItem() {
      // 原实现用 Object.create(null)，那样的对象在 Vue 2 里无法响应式，改成字面量
      return { title: '标题', catImg: { imgUrl: '' } };
    },
    titleOnChange([title]) {
      this.childItem.title = title.value;
      this.update(this.childItem);
    },
    addCatImg(arr) {
      this.imgCatUrl = arr;
      if (arr && arr[0]) this.update(Object.assign({}, this.childItem, { catImg: arr[0] }));
    },
    update(item) {
      const list = deepClone(this.catList);
      list[this.activeIndex] = this.deepMerge(list[this.activeIndex], item);
      this.childItem = list[this.activeIndex];
      this.catList = list;
      this.updateData('catList', list);
    },
    updateData(key, value) {
      // 直接改上级传下来的对象引用，再回抛，与原实现一致
      this.$emit('update', Object.assign(this.activeItem || {}, { [key]: value }));
    },
    deepMerge(obj1, obj2) {
      Object.keys(obj2 || {}).forEach((key) => {
        obj1[key] =
          obj1[key] && Object.prototype.toString.call(obj1[key]) === '[object Object]'
            ? this.deepMerge(obj1[key], obj2[key])
            : obj2[key];
      });
      return obj1;
    },
    updateChild(item) {
      this.update(item);
    },
  },
};
</script>

<style scoped lang="scss">
.tab-items {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  margin: 0 8px 8px 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  &.tab-active {
    border-color: #2d8cf0;
    color: #2d8cf0;
  }
  .el-icon-delete {
    margin-left: 6px;
    color: #999;
  }
}
.popover-btns {
  display: flex;
  align-items: center;
}
.img-wrap {
  padding-left: 85px;
}
</style>
