<template>
  <div>
    <diy-style top-name="选择风格" :img-info="imgInfo" :def-index="imgIndex" @change="upImgIndex" />

    <diy-style-contain title="选择商户">
      <div class="merchant-select-box">
        <merchantName :multiple="true" :mer-id-checked="selectIds" @getMerId="onMerChange" />
        <div class="mch-tip">已选 {{ selectIds.length }} 个商户；未选择时画布展示示例商户</div>
      </div>
    </diy-style-contain>

    <diy-style-contain title="显示内容">
      <div class="diy-checkbox-container">
        <el-checkbox-group v-model="content" @change="contentChange">
          <el-checkbox v-for="(item, index) in showContentList" :key="index" :label="item.label">
            {{ item.value }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </diy-style-contain>

    <diy-style-contain title="按钮设置">
      <diy-operation-list v-model="list" @on-change="() => updataList('list')" />
      <div class="tips-text">注：点击商户logo或名称进入商户店铺首页</div>
    </diy-style-contain>

    <diy-style-contain v-if="imgIndex > 0" title="商品设置">
      <diy-operation-list v-model="shopSetList" @on-change="() => updataList('shopSetList')">
        <template v-slot:slider="{ item }">
          <div class="row">
            <div class="leabl">{{ item.label }}</div>
            <div class="ctrl">
              <el-slider v-model="item.value" style="width: 165px" :min="1" :max="10" @change="() => updataList('shopSetList')" />
              <el-input :value="item.value" style="width: 86px; margin-left: 16px" size="mini" readonly>
                <template slot="append">条</template>
              </el-input>
            </div>
          </div>
        </template>
        <template v-slot:select="{ item }">
          <div class="row">
            <div class="leabl">{{ item.label }}</div>
            <el-select v-model="item.value" placeholder="请选择" size="small" @change="() => updataList('shopSetList')">
              <el-option v-for="it in item.list" :key="it.value" :label="it.label" :value="it.value" />
            </el-select>
          </div>
        </template>
      </diy-operation-list>
    </diy-style-contain>

    <diy-tabs title="组件样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />
    <diy-color :color-infos="colorInfos" :str-color="defColor" @change="updateColor" />
    <diy-size-setting
      top-name="组件边距"
      :size-infos="sizeInfos"
      :size-infos-value="sizeInfosValue"
      :size-infos-max="sizeInfosMax"
      @change="updateSize"
    />
    <diy-size-setting
      top-name="圆角设置"
      :size-infos="radiusInfos"
      :size-infos-value="sizeInfosRadius"
      :max-value="20"
      @change="RadiusChange"
    />
  </div>
</template>

<script>
/**
 * 商户信息 —— 属性面板。迁移自 PHP common/merchant-info/style.php
 *
 * 商户选择：PHP 侧的「+ 添加」在原实现里也只是把两条示例数据写进 data.merchantList
 * （addMerchants 里写死），并没有真正的选择弹窗。平台端接上 @/components/merchantName，
 * 选中的商户 id 写入 data.merchantIds；未选择时仍写入两条示例数据供画布展示。
 */
import merchantName from '@/components/merchantName';
import basicMixins from '../../controls/basicMixins';

const DEMO_MERCHANTS = [
  {
    logo: '',
    merchant_name: '店铺名称',
    merchant_desc: '商户简介',
    username: '张三',
    mobile: '13800138000',
    sales_num: 888888,
    address: '珠光街道东濠涌高架路乳山口镇金银大道',
  },
  {
    logo: '',
    merchant_name: '店铺名称2',
    merchant_desc: '商户简介',
    username: '里斯',
    mobile: '13888888888',
    sales_num: 1000,
    address: '乳山口镇金银大道',
  },
];

const EXTRA_CONTENT = [
  { value: '商户简介', label: 'intro' },
  { value: '商户地址', label: 'address' },
];

export default {
  name: 'MerchantInfoStyle',
  components: { merchantName },
  mixins: [basicMixins],
  data() {
    return {
      imgInfo: [
        { img: 'merch-style1.png', text: '风格1', type: 1 },
        { img: 'merch-style2.png', text: '风格2', type: 2 },
        { img: 'merch-style3.png', text: '风格3', type: 3 },
      ],
      imgIndex: 0,
      selectIds: [],
      showContentList: [
        { value: '商户LOGO', label: 'logo' },
        { value: '商户名称', label: 'name' },
        { value: '商户简介', label: 'intro' },
        { value: '商户地址', label: 'address' },
        { value: '出售商品数', label: 'sales' },
      ],
      list: [
        { type: 'input', label: '文字', showLimit: true, max: 5, value: '进入店铺', setKey: 'input' },
        {
          type: 'radio',
          label: '点击',
          value: 'enter',
          setKey: 'optionbar',
          list: [
            { value: '进入店铺', label: 'enter' },
            { value: '关注店铺', label: 'attention' },
            { value: '查看地图', label: 'map' },
          ],
        },
      ],
      shopSetList: [
        { slot: 'slider', type: 'slider', label: '显示条数', value: 1, setKey: 'sliderNum' },
        {
          slot: 'select',
          type: 'select',
          label: '排序',
          value: '1',
          setKey: 'selectText',
          list: [
            { value: '1', label: '按销量' },
            { value: '2', label: '按权重' },
            { value: '3', label: '按访问量' },
          ],
        },
      ],
      content: ['logo', 'name', 'intro', 'address', 'sales'],
      colorInfos: ['底部背景', '组件背景', '商户名称', '商户简介', '商户地址', '按钮颜色', '按钮边框', '按钮背景'],
      defColor: ['transparent', '#fff', '#3d404d', '#3d404d', '#5e6066', '#fff', '#f55', '#f55'],
      colorArr: ['bottomBg', 'componentBg', 'nameColor', 'introColor', 'addrColor', 'btnTextColor', 'btnBorder', 'btnBg'],
      sizeInfos: ['间距', '上边距', '下边距', '左右边距'],
      sizeInfosValue: [0, 12, 12, 12],
      sizeInfosMax: [50, 50, 50, 20],
      radiusInfos: ['上圆角', '下圆角'],
      sizeInfosRadius: [4, 4],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.content = this.result.data.content || this.content;
      this.selectIds = this.result.data.merchantIds || [];
      if (this.result.data.titleStyle) {
        const i = this.imgInfo.findIndex((item) => item.type === this.result.data.titleStyle.type);
        if (i > -1) this.imgIndex = i;
      }
      if (!this.result.data.merchantList) {
        this.$set(this.result.data, 'merchantList', DEMO_MERCHANTS);
        this.$emit('update', this.result);
      }
      this.applyStyleContent();
      this.initList('list');
      this.initList('shopSetList');
    },
    onMerChange(ids) {
      this.selectIds = (Array.isArray(ids) ? ids : [ids]).filter((id) => id !== null && id !== '');
      this.updataData(this.selectIds, 'merchantIds');
    },
    upImgIndex(index, item) {
      this.imgIndex = index;
      this.applyStyleContent();
      this.updataData(item, 'titleStyle');
    },
    /** 风格 2/3 多两个商品配色；风格 3 不显示简介与地址 */
    applyStyleContent() {
      const extraColors = [
        { color: '#3d404d', name: '商品标题', showAlpha: false, value: '#3d404d' },
        { color: '#fd463e', name: '商品价格', showAlpha: false, value: '#fd463e' },
      ];
      if (this.imgIndex > 0) {
        if (!this.colorArr.includes('goodsTitleColor')) {
          this.colorInfos = this.colorInfos.concat(extraColors);
          this.colorArr = this.colorArr.concat(['goodsTitleColor', 'goodsPriceColor']);
        }
      } else if (this.colorArr.includes('goodsTitleColor')) {
        this.colorInfos = this.colorInfos.slice(0, this.colorInfos.length - 2);
        this.colorArr = this.colorArr.slice(0, this.colorArr.length - 2);
      }

      if (this.imgIndex === 2) {
        this.showContentList = this.showContentList.filter((it) => it.label !== 'intro' && it.label !== 'address');
        this.content = this.content.filter((it) => it !== 'intro' && it !== 'address');
      } else if (!this.showContentList.some((it) => it.label === 'intro')) {
        this.showContentList = this.showContentList.slice(0, 2).concat(EXTRA_CONTENT, this.showContentList.slice(2));
        this.content = this.content.slice(0, 2).concat(['intro', 'address'], this.content.slice(2));
      }
    },
    contentChange(e) {
      this.updataData(e, 'content');
    },
    updateColor(arr) {
      this.updateSome(arr, 'colorInfos');
      const cs = this.result.computedStyle;
      this.colorArr.forEach((key, i) => {
        if (this.colorInfos[i]) cs[key] = this.colorInfos[i].color;
      });
      this.$emit('update', this.result);
    },
    updateSize(arr) {
      this.updateSome(arr, 'sizeInfos');
      const cs = this.result.computedStyle;
      ['spacing', 'marginTop', 'marginBottom', 'aroundMargin'].forEach((key, i) => {
        if (this.sizeInfos[i]) cs[key] = this.sizeInfos[i].value + this.sizeInfos[i].unit;
      });
      this.$emit('update', this.result);
    },
    updateSome(arr, name) {
      this[name] = arr;
      if (this.result.data[name] && this.result.data[name].length) {
        this[name] = this.result.data[name];
      } else {
        this.$set(this.result.data, name, this[name]);
      }
    },
    // list / shopSetList 的值写进 data
    initList(target) {
      const data = this.result.data;
      if (!this[target] || !this[target].length) return;
      this[target] = this[target].map((item) => {
        const obj = Object.assign({}, item);
        if (item.setKey in data && data[item.setKey] !== '') obj.value = data[item.setKey];
        return obj;
      });
    },
    updataList(target) {
      this[target].forEach((item) => {
        if (item.setKey) this.$set(this.result.data, item.setKey, item.value);
      });
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.merchant-select-box {
  background: #f4f3f7;
  border-radius: 4px;
  padding: 15px;
}
.mch-tip,
.tips-text {
  padding-top: 8px;
  color: #999;
  font-size: 12px;
}
.diy-checkbox-container ::v-deep .el-checkbox {
  margin-bottom: 5px;
  margin-right: 20px;
}
.row {
  display: flex;
  align-items: center;
  padding-bottom: 10px;

  .leabl {
    width: 60px;
    flex-shrink: 0;
    text-align: right;
    padding-right: 8px;
    color: #999;
  }
  .ctrl {
    display: flex;
    align-items: center;
  }
}
</style>
