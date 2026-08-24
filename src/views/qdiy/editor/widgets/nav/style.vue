<template>
  <div class="nav-style">
    <diy-style-contain :show-title="false">
      <div class="diy-nav-tabs">
        <el-radio-group v-model="tabsNav" @change="onChange($event, 'tabsNav')">
          <el-radio-button v-for="(item, index) in tabsNavList" :key="index" :label="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </diy-style-contain>

    <!-- 页面设置 / 分享配置：见下方说明，本轮未迁移 -->
    <div v-if="tabsNav == 2 || tabsNav == 3" class="not-migrated">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        :title="`「${tabsNav == 2 ? '页面设置' : '分享配置'}」面板尚未迁移`"
        :description="
          tabsNav == 2
            ? 'PHP 侧对应 diy-main-page（192 行），不在本轮批次范围内。已有配置数据可正常读写与保存。'
            : 'PHP 侧对应 diy-share（188 行），不在本轮批次范围内。已有配置数据可正常读写与保存。'
        "
      />
    </div>

    <div v-else>
      <diy-style-contain title="标题">
        <div class="row gutter-bot-10">
          <div class="second-level">内容形式</div>
          <el-radio-group v-model="contentType" @change="onChangeData($event, 'contentType')">
            <el-radio-button v-for="(item, index) in contentTypeList" :key="index" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="contentType == 1" class="row gutter-bot-10">
          <div class="second-level" />
          <el-input
            v-model="name"
            class="name-input"
            size="small"
            placeholder="请输入商城名称"
            :maxlength="10"
            show-word-limit
            @input="onChangeData($event, 'name')"
          />
        </div>
        <div v-else class="row gutter-bot-10">
          <div class="second-level" />
          <div class="logo-box">
            <diy-img-setting
              :img-infos="imageUrl"
              :def-img-count="1"
              :show-url="false"
              :suggest-site="2"
              suggest-size-text="建议 112x30"
              :img-contain-style="{ padding: 0 }"
              :show-title="false"
              @change="addIconImg($event, 'logoSrc')"
            />
          </div>
        </div>

        <div class="row">
          <div class="second-level">位置选择</div>
          <el-radio-group v-model="positionChoose" @change="onChangeData($event, 'positionChoose')">
            <el-radio-button v-for="(item, index) in positionChooseList" :key="index" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </diy-style-contain>

      <diy-style-contain title="风格">
        <div class="row">
          <div class="second-level">风格选择</div>
          <el-radio-group v-model="styleChoose" @change="onChangeData($event, 'styleChoose')">
            <el-radio-button v-for="(item, index) in styleChooseList" :key="index" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </diy-style-contain>

      <diy-style-contain v-if="hideSearch" title="搜索栏设置">
        <div class="row gutter-bot-10">
          <div class="second-level">搜索框显示</div>
          <el-radio-group v-model="isShowSearch" @change="onChangeData($event, 'isShowSearch')">
            <el-radio-button v-for="(item, index) in searchList" :key="index" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="row gutter-bot-10">
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

        <div class="row gutter-bot-10">
          <div class="second-level">对齐方式</div>
          <el-radio-group v-model="searchPosition" @change="onChange($event, 'searchPosition')">
            <el-radio-button v-for="(item, index) in searchPositionList" :key="index" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <diy-color
          :contain-obj="containObj"
          :color-infos="defaultForm.searchColor"
          style="padding: 0"
          @change="updateColor($event, 'searchColor')"
        />
      </diy-style-contain>

      <diy-style-contain title="样式设置">
        <div class="row">
          <div class="second-level">文字颜色</div>
          <el-radio-group v-model="statusBar" @change="onChange($event, 'statusBar')">
            <el-radio-button v-for="(item, index) in statusBarList" :key="index" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <diy-color
          :contain-obj="containObj"
          :color-infos="defaultForm.statusBarColor"
          style="padding: 0"
          @change="updateColor($event, 'statusBarColor')"
        />
      </diy-style-contain>
    </div>
  </div>
</template>

