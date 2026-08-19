<template>
  <div>
    <diy-style-contain title="背景设置">
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

    <diy-style-contain title="账户设置">
      <diy-operation-list v-model="accountSettings" @on-change="() => updataList('accountSettings')" />
    </diy-style-contain>

    <diy-style-contain title="按钮设置">
      <diy-operation-list v-model="btnSettings" @on-change="() => updataList('btnSettings')" />

      <div class="row">
        <div class="row-label">隐藏账户详情</div>
        <el-radio-group v-model="dependentInfo.isHiddenDetail" @change="handleDependentChange($event, 'isHiddenDetail')">
          <el-radio :label="0">显示</el-radio>
          <el-radio :label="1">隐藏</el-radio>
        </el-radio-group>
      </div>
      <div class="row">
        <div class="row-label">隐藏金额单位</div>
        <el-radio-group v-model="dependentInfo.isHiddenUnit" @change="handleDependentChange($event, 'isHiddenUnit')">
          <el-radio :label="0">显示</el-radio>
          <el-radio :label="1">隐藏</el-radio>
        </el-radio-group>
      </div>
      <div class="row">
        <div class="row-label">卡片文案</div>
        <el-input
          v-model="dependentInfo.cardText"
          size="small"
          placeholder="请输入内容"
          maxlength="8"
          show-word-limit
          @input="handleDependentChange($event, 'cardText')"
        />
      </div>
    </diy-style-contain>

    <diy-style-contain title="提醒设置">
      <div class="row">
        <div class="row-label">自定义</div>
        <el-input
          v-model="reminderInfo.text"
          size="small"
          placeholder="请输入内容"
          maxlength="20"
          show-word-limit
          @input="reminderChange($event, 'text')"
        />
      </div>
      <diy-operation-list v-model="reminderSettings" @on-change="() => updataList('reminderSettings')" />
      <diy-operation-list v-model="reminderImgList" @on-change="() => updataList('reminderImgList')">
        <template slot="tips">
          <div class="tips-text">建议尺寸：24 * 24</div>
        </template>
      </diy-operation-list>
    </diy-style-contain>

    <diy-style-contain title="组件边距">
      <diy-operation-list v-model="compMargin" @on-change="() => updataList('compMargin')" />
    </diy-style-contain>

    <diy-style-contain title="圆角设置">
      <diy-operation-list v-model="radiusSets" @on-change="() => updataList('radiusSets')" />
    </diy-style-contain>
  </div>
</template>

<script>
/** 分销信息 —— 属性面板。迁移自 PHP common/commission-info/style.php */
import { deepClone } from '../../controls/utils';

export default {
  name: 'CommissionInfoStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      result: {},
      dependentInfo: { isHiddenDetail: 0, isHiddenUnit: 0, cardText: '我的收益（元）' },
      reminderInfo: { text: '每月25~31号可提现结算收益' },
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
      ],
      selectBackList: [{ type: 'color', label: '', value: '#E40A0A', setKey: 'tabSelectColor' }],
      selectImgList: [{ type: 'image', label: '', value: '', setKey: 'tabSelectImg' }],
      accountSettings: [
        { type: 'color', label: '我的收益', value: '#ffffff', setKey: 'myIncomeColor' },
        { type: 'color', label: '金额', value: '#ffffff', setKey: 'moneyColor' },
      ],
      btnSettings: [
        { type: 'color', label: '提现', value: '#965757', setKey: 'withdrawBtnColor' },
        { type: 'color', label: '账户详情', value: '#965757', setKey: 'accountDetailsBtnColor' },
      ],
      reminderSettings: [{ type: 'color', label: '背景色', value: '#965757', setKey: 'reminderBgColor' }],
      reminderImgList: [{ type: 'image', label: '图标', value: '', setKey: 'reminderImg' }],
      compMargin: [
        { type: 'size', label: '上边距', value: 10, setKey: 'compMarginTop', maxValue: 20 },
        { type: 'size', label: '下边距', value: 10, setKey: 'compMarginBot', maxValue: 20 },
        { type: 'size', label: '左右边距', value: 10, setKey: 'compMarginLR', maxValue: 20 },
      ],
      radiusSets: [
        { type: 'size', label: '上圆角', value: 10, setKey: 'compRadiusTop', maxValue: 20 },
        { type: 'size', label: '下圆角', value: 10, setKey: 'compRadiusBot', maxValue: 20 },
      ],
    };
  },
  created() {
    this.result = deepClone(this.activeItem);
    if (!this.result.computedStyle || Array.isArray(this.result.computedStyle)) {
      this.$set(this.result, 'computedStyle', {});
    }
    if (!this.result.data) this.$set(this.result, 'data', {});

    this.dependentInfo = Object.assign(this.dependentInfo, this.result.data.dependentInfo || {});
    this.reminderInfo = Object.assign(this.reminderInfo, this.result.data.reminderInfo || {});

    [
      'bgSetList',
      'selectBackList',
      'selectImgList',
      'accountSettings',
      'btnSettings',
      'reminderSettings',
      'reminderImgList',
      'compMargin',
      'radiusSets',
    ].forEach((t) => this.initList(t));
  },
  methods: {
    initList(target) {
      const data = this.result.computedStyle;
      if (!this[target] || !this[target].length) return;
      this[target] = this[target].map((item) => {
        const obj = Object.assign({}, item);
        if (item.setKey in data && data[item.setKey] !== '') {
          obj.value = data[item.setKey];
        } else {
          data[item.setKey] = obj.value;
        }
        return obj;
      });
    },
    updataList(target) {
      this[target].forEach((item) => {
        if (item.setKey) this.updateStyle(item.setKey, item.value);
      });
    },
    handleDependentChange(value, key) {
      this.dependentInfo = Object.assign({}, this.dependentInfo, { [key]: value });
      this.updateData('dependentInfo', this.dependentInfo);
    },
    reminderChange(value, key) {
      this.reminderInfo = Object.assign({}, this.reminderInfo, { [key]: value });
      this.updateData('reminderInfo', this.reminderInfo);
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
.item-row {
  display: flex;
  align-items: center;
}
.diy-operation-name {
  width: 70px;
  color: #999;
  flex-shrink: 0;
}
.row {
  display: flex;
  align-items: center;
  padding: 6px 0;

  .row-label {
    width: 90px;
    flex-shrink: 0;
    text-align: right;
    padding-right: 10px;
    color: #999;
  }
}
.tips-text {
  color: #999;
  font-size: 12px;
}
</style>
