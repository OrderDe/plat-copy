<template>
  <div class="nav-style">
    <diy-style-contain :show-title="false">
      <div class="diy-nav-tabs">
        <el-radio-group v-model="tabsNav">
          <el-radio-button v-for="(item, index) in tabsNavList" :key="index" :label="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </diy-style-contain>

    <!-- 定位风格 -->
    <div v-if="tabsNav == 1">
      <!--
        原来用 diy-style 按图片选风格，但 nav-location/location-style-*.png 这几张图
        平台端根本没有（PHP 侧的资源没一起迁过来），面板上只有三个空框，
        运营看不到任何东西，也就无从选起。这三种风格的差别本来就是「要不要定位」这类行为，
        不是视觉差异，用名称加说明比缩略图更清楚。
      -->
      <diy-style-contain title="定位风格">
        <div class="loc-style-list">
          <div
            v-for="(it, i) in imgInfo"
            :key="i"
            class="loc-style-item"
            :class="{ active: imgIndex === i }"
            @click="upImgIndex(i)"
          >
            <div class="loc-style-name">{{ it.text }}</div>
            <div class="loc-style-desc">{{ it.desc }}</div>
          </div>
        </div>
      </diy-style-contain>
      <diy-style-contain title="风格2、3 是否强制弹出定位组件">
        <el-radio-group v-model="forceType" @change="onChangeData($event, 'forceType')">
          <el-radio-button v-for="(item, index) in forceTypeList" :key="index" :label="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </diy-style-contain>
    </div>

    <!-- 页面设置 / 分享配置：与 nav 组件一致，本轮未迁移 -->
    <div v-else-if="tabsNav == 2 || tabsNav == 3" class="not-migrated">
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
 * 定位导航 —— 属性面板。迁移自 PHP common/nav-location/style.php
 *
 * 与 nav 组件同源，额外多了「定位风格」（风格 1/2/3）与「是否强制弹出定位组件」。
 * 同 nav：不走 basicMixins，自己维护 result；页面设置 / 分享配置两个子面板未迁移，
 * mainPageChange / shareChange 回调已留好。
 *
 * 风格示意图 nav-location/location-style-*.png 平台端无资源，
 * diy-style 弹窗里会显示占位，但选择逻辑与写回数据完全正常。
 */
import { deepClone, getObjValue } from '../../controls/utils';

export default {
  name: 'NavLocationStyle',
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

      forceType: 1,
      forceTypeList: [
        { label: '是', value: '1' },
        { label: '否', value: '2' },
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
      // PHP 侧用 align-*.png，平台端无资源，改文字标签
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

      imgInfo: [
        { img: 'nav-location/location-style-1.png', text: '风格1', desc: '(进入首页不需定位)', type: 1 },
        { img: 'nav-location/location-style-2.png', text: '风格2', desc: '(进入首页要求定位)', type: 2 },
        { img: 'nav-location/location-style-3.png', text: '风格3', desc: '(要求定位，社区团购专用)', type: 3 },
      ],
      imgIndex: 0,

      defaultForm: {
        titleBgColor: [{ name: '底部背景', color: 'transparent', showAlpha: false }],
        statusBarColor: [{ name: '背景颜色', color: 'transparent', showAlpha: true }],
        searchColor: [
          { name: '文字颜色', color: 'transparent', showAlpha: false },
          { name: '背景颜色', color: 'transparent', showAlpha: true },
        ],
        titleDistance: [],
        searchDistance: [],
        searchMarPad: [],
        iconSize: [],
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

      this.setValue('statusBar', cs.statusBar);
      this.setValue('border', cs.border);
      this.setValue('searchPosition', cs.searchPosition);
      this.setValue('searchBorder', cs.searchBorder);
      this.setValue('isShowSearch', d.isShowSearch);
      this.setValue('isShowName', d.isShowName);
      this.setValue('name', d.name);
      this.setValue('placeholder', d.placeholder);
      this.setValue('positionChoose', d.positionChoose);
      this.setValue('forceType', d.forceType);
      this.setValue('styleChoose', d.styleChoose);
      this.setValue('hideSearch', d.hideSearch);
      this.setValue('contentType', d.contentType);
      if (d.locationStyle) this.imgIndex = d.locationStyle - 1;

      this.defaultForm.titleBgColor = [
        {
          name: '底部背景',
          color: getObjValue(this.result, ['computedStyle', 'titleBgColor'], 'transparent'),
          showAlpha: true,
        },
      ];
      this.defaultForm.statusBarColor = [
        {
          name: '背景颜色',
          color: getObjValue(this.result, ['computedStyle', 'statusBarColor'], 'transparent'),
          showAlpha: true,
        },
      ];
      this.defaultForm.searchColor = [
        {
          name: '文字颜色',
          color: getObjValue(this.result, ['computedStyle', 'searchColor'], 'transparent'),
          showAlpha: false,
        },
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
        { name: '左侧距离', value: getObjValue(this.result, ['computedStyle', 'titleDistance', 'marginLeft'], 20), unit: 'px', disabled: false, maxValue: 100 },
      ];
      this.defaultForm.searchDistance = [
        { name: '文字大小', value: getObjValue(this.result, ['computedStyle', 'searchDistance', 'fontSize'], 16), unit: 'px', disabled: false, maxValue: 20 },
        { name: '高度', value: getObjValue(this.result, ['computedStyle', 'searchDistance', 'height'], 29), unit: 'px', disabled: false, maxValue: 44 },
      ];
      this.defaultForm.searchMarPad = [
        { name: '左侧距离', value: getObjValue(this.result, ['computedStyle', 'searchMarPad', 'marginLeft'], 20), unit: 'px', disabled: false, maxValue: 200 },
        { name: '左内边距', value: getObjValue(this.result, ['computedStyle', 'searchMarPad', 'paddingLeft'], 0), unit: 'px', disabled: false, maxValue: 100 },
      ];
      this.defaultForm.iconSize = [
        { name: '图标大小', value: getObjValue(this.result, ['computedStyle', 'iconSize', 'size'], 0), unit: 'px', disabled: false, maxValue: 40 },
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
      if (arr && arr[0]) this.result.data[type] = arr[0].imgUrl;
      this.$emit('update', this.result);
    },
    // 选择定位风格：风格 1 不显示搜索框，且小程序胶囊位置随之切换
    upImgIndex(index) {
      this.imgIndex = index;
      const style = index + 1;
      this.result.data.locationStyle = style;
      this.result.data.isShowSearch = style == 1 ? 0 : 1;
      this.isShowSearch = this.result.data.isShowSearch;
      this.result.computedStyle.statusCapsule = style == 1 ? 1 : 2;
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
.diy-nav-tabs {
  ::v-deep .el-radio-group {
    width: 100%;
  }
  ::v-deep .el-radio-button {
    width: 33.33%;
  }
  ::v-deep .el-radio-button__inner {
    width: 100%;
  }
}
.not-migrated {
  padding: 12px;
}
/* 定位风格选择：不依赖图片资源 */
.loc-style-list {
  display: flex;
  gap: 8px;
}
.loc-style-item {
  flex: 1;
  padding: 10px 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  &.active {
    border-color: #409eff;
    background: #ecf5ff;
  }
}
.loc-style-name {
  font-size: 13px;
  color: #303133;
}
.loc-style-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 16px;
  color: #909399;
}
</style>
