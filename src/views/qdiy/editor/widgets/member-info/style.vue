<template>
  <div>
    <diy-style top-name="选择风格" :img-info="imgInfo" :def-index="imgIndex" @change="changeStyle" />
    <div v-if="imgIndex == 1" class="style-tips">
      <div>请在下方【风格模式-自定义-卡片背景】中选择背景色。</div>
      <div>背景图片可在【页面设置】中单独修改。</div>
    </div>

    <diy-style-contain title="风格模式">
      <diy-operation-list v-model="styleMode" @on-change="() => updataList('styleMode')" />
    </diy-style-contain>

    <diy-style-contain v-if="styleMode[0].value == 1" title="背景设置">
      <diy-operation-list v-model="bgSetList" @on-change="() => updataList('bgSetList')">
        <template v-slot:selectback="{ item }">
          <div class="item-row">
            <div class="diy-operation-name">{{ item.label }}</div>
            <el-radio-group v-model="item.value" @change="() => updataList('bgSetList')">
              <el-radio v-for="(childItem, j) in item.list" :key="j" :label="childItem.label">
                {{ childItem.value }}
              </el-radio>
            </el-radio-group>
          </div>
          <div v-if="item.value == 1">
            <diy-operation-list v-model="selectBackList" @on-change="() => updataList('selectBackList')" />
          </div>
          <div v-if="item.value == 2">
            <diy-operation-list v-model="selectImgList" @on-change="() => updataList('selectImgList')">
              <template slot="tips">
                <div class="tips-text">建议尺寸：355 * 200</div>
              </template>
            </diy-operation-list>
          </div>
        </template>
      </diy-operation-list>
    </diy-style-contain>

    <diy-style-contain title="内容设置">
      <diy-operation-list v-model="contSet1" @on-change="() => updataList('contSet1')" />
      <diy-operation-list v-model="contSet2" @on-change="onAssetChange" />
      <div class="currency-row">
        <span class="currency-label">显示样式</span>
        <el-radio-group v-model="currencyStyle" @change="onChangeCurrencyStyle">
          <el-radio v-for="(v, k) in currencyStyleList" :key="k" :label="v.value">{{ v.label }}</el-radio>
        </el-radio-group>
      </div>
    </diy-style-contain>

    <diy-style-contain v-if="styleMode[0].value == 1" title="会员设置">
      <diy-operation-list v-model="memberSettings" @on-change="() => updataList('memberSettings')" />
    </diy-style-contain>

    <diy-style-contain v-if="styleMode[0].value == 1" title="资产设置">
      <diy-operation-list v-model="assetSettings" @on-change="() => updataList('assetSettings')" />
    </diy-style-contain>

    <diy-style-contain v-if="styleMode[0].value == 1" title="组件边距">
      <diy-operation-list v-model="compMargin" @on-change="() => updataList('compMargin')" />
    </diy-style-contain>

    <diy-style-contain v-if="styleMode[0].value == 1" title="圆角设置">
      <diy-operation-list v-model="radiusSets" @on-change="() => updataList('radiusSets')" />
    </diy-style-contain>
  </div>
</template>

<script>
/**
 * 会员信息 —— 属性面板。迁移自 PHP common/member-info/style.php
 *
 * 未迁移的两处（均依赖 PHP 侧特有能力，数据结构保持一致）：
 *   1. 资产内容选项 PHP 来自服务端 $capitals，这里用固定的余额/积分/优惠券
 *   2. 风格2 切换时会顺带改「页面设置」的背景图（otherUpdata → updateother 事件），
 *      页面设置面板本身尚未迁移，这里只保留组件自身配置
 */
import { deepClone } from '../../controls/utils';
import { DEFAULT_CAPITALS } from './Card';

