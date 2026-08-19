<template>
  <div class="notes-articles">
    <diy-style :img-style="{ width: '280px', height: '220px' }" :img-info="imgInfo" :def-index="imgIndex" @change="upImgIndex" />
    <diy-tabs title="样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />

    <diy-style-contain title="搜索栏设置">
      <div class="row">
        <div class="second-level">搜索框显示</div>
        <el-radio-group v-model="isShowSearch" @change="onChangeData($event, 'isShowSearch')">
          <el-radio-button v-for="(item, index) in searchList" :key="index" :label="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="row">
        <div class="second-level">搜索框描述</div>
        <el-input
          v-model="placeholder"
          class="name-input"
          size="small"
          placeholder="请输入描述"
          :maxlength="10"
          show-word-limit
          @input="onChangeData($event, 'placeholder')"
        />
      </div>
    </diy-style-contain>

    <diy-style-contain title="选择笔记">
      <ActivityPicker
        :value="nodeList"
        :max-length="addMaxLength"
        tip="按笔记 ID 添加，标题与发布时间由 App 端按 ID 获取"
        @change="onNodeChange"
      />
    </diy-style-contain>

    <diy-style-contain title="显示内容">
      <el-checkbox-group v-model="selInfo" @change="showInfoChange">
        <el-checkbox v-for="(item, index) in showInfo" :key="index" :label="item.val">{{ item.text }}</el-checkbox>
      </el-checkbox-group>
    </diy-style-contain>

    <diy-color :color-infos="noteColor" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-size-setting top-name="边距" :size-infos="sizeInfos" :max-value="50" @change="marginChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/**
 * 图文文章 —— 属性面板。迁移自 PHP common/notes-articles/style.php
 *
 * 笔记选择原本用 com-pick-link（operating_note），Java 侧无该模块接口，
 * 改用 ActivityPicker 按 ID 录入，保存结构一致（[{ params: { id } }]）。
 */
import ActivityPicker from '../../components/ActivityPicker';
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'NotesArticlesStyle',
  components: { ActivityPicker },
  mixins: [basicMixins],
  data() {
    return {
      placeholder: '',
      isShowSearch: '2',
      searchList: [
        { label: '是', value: '1' },
        { label: '否', value: '2' },
      ],
      imgInfo: [
        { img: 'node/style1.png', text: '风格1', type: 0 },
        { img: 'node/style2.png', text: '风格2', type: 1 },
        { img: 'node/style3.png', text: '风格3', type: 2 },
      ],
      imgIndex: 0,
      nodeList: [],
      addMaxLength: 30,
      showInfo: [
        { text: '发布时间', val: '1' },
        { text: '点赞数', val: '2' },
        { text: '阅读数', val: '3' },
      ],
      selInfo: ['1', '2', '3'],
      noteColor: [
        { name: '底部颜色', color: '#FFF', showAlpha: false, value: '#FFF', key: 'bak' },
        { name: '文章背景', color: '#FFF', showAlpha: false, value: '#FFF', key: 'nodeBak' },
        { name: '文章标题', color: '#3d404d', showAlpha: false, value: '#3d404d', key: 'nodeTitle' },
        { name: '点赞数', color: '#999CA7', showAlpha: false, value: '#999CA7', key: 'zangCount' },
        { name: '阅读数', color: '#999CA7', showAlpha: false, value: '#999CA7', key: 'count' },
        { name: '发布时间', color: '#999CA7', showAlpha: false, value: '#999CA7', key: 'time' },
      ],
      sizeInfos: [
        { name: '间距', value: 6, maxValue: 50, unit: 'px' },
        { name: '上边距', value: 0, maxValue: 50, unit: 'px' },
        { name: '下边距', value: 0, maxValue: 50, unit: 'px' },
        { name: '左右边距', value: 0, maxValue: 20, unit: 'px' },
      ],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const d = this.result.data;

      if (d.placeholder) this.placeholder = d.placeholder;
      if (d.isShowSearch) this.isShowSearch = d.isShowSearch;

      if (d.colorData) {
        this.noteColor = d.colorData;
      } else {
        this.updateColor();
      }
      this.nodeList = d.nodeList || [];
      if (d.imgIndex === undefined) {
        this.$set(d, 'imgIndex', this.imgIndex);
      } else {
        this.imgIndex = d.imgIndex;
      }
      if (d.marginData) {
        this.sizeInfos = d.marginData;
      } else {
        this.marginChange();
      }
      if (d.selArr) {
        this.selInfo = d.selArr;
      } else {
        this.showInfoChange(this.selInfo);
      }
    },
    onChangeData(e, key) {
      this.updataData(e, key);
    },
    upImgIndex(index) {
      this.imgIndex = index;
      this.updataData(index, 'imgIndex');
    },
    onNodeChange(list) {
      this.nodeList = list;
      this.updataData(list, 'nodeList');
    },
    showInfoChange(e) {
      this.updataData(e, 'selArr');
    },
    updateColor(e) {
      const arr = e || this.noteColor;
      this.noteColor = arr;
      const colorStyle = {};
      arr.forEach((v) => {
        colorStyle[v.key] = v.color || v.value;
      });
      this.$set(this.result.data, 'colorStyle', colorStyle);
      this.$set(this.result.data, 'colorData', arr);
      this.$emit('update', this.result);
    },
    marginChange(arr) {
      const list = arr || this.sizeInfos;
      this.sizeInfos = list;
      this.$set(
        this.result.data,
        'marginArr',
        list.map((v) => v.value + v.unit),
      );
      this.$set(this.result.data, 'marginData', list);
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
}
.second-level {
  color: #999;
  font-size: 13px;
  flex-shrink: 0;
  margin-right: 10px;
}
.name-input {
  width: 200px;
}
</style>
