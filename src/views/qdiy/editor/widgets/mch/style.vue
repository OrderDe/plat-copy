<template>
  <div>
    <diy-style-contain title="标题">
      <el-radio-group v-model="titleRadio" @change="radioChange($event, 'titleRadio')">
        <el-radio :label="0">隐藏</el-radio>
        <el-radio :label="1">显示</el-radio>
      </el-radio-group>
      <div v-if="titleRadio == 1" class="title-list">
        <diy-operation-list v-model="titleList" @on-change="() => updataList('titleList')" />
      </div>
    </diy-style-contain>

    <diy-style-contain title="按钮样式">
      <el-radio-group v-model="btnData.style" @change="btnChange($event, 'style')">
        <el-radio :label="0">样式1</el-radio>
      </el-radio-group>
      <div class="btn-text-row">
        <div class="btn-text-name">按钮文字</div>
        <el-input
          v-model="btnData.name"
          size="small"
          placeholder="请输入内容"
          maxlength="4"
          show-word-limit
          @input="btnChange($event, 'name')"
        />
      </div>
    </diy-style-contain>

    <diy-style-contain title="选择商户">
      <div class="pick-mch">
        <merchantName :multiple="true" :mer-id-checked="selectIds" @getMerId="onMerChange" />
        <div class="mch-tip">已选 {{ selectIds.length }} / {{ maxGroupLen }}</div>
      </div>
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
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />
  </div>
</template>

<script>
/**
 * 多商户 —— 属性面板。迁移自 PHP common/mch/style.php
 *
 * 商户选择：PHP 用 com-pick-link（tab = marketing/mch）返回 {params:{id,img}}，
 * 平台端换成 @/components/merchantName 多选下拉，只能拿到商户 id，
 * 因此 data.goods 里只写 {params:{id}}，画布上用占位卡片，App 端按 id 取真实商户信息。
 */
import merchantName from '@/components/merchantName';
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'MchStyle',
  components: { merchantName },
  mixins: [basicMixins],
  data() {
    return {
      titleRadio: 0,
      titleList: [
        { type: 'input', label: '文字', value: '新品推荐', max: 6, showLimit: true, setKey: 'title' },
        { type: 'size', label: '上边距', value: 10, setKey: 'paddingTop', maxValue: 20 },
        { type: 'size', label: '下边距', value: 10, setKey: 'paddingBottom', maxValue: 20 },
      ],
      maxGroupLen: 30,
      btnData: { style: 0, name: '立即拼团' },
      colorInfos: ['底部背景', '商品背景'],
      defColor: ['#FAFAFA', '#FFFFFF'],
      sizeInfos: ['商品间距', '上边距', '下边距', '左右边距'],
      sizeInfosValue: [0, 0, 0, 0],
      sizeInfosMax: [50, 50, 50, 20],
      pickImgList: [],
    };
  },
  computed: {
    selectIds() {
      return this.pickImgList.map((it) => it.params && it.params.id).filter((id) => id !== undefined);
    },
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.titleRadio = this.result.data.titleRadio || 0;
      if (this.result.data.btnData) {
        this.btnData = this.result.data.btnData;
      } else {
        this.$set(this.result.data, 'btnData', this.btnData);
      }
      this.pickImgList = getObjValue(this.result, ['data', 'goods'], []);
      this.initList('titleList');
    },
    onMerChange(ids) {
      let list = (Array.isArray(ids) ? ids : [ids]).filter((id) => id !== null && id !== '');
      if (list.length > this.maxGroupLen) {
        this.$message({ message: `最多添加${this.maxGroupLen}个商户噢`, type: 'warning' });
        list = list.slice(0, this.maxGroupLen);
      }
      this.pickImgList = list.map((id) => ({ params: { id } }));
      this.$set(this.result.data, 'goods', this.pickImgList);
      this.$emit('update', this.result);
    },
    radioChange(e, name) {
      this.updataData(e, name);
    },
    btnChange(e, name) {
      this.$set(this.result.data.btnData, name, e);
      this.$emit('update', this.result);
    },
    // titleList 的值写进 data（PHP 侧也是写 data，不是 computedStyle）
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
    updateColor(arr) {
      this.updateSome(arr, 'colorInfos');
      const cs = this.result.computedStyle;
      ['boxBg', 'goodsBg'].forEach((key, i) => {
        cs[key] = this.colorInfos[i] && this.colorInfos[i].color;
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
    updateSome(val, name) {
      this[name] = val;
      if (this.result.data[name] && this.result.data[name].length) {
        this[name] = this.result.data[name];
      } else {
        this.$set(this.result.data, name, this[name]);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.title-list {
  padding-top: 10px;
}
.btn-text-row {
  display: flex;
  align-items: center;
  margin-top: 15px;

  .btn-text-name {
    width: 60px;
    flex-shrink: 0;
    text-align: right;
    padding-right: 8px;
    margin-right: 15px;
    color: #333;
  }
}
.pick-mch {
  background: #f4f3f7;
  border-radius: 4px;
  padding: 15px;
}
.mch-tip {
  padding-top: 8px;
  color: #999;
  font-size: 12px;
}
</style>
