<template>
  <div>
    <template v-if="imgIndex == 0">
      <diy-goods-info-style
        :img-info="styleInfo"
        :def-index="styleIndex"
        :img-style="{ width: '206px', height: 'auto' }"
        @change="upStyleImgIndex"
      />

      <diy-style-contain title="内容设置">
        <el-checkbox-group v-model="goodsData.checkList" @change="checkboxChange">
          <el-checkbox v-for="(it, i) in contArr" :key="i" :label="it.type">{{ it.name }}</el-checkbox>
        </el-checkbox-group>
      </diy-style-contain>

      <diy-style-contain title="会员价设置">
        <el-checkbox-group v-model="goodsData.checkList" @change="checkboxChange">
          <el-checkbox v-for="(it, i) in memberArr" :key="i" :label="it.type">{{ it.name }}</el-checkbox>
        </el-checkbox-group>
      </diy-style-contain>
    </template>

    <template v-if="imgIndex == 1">
      <diy-style-contain title="分享">
        <el-radio-group v-model="goodsData.share" @change="changes($event, 'share')">
          <el-radio :label="1">显示</el-radio>
          <el-radio :label="0">隐藏</el-radio>
        </el-radio-group>
      </diy-style-contain>
      <diy-style-contain title="商品价格">
        <el-radio-group v-model="goodsData.price" @change="changes($event, 'price')">
          <el-radio :label="1">区间值</el-radio>
          <el-radio :label="0">最低价</el-radio>
        </el-radio-group>
      </diy-style-contain>
      <diy-style-contain title="分销佣金">
        <el-radio-group v-model="goodsData.commission" @change="changes($event, 'commission')">
          <el-radio :label="1">显示</el-radio>
          <el-radio :label="0">隐藏</el-radio>
        </el-radio-group>
      </diy-style-contain>
      <diy-style-contain title="活动入口">
        <el-radio-group v-model="goodsData.entrance" @change="changes($event, 'entrance')">
          <el-radio :label="1">显示</el-radio>
          <el-radio :label="0">隐藏</el-radio>
        </el-radio-group>
      </diy-style-contain>
      <diy-style-contain title="快递">
        <div class="radio-box">
          <el-radio-group v-model="goodsData.delivery" @change="changes($event, 'delivery')">
            <el-radio :label="1">区间值</el-radio>
            <el-radio :label="0">最低价</el-radio>
          </el-radio-group>
        </div>
        <div class="goods-text">快递由各商品设置自动展现，无需编辑</div>
      </diy-style-contain>
      <diy-style-contain title="销量">
        <div class="goods-text">销量由各商品设置自动展现，无需编辑</div>
      </diy-style-contain>
      <diy-style-contain title="库存">
        <div class="goods-text">库存由各商品设置自动展现，无需编辑</div>
      </diy-style-contain>
    </template>
  </div>
</template>

<script>
/**
 * 商品信息 —— 属性面板。迁移自 PHP common/goods-info/style.php
 *
 * PHP 侧 mounted 里调 mall/diy/get-addons-fields 追加插件扩展字段到内容设置里，
 * Java 侧无该接口，未迁移；固定的 12 项内容配置与会员价配置照搬。
 */
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'GoodsInfoStyle',
  mixins: [basicMixins],
  data() {
    return {
      // PHP 侧风格 2 已被注释掉，只留风格 1
      styleInfo: [{ img: 'goods/style-1.png', text: '风格1', type: 1 }],
      imgIndex: 0,
      styleIndex: 0,
      contArr: [
        { name: '价格', type: 'price' },
        { name: '收藏', type: 'collect' },
        { name: '分享', type: 'share' },
        { name: '标题', type: 'title' },
        { name: '副标题', type: 'subtitle' },
        { name: '销量', type: 'sale' },
        { name: '领券', type: 'coupon' },
        { name: '服务', type: 'serve' },
        { name: '库存', type: 'stock' },
        { name: '会员优惠', type: 'memberPrice' },
        { name: '商品标签', type: 'shopTag' },
        { name: '积分抵扣', type: 'scoreDeduct' },
      ],
      memberArr: [{ name: '普通用户显示会员价', type: 'memberPriceFlag' }],
      goodsData: {
        share: 1,
        price: 0,
        commission: 1,
        entrance: 1,
        delivery: 1,
        checkList: [
          'price',
          'collect',
          'share',
          'title',
          'subtitle',
          'sale',
          'coupon',
          'serve',
          'stock',
          'memberPrice',
          'shopTag',
          'memberPriceFlag',
          'scoreDeduct',
        ],
      },
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.result.data.goodsInfoStyle) {
        const i = this.styleInfo.findIndex((item) => item.type === this.result.data.goodsInfoStyle.type);
        if (i > -1) this.styleIndex = i;
      }
      if (this.result.data.goodsData) {
        this.goodsData = this.result.data.goodsData;
      } else {
        this.$set(this.result.data, 'goodsData', this.goodsData);
        this.$emit('update', this.result);
      }
    },
    upStyleImgIndex(e, item) {
      this.styleIndex = e;
      this.$set(this.result.data, 'goodsInfoStyle', item);
      this.$emit('update', this.result);
    },
    checkboxChange() {
      this.$set(this.result.data.goodsData, 'checkList', this.goodsData.checkList);
      this.$emit('update', this.result);
    },
    changes(e, name) {
      this.$set(this.result.data.goodsData, name, e);
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.radio-box {
  margin-bottom: 20px;
}
.goods-text {
  display: inline-block;
  padding: 10px 15px;
  background: rgba(255, 99, 104, 0.52);
  border-radius: 5px;
  font-size: 13px;
}
</style>