<script>
/**
 * 导航组 —— 属性面板。迁移自 PHP common/nav/style.php
 *
 * 该组件的 style 面板不走 basicMixins（原实现也是自己维护 result 与 defaultForm）。
 *
 * 两处未迁移，均为 nav 独有的子面板，不在本轮 21 个基础控件与批次 1 范围内：
 *   页面设置 → style-components/nav/diy-main-page.php（192 行）
 *   分享配置 → style-components/nav/diy-share.php（188 行）
 * 已有数据不受影响，接上后把 mainPageChange / shareChange 挂回去即可。
 *
 * 对齐方式原本用 resources/img/decorate/align-*.png，平台端无此资源，改为文字标签。
 */
import { deepClone, getObjValue } from '../../controls/utils';

export default {
  name: 'NavStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      result: {},
      containObj: { showTitle: false },

      tabsNav: 1,
      tabsNavList: [
        { label: '导航设置', value: '1' },
        { label: '页面设置', value: '2' },
        { label: '分享配置', value: '3' },
      ],

      styleChoose: 1,
      styleChooseList: [
        { label: '标准', value: '1' },
        { label: '沉浸式', value: '2' },
      ],

      contentType: 1,
      contentTypeList: [
        { label: '文字', value: '1' },
        { label: '图片', value: '2' },
      ],

      statusBar: 2,
      statusBarList: [
        { label: '黑色', value: '1' },
        { label: '白色', value: '2' },
      ],

      positionChoose: 0,
      positionChooseList: [
        { label: '居左', value: '0' },
        { label: '居中', value: '1' },
      ],

      hideSearch: true,
      isShowSearch: -1,
      searchList: [
        { label: '是', value: '1' },
        { label: '否', value: '2' },
      ],

      searchPosition: -1,
      searchPositionList: [
        { label: '居左', value: '1' },
        { label: '居中', value: '2' },
        { label: '居右', value: '3' },
      ],

      searchBorder: -1,
      border: -1,
      isShowName: -1,
      name: '',
      placeholder: '',
      imageUrl: [],

      defaultForm: {
        titleBgColor: [{ name: '底部背景', color: 'transparent', showAlpha: false }],
        statusBarColor: [{ name: '背景颜色', color: 'transparent', showAlpha: true }],
        searchColor: [
          { name: '文字颜色', color: 'transparent', showAlpha: false },
          { name: '背景颜色', color: 'transparent', showAlpha: true },
        ],
        titleDistance: [],
        searchDistance: [],
      },
    };
  },
  created() {
    this.init();
  },
  methods: {
    init() {
      this.result = deepClone(this.activeItem);
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (!this.result.computedStyle) this.$set(this.result, 'computedStyle', {});

      const d = this.result.data;
      const cs = this.result.computedStyle;

      this.setValue('statusBar', d.statusBar);
      this.setValue('statusBar', cs.statusBar);
      this.setValue('border', cs.border);
      this.setValue('searchPosition', cs.searchPosition);
      this.setValue('searchBorder', cs.searchBorder);
      this.setValue('isShowSearch', d.isShowSearch);
      this.setValue('isShowName', d.isShowName);
      this.setValue('name', d.name);
      this.setValue('placeholder', d.placeholder);
      this.setValue('positionChoose', d.positionChoose);
      this.setValue('styleChoose', d.styleChoose);
      this.setValue('hideSearch', d.hideSearch);
      this.setValue('contentType', d.contentType);

      this.defaultForm.titleBgColor = [
        { name: '底部背景', color: getObjValue(this.result, ['computedStyle', 'titleBgColor'], 'transparent'), showAlpha: true },
      ];
      this.defaultForm.statusBarColor = [
        {
          name: '背景颜色',
          color: getObjValue(this.result, ['computedStyle', 'statusBarColor'], 'transparent'),
          showAlpha: true,
        },
      ];
      this.defaultForm.searchColor = [
        { name: '文字颜色', color: getObjValue(this.result, ['computedStyle', 'searchColor'], 'transparent'), showAlpha: false },
        {
          name: '背景颜色',
          color: getObjValue(this.result, ['computedStyle', 'searchBgColor'], 'transparent'),
          showAlpha: true,
        },
      ];

      this.defaultForm.titleDistance = [
        { name: '文字大小', value: getObjValue(this.result, ['computedStyle', 'titleDistance', 'fontSize'], 16), unit: 'px', disabled: false, maxValue: 20 },
        { name: '高度', value: getObjValue(this.result, ['computedStyle', 'titleDistance', 'height'], 0), unit: 'px', disabled: false, maxValue: 44 },
        { name: '宽度', value: getObjValue(this.result, ['computedStyle', 'titleDistance', 'width'], 32), unit: 'px', disabled: false, maxValue: 200 },
        { name: '左边距', value: getObjValue(this.result, ['computedStyle', 'titleDistance', 'marginLeft'], 0), unit: 'px', disabled: false, maxValue: 100 },
      ];
      this.defaultForm.searchDistance = [
        { name: '文字大小', value: getObjValue(this.result, ['computedStyle', 'searchDistance', 'fontSize'], 14), unit: 'px', disabled: false, maxValue: 20 },
        { name: '高度', value: getObjValue(this.result, ['computedStyle', 'searchDistance', 'height'], 29), unit: 'px', disabled: false, maxValue: 44 },
      ];
      this.imageUrl = d.logoSrc ? [{ imgUrl: d.logoSrc }] : [];
    },
    // 空值不覆盖默认值
    setValue(key, value) {
      if (value || typeof value === 'boolean') this[key] = value;
    },
    onChangeData(event, key) {
      this.result.data[key] = event;
      this.$emit('update', this.result);
    },
    onChange(event, key) {
      this.result.computedStyle[key] = event;
      this.result.data[key] = event;
      this.$emit('update', this.result);
    },
    updateColor(e, type) {
      const cb = {
        titleBgColor: () => {
          this.result.computedStyle.titleBgColor = e[0].color;
        },
        statusBarColor: () => {
          this.result.computedStyle.statusBarColor = e[0].color;
        },
        searchColor: () => {
          this.result.computedStyle.searchColor = e[0].color;
          this.result.computedStyle.searchBgColor = e[1].color;
        },
      };
      if (cb[type]) cb[type]();
      this.$emit('update', this.result);
    },
    sliderChange(arr, type) {
      const cs = this.result.computedStyle;
      const cb = {
        titleDistance: () => {
          cs.titleDistance = Object.assign({}, cs.titleDistance || {}, {
            fontSize: arr[0].value,
            height: arr[1].value,
            width: arr[2].value,
            marginLeft: arr[3].value,
          });
        },
        searchDistance: () => {
          cs.searchDistance = Object.assign({}, cs.searchDistance || {}, {
            fontSize: arr[0].value,
            height: arr[1].value,
          });
        },
        searchMarPad: () => {
          cs.searchMarPad = Object.assign({}, cs.searchMarPad || {}, {
            marginLeft: arr[0].value,
            paddingLeft: arr[1].value,
          });
        },
        iconSize: () => {
          cs.iconSize = Object.assign({}, cs.iconSize || {}, { size: arr[0].value });
        },
      };
      if (cb[type]) cb[type]();
      this.$emit('update', this.result);
    },
    addIconImg(arr, type) {
      this.imageUrl = arr;
      this.result.data[type] = arr && arr[0] ? arr[0].imgUrl : '';
      this.$emit('update', this.result);
    },
    // 以下两个回调留给未迁移的子面板，接上后直接可用
    mainPageChange(item) {
      this.result.data.mainPage = item;
      this.$emit('update', this.result);
    },
    shareChange(e) {
      this.result.data.share = {
        title: e[0].value,
        desc: e[1].value,
        appletImg: e[2].value,
        officialAccountImg: e[4].value,
      };
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
}
.gutter-bot-10 {
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
.logo-box {
  height: 88px;
  background: #ddd;
  flex: 1;
}
.not-migrated {
  padding: 20px;
}
</style>
