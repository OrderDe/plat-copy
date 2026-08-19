<template>
  <div class="micro-theme-style">
    <diy-style-contain title="综合样式设置">
      <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
      <diy-size-setting top-name="图片圆角" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
    </diy-style-contain>

    <diy-style-contain title="显示设置">
      <div class="row">
        <div class="leabl">显示设置</div>
        <el-checkbox-group v-model="showChild" @change="radioChange">
          <el-checkbox label="three">显示子标题</el-checkbox>
        </el-checkbox-group>
      </div>
    </diy-style-contain>

    <transition name="el-fade-in-linear">
      <CatLevelPanel
        v-if="show && showTwo"
        :active-item="childItem"
        :level="2"
        :show-child-panel="showThree"
        @update="updateTwo"
      />
    </transition>
  </div>
</template>

<script>
/**
 * 微主题 —— 属性面板。迁移自 PHP common/micro-theme/style.php
 *
 * 二级 / 三级面板见同目录的 CatLevelPanel.vue（对应 PHP 的 micro-theme-two/three-style）。
 */
import basicMixins from '../../controls/basicMixins';
import { deepClone, getObjValue } from '../../controls/utils';
import CatLevelPanel from './CatLevelPanel';

export default {
  name: 'MicroThemeStyle',
  components: { CatLevelPanel },
  mixins: [basicMixins],
  data() {
    return {
      show: true,
      catList: [],
      showChild: ['two', 'three'],
      showTwo: true,
      showThree: true,
      childItem: null,
      activeIndex: 0,
    };
  },
  watch: {
    catList: {
      immediate: true,
      handler(newValue) {
        if (newValue && newValue.length) {
          this.result.data.catList = newValue;
          this.$emit('update', this.result);
        }
      },
    },
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.sizeInfos = ['图片间距', '上边距', '下边距', '左右边距'];

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

      this.defaultForm.radiusInfos = [
        {
          name: '上圆角',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'border-top-left-radius'], 0)),
          unit: 'px',
          disabled: false,
          maxValue: 20,
        },
        {
          name: '下圆角',
          value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'border-bottom-right-radius'], 0)),
          unit: 'px',
          disabled: false,
          maxValue: 20,
        },
      ];

      this.result = deepClone(this.activeItem);
      if (!this.result.data) this.$set(this.result, 'data', {});

      if (this.result.data.catList) {
        this.catList = this.result.data.catList;
        this.activeIndex = this.result.data.activeIndex || 0;
        this.childItem = this.catList[this.activeIndex];
        if (this.childItem) {
          this.showTwo = this.childItem.showTwo != null ? this.childItem.showTwo : true;
          this.showThree = this.childItem.showThree != null ? this.childItem.showThree : true;
          this.showChild = this.childItem.showChild != null ? this.childItem.showChild : ['two', 'three'];
        }
      } else {
        const childItem = this.getChildItem();
        childItem.showTwo = true;
        childItem.showThree = true;
        childItem.showChild = ['two', 'three'];
        this.catList = [childItem];
        this.childItem = childItem;
        this.activeIndex = 0;
      }
    },
    // 「二级」在 UI 上没有开关（PHP 里那一行被注释掉了），只保留子标题开关
    radioChange(e) {
      this.showTwo = e.includes('two') ? true : this.showTwo;
      this.childItem.showTwo = this.showTwo;
      this.showThree = e.includes('three');
      this.childItem.showThree = this.showThree;
      if (this.showTwo === false) {
        this.showThree = false;
        this.childItem.showThree = false;
        this.showChild = [];
      }
      this.childItem.showChild = e;
      this.update(this.childItem);
    },
    getChildItem() {
      return { title: '标题', catImg: { imgUrl: '' } };
    },
    update(item) {
      const list = deepClone(this.catList);
      list[this.activeIndex] = this.deepMerge(list[this.activeIndex], item);
      this.childItem = list[this.activeIndex];
      this.catList = list;
      this.updateData('catList', list);
    },
    updateData(key, value) {
      this.result.data = Object.assign(this.result.data || {}, { [key]: value });
      this.$emit('update', this.result);
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
    updateTwo(item) {
      this.update(item);
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  padding-top: 5px;
}
.leabl {
  color: #999;
  font-size: 13px;
  margin-right: 15px;
}
</style>