export default {
  name: 'MemberInfoStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      result: {},
      imgIndex: 0,
      imgInfo: [
        { img: 'member-info/style1.png', text: '风格1', type: 0 },
        { img: 'member-info/style2.png', text: '风格2', type: 1 },
      ],
      styleMode: [
        {
          type: 'radio',
          label: '',
          isShowLabel: false,
          value: 0,
          list: [
            { label: 0, value: '默认' },
            { label: 1, value: '自定义' },
          ],
          setKey: 'styleMode',
        },
      ],
      contSet1: [
        {
          type: 'checkbox',
          label: '会员内容',
          value: [0, 1, 2, 3],
          list: [
            { label: 1, value: '会员等级' },
            { label: 2, value: '设置' },
            { label: 3, value: '个人主页' },
          ],
          setKey: 'contentList1',
        },
      ],
      contSet2: [
        {
          type: 'checkbox',
          label: '资产内容',
          value: DEFAULT_CAPITALS.map((it) => it.code),
          list: DEFAULT_CAPITALS.map((it) => ({ ...it, label: it.code, value: it.title })),
          setKey: 'contentList2',
        },
      ],
      bgSetList: [
        { type: 'color', label: '背景色', value: '', setKey: 'containBgColor' },
        {
          type: 'radio',
          label: '卡片背景',
          value: 1,
          list: [
            { label: 1, value: '背景色' },
            { label: 2, value: '背景图片' },
          ],
          slot: 'selectback',
          setKey: 'cardBgType',
        },
        { type: 'color', label: '卡片投影', value: '', setKey: 'cardShadowColor' },
        { type: 'color', label: '图标颜色', value: '#ffffff', setKey: 'iconColor' },
        { type: 'color', label: '图标背景', value: '#000000', setKey: 'iconBgColor' },
      ],
      selectBackList: [
        {
          type: 'color',
          label: '',
          value: '#E40A0A',
          setKey: 'tabSelectColor',
          predefineColors: ['#F54B4A', '#4985E9', '#AA4DF1', '#1EB83D', '#FF508C'],
        },
      ],
      selectImgList: [{ type: 'image', label: '', value: '', setKey: 'tabSelectImg' }],
      memberSettings: [
        { type: 'color', label: '昵称颜色', value: '#ffffff', setKey: 'nameColor' },
        { type: 'color', label: '等级背景', value: '#000000', setKey: 'memBgColor' },
        { type: 'color', label: '等级颜色', value: '#ffffff', setKey: 'memColor' },
      ],
      assetSettings: [{ type: 'color', label: '文字颜色', value: '#ffffff', setKey: 'assetColor' }],
      compMargin: [
        { type: 'size', label: '上边距', value: 10, setKey: 'compMarginTop', maxValue: 20 },
        { type: 'size', label: '下边距', value: 10, setKey: 'compMarginBot', maxValue: 20 },
        { type: 'size', label: '左右边距', value: 10, setKey: 'compMarginLR', maxValue: 20 },
      ],
      radiusSets: [
        { type: 'size', label: '上圆角', value: 10, setKey: 'compRadiusTop', maxValue: 20 },
        { type: 'size', label: '下圆角', value: 10, setKey: 'compRadiusBot', maxValue: 20 },
      ],
      currencyStyleList: [
        { value: 1, label: '一行显示' },
        { value: 2, label: '多行显示' },
      ],
      currencyStyle: 1,
    };
  },
  watch: {
    // 风格2 的资产区可配的项更多，与 PHP 侧 assetObj 一致
    imgIndex: {
      immediate: true,
      handler(val) {
        this.assetSettings =
          val === 0
            ? [{ type: 'color', label: '文字颜色', value: '#ffffff', setKey: 'assetColor' }]
            : [
                { type: 'color', label: '资产背景', value: '#965757', setKey: 'assetBgUrl' },
                { type: 'size', label: '透明度', value: 0, setKey: 'assetOpacity' },
                { type: 'color', label: '文字颜色', value: '#ffffff', setKey: 'assetColor' },
                { type: 'image', label: '余额图标', value: '', setKey: 'assetBalanceUrl' },
                { type: 'image', label: '积分图标', value: '', setKey: 'assetIntegralUrl' },
              ];
      },
    },
  },
  created() {
    this.init();
  },
  methods: {
    init() {
      this.result = deepClone(this.activeItem);
      // 兼容旧数据：computedStyle 可能是数组，导致无法赋值
      if (!this.result.computedStyle || Array.isArray(this.result.computedStyle)) {
        this.$set(this.result, 'computedStyle', {});
      }
      if (!this.result.data) this.$set(this.result, 'data', {});

      ['styleMode', 'contSet1'].forEach((t) => this.initList(t));
      const list = this.initList('contSet2', 'data');
      if (list) this.onAssetChange(list);
      ['bgSetList', 'selectBackList', 'selectImgList', 'memberSettings', 'assetSettings', 'compMargin', 'radiusSets'].forEach(
        (t) => this.initList(t),
      );

      this.upImgIndex(this.result.computedStyle.imgIndex || 0);
      this.currencyStyle = this.result.data.currencyStyle || 1;
      if (!this.result.data.currencyStyle) this.onChangeCurrencyStyle();
    },
    changeStyle(index) {
      this.upImgIndex(index);
    },
    upImgIndex(index) {
      this.imgIndex = index;
      this.updateStyle('imgIndex', index);

      // 风格2 多一组卡片样式选项
      const i = this.bgSetList.findIndex((item) => item.setKey === 'cardStyle');
      if (index === 1 && i === -1) {
        this.bgSetList.splice(2, 0, {
          type: 'checkbox',
          label: '卡片样式',
          value: ['pattern', 'cradient'],
          list: [
            { label: 'pattern', value: '卡片花纹' },
            { label: 'cradient', value: '背景色渐变' },
          ],
          setKey: 'cardStyle',
        });
      } else if (index !== 1 && i !== -1) {
        this.bgSetList.splice(i, 1);
      }

      this.setStyleValue('bgSetList', 'iconColor', index ? '#333333' : '#FFF');
      this.setStyleValue('compMargin', 'compMarginLR', 16);
      ['bgSetList', 'memberSettings', 'compMargin'].forEach((t) => this.updataList(t));
    },
    setStyleValue(listName, setKey, value) {
      this[listName].forEach((item) => {
        if (item.setKey === setKey) item.value = value;
      });
    },
    onAssetChange(event) {
      const data = event && event[0];
      if (!data) return;
      this.updateData('contentList2', data.value);
    },
    onChangeCurrencyStyle() {
      this.updateData('currencyStyle', this.currencyStyle);
    },
    /** 已有值回填控件，没有的把控件默认值写进去 */
    initList(target, key = 'computedStyle') {
      const data = this.result[key];
      if (!this[target] || !this[target].length) return null;
      this[target] = this[target].map((item) => {
        const obj = Object.assign({}, item);
        if (item.setKey in data && data[item.setKey] !== '') {
          obj.value = data[item.setKey];
        } else {
          data[item.setKey] = obj.value;
        }
        return obj;
      });
      return this[target];
    },
    updataList(target) {
      this[target].forEach((item) => {
        if (item.setKey) this.updateStyle(item.setKey, item.value);
      });
    },
    updateStyle(key, value) {
      this.$set(this.result.computedStyle, key, value);
      this.$emit('update', this.result);
    },
    updateData(key, value) {
      this.$set(this.result.data, key, value);
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.style-tips {
  padding: 0 20px 20px;
  color: #f10009;
  font-size: 12px;
}
.item-row {
  display: flex;
  align-items: center;
}
.diy-operation-name {
  width: 70px;
  color: #999;
  flex-shrink: 0;
}
.currency-row {
  display: flex;
  align-items: center;
  padding: 4px 0 0 18px;
}
.currency-label {
  color: #999;
  padding-right: 10px;
}
.tips-text {
  color: #999;
  font-size: 12px;
}
</style>
