<template>
  <div class="course-style">
    <diy-tabs title="样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />

    <diy-style-contain title="风格">
      <el-radio-group v-model="styleVal" @change="onStyleList">
        <el-radio-button v-for="(item, index) in styleList" :key="index" :label="item.label">
          {{ item.text }}
        </el-radio-button>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="选择课程">
      <ActivityPicker
        :value="courseList"
        :max-length="maxDataLength"
        tip="按课程 ID 添加，课程标题/封面由 App 端按 ID 获取"
        @change="onCourseChange"
      />
    </diy-style-contain>

    <diy-style-contain title="角标设置">
      <el-radio-group v-model="angleMark" @change="onAngleMark">
        <el-radio v-for="(item, index) in angleMarkList" :key="index" :label="item.label">{{ item.value }}</el-radio>
      </el-radio-group>

      <div v-show="angleMark == 2" class="angle-func">
        <div class="row">
          <div class="leabl">样式</div>
          <diy-tab v-model="angleMarkStyleList" :default-index="angleMarkStyleIndex" @change="onAngleMarkStyle">
            <template v-slot="{ item, isSelect }">
              <div class="angle-col" :class="{ selected: isSelect }">{{ item.text }}</div>
            </template>
          </diy-tab>
        </div>
        <div class="row">
          <div class="leabl">文字</div>
          <el-input
            v-model="angleMarkText"
            style="flex: 1"
            placeholder="请输入内容"
            maxlength="2"
            size="small"
            show-word-limit
            @input="onAngleMarkChange($event, 'angleMarkText')"
          />
        </div>
      </div>

      <div v-show="angleMark == 3" class="angle-func">
        <diy-img-setting
          :img-infos="imageUrl"
          :def-img-count="1"
          :show-url="false"
          :suggest-site="2"
          suggest-size-text="建议图片宽度76，高度76。"
          :img-contain-style="{ padding: 0 }"
          :show-title="false"
          @change="addIconImg"
        />
      </div>
    </diy-style-contain>

    <diy-style-contain title="显示内容">
      <el-checkbox-group v-model="contentCheckList" @change="onContentChange">
        <div v-for="(item, index) in showContentList" :key="index" class="content-row">
          <el-checkbox :label="item.label">
            <span>{{ item.name }}</span>
          </el-checkbox>
          <el-color-picker v-model="item.color" @change="onContentChange" />
          <el-input v-model="item.color" size="mini" class="color-ipt" @input="onContentChange" />
        </div>
      </el-checkbox-group>
    </diy-style-contain>

    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-size-setting top-name="边距" :size-infos="sizeInfos" :max-value="50" @change="marginChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/**
 * 课程 —— 属性面板。迁移自 PHP common/course/style.php
 *
 * 风格图与角标示意图（resources/img/decorate/*）平台端无资源，改用文字标签；
 * 课程选择改用 ActivityPicker 按 ID 录入（Java 侧无课程模块接口）。
 */
import ActivityPicker from '../../components/ActivityPicker';
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'CourseStyle',
  components: { ActivityPicker },
  mixins: [basicMixins],
  data() {
    return {
      styleVal: 1,
      styleList: [
        { label: 1, text: '一行一个' },
        { label: 2, text: '列表' },
        { label: 3, text: '三列' },
        { label: 4, text: '四列' },
      ],
      courseList: [],
      maxDataLength: 20,
      angleMark: 1,
      angleMarkList: [
        { label: 1, value: '不显示' },
        { label: 2, value: '系统图标' },
        { label: 3, value: '自定义' },
      ],
      angleMarkStyleIndex: -1,
      angleMarkStyleList: [
        { label: 1, text: '样式1' },
        { label: 2, text: '样式2' },
        { label: 3, text: '样式3' },
      ],
      angleMarkText: '',
      imageUrl: [],
      contentCheckList: [1, 2, 3, 4],
      showContentList: [
        { label: 1, name: '课程标题', color: '#202021', key: 'title' },
        { label: 2, name: '课程描述', color: '#999ca7', key: 'desc' },
        { label: 3, name: '课程价格', color: '#DB0505', key: 'price' },
        { label: 4, name: '学习人数', color: '#000000', key: 'count' },
      ],
      sizeInfos: [
        { name: '间距', value: 6, maxValue: 50, unit: 'px', hidden: false },
        { name: '上边距', value: 0, maxValue: 50, unit: 'px', hidden: false },
        { name: '下边距', value: 0, maxValue: 50, unit: 'px', hidden: false },
        { name: '左右边距', value: 8, maxValue: 20, unit: 'px', hidden: false },
      ],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const d = this.result.data;

      this.styleVal = d.styleVal || 1;
      this.courseList = d.courseList || [];
      if (d.marginData) {
        this.sizeInfos = d.marginData;
      } else {
        this.marginChange();
      }
      if (d.showContent && d.showContent.length) {
        this.contentCheckList = d.showContent.map((it) => it.label);
        this.showContentList = this.showContentList.map((item) => {
          const hit = d.showContent.find((it) => it.label === item.label);
          return hit ? { ...item, color: hit.color } : item;
        });
      } else {
        this.onContentChange();
      }

      const angleMark = getObjValue(this.result, ['data', 'angleMark'], {});
      this.angleMark = angleMark.label || 1;
      this.angleMarkText = angleMark.angleMarkText || '';
      this.imageUrl = angleMark.customImgUrl ? [{ imgUrl: angleMark.customImgUrl }] : [];
      const angleMarkStyle = getObjValue(this.result, ['data', 'angleMark', 'angleMarkStyle'], { label: 0 });
      this.angleMarkStyleIndex = angleMarkStyle.label - 1;
    },
    onStyleList(e) {
      this.updataData(e, 'styleVal');
    },
    onCourseChange(list) {
      this.courseList = list;
      this.updataData(list, 'courseList');
    },
    onContentChange() {
      const result = this.showContentList.filter((it) => this.contentCheckList.indexOf(it.label) !== -1);
      this.updataData(result, 'showContent');
    },
    onAngleMark(e) {
      const item = this.angleMarkList.find((it) => it.label == e);
      this.mergeAngleMark(item);
    },
    onAngleMarkStyle(item, index) {
      this.angleMarkStyleIndex = index;
      this.mergeAngleMark({ angleMarkStyle: item });
    },
    onAngleMarkChange(e, type) {
      this.mergeAngleMark({ [type]: e });
    },
    addIconImg(arr) {
      this.imageUrl = arr;
      if (arr && arr[0]) this.mergeAngleMark({ customImgUrl: arr[0].imgUrl });
    },
    mergeAngleMark(value) {
      const merged = Object.assign({}, this.result.data.angleMark || {}, value);
      this.updataData(merged, 'angleMark');
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
    updateColor(e) {
      this.result.computedStyle.searchBox = e[0] && e[0].color;
      this.result.computedStyle.iptBg = e[1] ? e[1].color : this.result.computedStyle.iptBg;
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.angle-func {
  margin-top: 12px;
  background: #f4f3f7;
  border-radius: 4px;
  padding: 10px;
}
.row {
  display: flex;
  align-items: center;
  padding-bottom: 10px;

  .leabl {
    width: 50px;
    flex-shrink: 0;
    color: #999;
  }
}
.angle-col {
  padding: 4px 10px;
  margin-right: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  color: #666;

  &.selected {
    border-color: #2d8cf0;
    color: #2d8cf0;
  }
}
.content-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .color-ipt {
    width: 90px;
    margin-left: 8px;
  }
}
</style>
