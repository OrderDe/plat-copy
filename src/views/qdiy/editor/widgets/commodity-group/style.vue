<template>
  <div class="commodity-group-style">
    <diy-tabs title="样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />

    <diy-style-contain title="风格">
      <el-radio-group v-model="style" @change="onStyleList">
        <el-radio-button v-for="(item, index) in styleList" :key="index" :label="item.label">
          {{ item.text }}
        </el-radio-button>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="选择商品">
      <div class="mb10">
        <el-radio-group v-model="chooseGoods" @change="updateData($event, 'chooseGoods')">
          <el-radio :label="1">手动选择</el-radio>
          <el-radio :label="2">选择分类</el-radio>
          <!-- 变体组件（如 commodity-strategy-group）可追加取数方式 -->
          <el-radio v-for="opt in extraChooseOptions" :key="opt.label" :label="opt.label">{{ opt.text }}</el-radio>
        </el-radio-group>
      </div>

      <diy-goods-group v-if="chooseGoods == 1" :list="pickImgList" title="添加商品" @change="onGoodsChange" />

      <div v-if="chooseGoods == 2" class="cate-box">
        <div class="row">
          <div class="row-label">链接</div>
          <diy-url :text="selectUrl" @add="linkVisible = true" />
        </div>
        <div v-if="selectUrl" class="row-block">
          <el-radio-group v-model="isShowLine" @change="changeShowLine">
            <el-radio :label="1">显示条数</el-radio>
            <el-radio :label="2">无限制</el-radio>
          </el-radio-group>
          <diy-operation-list v-if="isShowLine == 1" v-model="showLineList" @on-change="onLineChange" />
        </div>
        <div class="cate-tip">注：预览仅展示前十个商品，完整商品列表请在移动端查看</div>
      </div>

      <!-- 变体组件追加的取数配置面板 -->
      <slot name="choose-extra" :choose-goods="chooseGoods" />
    </diy-style-contain>

    <diy-style-contain title="显示内容（划线价和会员价同时选择时，优先显示会员价）">
      <el-checkbox-group v-model="contentCheckList" @change="filterSelectContentList">
        <div v-for="(item, index) in showContentList" :key="index" class="content-row">
          <el-checkbox :label="item.label">
            <span>{{ item.name }}</span>
          </el-checkbox>
          <template v-if="!item.disableColor">
            <el-color-picker v-model="item.color" :show-alpha="item.showAlpha" @change="filterSelectContentList" />
            <el-input v-model="item.color" size="mini" class="color-ipt" @input="updateInput($event, item)" />
          </template>
        </div>
      </el-checkbox-group>
    </diy-style-contain>

    <diy-style-contain title="购物车按钮">
      <el-radio-group v-model="shoppingCart" @change="updateData($event, 'showShopCart')">
        <el-radio :label="1">显示</el-radio>
        <el-radio :label="2">隐藏</el-radio>
      </el-radio-group>

      <div v-show="shoppingCart == 1" class="shopping-cart-func">
        <div class="shop-cart-row">
          <div class="leabl">样式</div>
          <diy-tab v-model="shopCartStyleList" :default-index="shopCartStyle" @change="onShopCartStyle">
            <template v-slot="{ item, isSelect }">
              <div class="shop-cart-col" :class="{ selected: isSelect }">{{ item.text }}</div>
            </template>
          </diy-tab>
        </div>

        <div v-if="shopCartStyle == 0" class="shop-cart-row">
          <div class="leabl">文字</div>
          <el-input
            v-model="shopCartText"
            style="flex: 1"
            placeholder="请输入内容"
            maxlength="4"
            size="small"
            show-word-limit
            @input="updateShopCartText"
          />
        </div>

        <div v-if="shopCartStyle != 3" class="shop-cart-row">
          <div class="leabl">颜色</div>
          <div class="ctrl">
            <el-color-picker v-model="shopCartColor" @change="onShopCart($event, 'color')" />
            <el-input v-model="shopCartColor" maxlength="8" size="mini" @input="onShopCart($event, 'color')" />
          </div>
        </div>

        <div v-if="shopCartStyle == 0" class="shop-cart-row">
          <div class="leabl">圆角</div>
          <div class="ctrl">
            <el-slider v-model="shopCartRadius" style="width: 165px" :min="0" :max="20" @change="onShopCart($event, 'borderReduis')" />
            <div class="slider-text">{{ shopCartRadius }}px</div>
          </div>
        </div>

        <div v-if="shopCartStyle != 3" class="shop-cart-row">
          <div class="leabl">背景</div>
          <div class="ctrl">
            <el-color-picker v-model="shopCartBgColor" @change="onShopCart($event, 'backgroundColor')" />
            <el-input v-model="shopCartBgColor" maxlength="8" size="mini" @input="onShopCart($event, 'backgroundColor')" />
          </div>
        </div>

        <div v-if="shopCartStyle <= 1" class="shop-cart-row">
          <div class="leabl">边框</div>
          <div class="ctrl">
            <el-color-picker v-model="shopCartBorderColor" @change="onShopCart($event, 'borderColor')" />
            <el-input v-model="shopCartBorderColor" maxlength="8" size="mini" @input="onShopCart($event, 'borderColor')" />
          </div>
        </div>

        <div class="shop-cart-row">
          <div class="leabl">尺寸</div>
          <el-radio-group v-model="shopCartSize" @change="onShopCart($event, 'sizeType')">
            <el-radio v-for="(item, index) in shopCartSizeList" :key="index" :label="item.label">{{ item.value }}</el-radio>
          </el-radio-group>
        </div>
      </div>
    </diy-style-contain>

    <diy-style-contain title="点击购物车按钮">
      <el-radio-group v-model="addShopCartBtn" @change="onAddShopCartBtn">
        <el-radio v-for="(item, index) in addShopCartBtnList" :key="index" :label="item.label">{{ item.value }}</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="角标设置">
      <el-radio-group v-model="angleMark" @change="onAngleMark">
        <el-radio v-for="(item, index) in angleMarkList" :key="index" :label="item.label">{{ item.value }}</el-radio>
      </el-radio-group>

      <div v-show="angleMark == 2" class="shopping-cart-func">
        <div class="shop-cart-row">
          <div class="leabl">样式</div>
          <diy-tab
            v-model="angleMarkStyleList"
            :default-index="angleMarkStyleIndex"
            @change="onAngleMarkStyle"
          >
            <template v-slot="{ item, isSelect }">
              <div class="shop-cart-col" :class="{ selected: isSelect }">{{ item.text }}</div>
            </template>
          </diy-tab>
        </div>
        <div class="shop-cart-row">
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

      <div v-show="angleMark == 3" class="shopping-cart-func">
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

    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" :max-value="50" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />

    <el-dialog title="选择分类" :visible.sync="linkVisible" width="960px" append-to-body :close-on-click-modal="false">
      <linkaddress v-if="linkVisible" @linkUrl="onCatePicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 商品组 —— 属性面板。迁移自 PHP common/commodity-group/style.php
 *
 * 与 PHP 侧的差异（数据结构一致，仅交互载体不同）：
 *   com-pick-link 选商品 → diy-goods-group（内部走 @/components/goodList）
 *   com-pick-link 选分类 → diy-url + @/components/linkaddress 弹窗
 *   风格 / 购物车 / 角标的示意图（resources/img/decorate/commodity-group/*.png）平台端无资源，改用文字标签
 *   mall/diy/get-addons-fields 插件扩展字段未迁移（Java 侧无该接口）
 */
import linkaddress from '@/components/linkaddress';
import basicMixins from '../../controls/basicMixins';
import { deepClone, getObjValue } from '../../controls/utils';

// 各风格下可配置的「显示内容」项，label 与 preview 的 PERMISSION_MAP 对应
const CONTENT_ITEMS = {
  1: { label: 1, name: '商品标题', showAlpha: false, field: 'goods_name' },
  2: { label: 2, name: '副标题', showAlpha: false, field: 'subtitle' },
  3: { label: 3, name: '商品价格', showAlpha: false, field: 'price' },
  4: { label: 4, name: '划线原价', showAlpha: false, field: 'original_price' },
  5: { label: 5, name: '商品销量', showAlpha: false, field: 'sales_num' },
  6: { label: 6, name: '会员价', disableColor: false, field: 'member_price' },
};
// 风格 → 可选内容项，与 PHP 侧 onStyleList 的三个分支一致
const STYLE_CONTENT = {
  1: [1, 2, 3, 4, 5, 6],
  2: [1, 2, 3, 4, 5, 6],
  3: [1, 3, 4, 5, 6],
  default: [1, 3],
};

export default {
  name: 'CommodityGroupStyle',
  components: { linkaddress },
  mixins: [basicMixins],
  props: {
    // 变体组件追加的「选择商品」方式，形如 [{ label: 3, text: '推荐策略' }]
    extraChooseOptions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      linkVisible: false,
      showLineList: [{ type: 'size', label: '显示条数', value: 10, unit: '个', maxValue: 20 }],
      selectUrl: '',
      chooseGoods: 1,
      isShowLine: 1,

      style: 1,
      styleList: [
        { label: 1, text: '大图' },
        { label: 2, text: '一行一个' },
        { label: 3, text: '一行两个' },
        { label: 4, text: '左图右文' },
        { label: 5, text: '一行三个' },
        { label: 6, text: '三宫格' },
        { label: 7, text: '横向滑动' },
      ],

      pickImgList: [],
      contentCheckList: [],
      showContentList: [],

      shoppingCart: 1,
      shopCartStyle: 0,
      shopCartStyleList: [
        { label: 1, text: '文字' },
        { label: 2, text: '加号' },
        { label: 3, text: '图标1' },
        { label: 4, text: '图标2' },
      ],
      shopCartText: '',
      shopCartRadius: 0,
      shopCartBgColor: '',
      shopCartColor: '',
      shopCartBorderColor: '',
      shopCartSize: 1,
      shopCartSizeList: [
        { label: 1, value: '小' },
        { label: 2, value: '中' },
        { label: 3, value: '大' },
      ],
      addShopCartBtn: 1,
      addShopCartBtnList: [
        { label: 1, value: '进入商品详情页' },
        { label: 2, value: '商品加购' },
      ],

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
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});

      this.defaultForm.colorInfos.push({
        name: '商品背景',
        color: getObjValue(this.result, ['computedStyle', 'iptBg'], this.defaultForm.defColor),
        showAlpha: false,
      });

      const d = this.result.data;
      this.selectUrl = getObjValue(this.result, ['data', 'commCate', 'title'], '');
      this.showLineList = [
        {
          type: 'size',
          label: '显示条数',
          value: getObjValue(this.result, ['data', 'commCate', 'count'], 10),
          unit: '个',
          maxValue: 50,
        },
      ];
      this.chooseGoods = d.chooseGoods || 1;
      this.isShowLine = d.isShowLine || 1;
      this.style = d.style || 1;

      this.pickImgList = getObjValue(this.result, ['data', 'goods'], []);

      // 显示内容：按当前风格构造可选项，已存颜色回填
      const saved = getObjValue(this.result, ['data', 'showContent'], null);
      this.buildContentList(this.style, saved);
      this.contentCheckList = saved && saved.length ? saved.map((it) => it.label) : STYLE_CONTENT[this.style] || STYLE_CONTENT.default;

      // 购物车
      this.shoppingCart = d.showShopCart || 1;
      const shopCartData = getObjValue(this.result, ['data', 'shopCartStyle'], { index: 0, text: '' });
      const shopCartStyle = getObjValue(this.result, ['computedStyle', 'shopCartStyle'], {});
      this.shopCartStyle = shopCartData.index || 0;
      this.shopCartText = shopCartData.text || '';
      this.shopCartColor = shopCartStyle.color || '';
      this.shopCartRadius = shopCartStyle.borderReduis || 0;
      this.shopCartBgColor = shopCartStyle.backgroundColor || '';
      this.shopCartBorderColor = shopCartStyle.borderColor || '';
      this.shopCartSize = shopCartStyle.sizeType || 1;
      this.addShopCartBtn = d.clickShopCartType ? d.clickShopCartType.label : 1;

      // 角标
      const angleMark = getObjValue(this.result, ['data', 'angleMark'], {});
      this.angleMark = angleMark.label || 1;
      this.angleMarkText = angleMark.angleMarkText || '';
      this.imageUrl = angleMark.customImgUrl ? [{ imgUrl: angleMark.customImgUrl }] : [];
      const angleMarkStyle = getObjValue(this.result, ['data', 'angleMark', 'angleMarkStyle'], { label: 0 });
      this.angleMarkStyleIndex = angleMarkStyle.label - 1;

      // 边距默认 10px
      this.defaultForm.sizeInfos = [
        { name: '上边距', value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginTop'], 10)), unit: 'px', disabled: false, maxValue: 50 },
        { name: '下边距', value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginBottom'], 10)), unit: 'px', disabled: false, maxValue: 50 },
        { name: '左右边距', value: parseFloat(getObjValue(this.result, ['computedStyle', 'searchIpts', 'marginLeft'], 10)), unit: 'px', disabled: false, maxValue: 20 },
      ];
    },

    /** 按风格重建显示内容配置项，保留已选颜色 */
    buildContentList(style, saved) {
      const keys = STYLE_CONTENT[style] || STYLE_CONTENT.default;
      const colorOf = (label) => {
        const hit = (saved || []).find((it) => it.label === label);
        const cur = this.showContentList.find((it) => it.label === label);
        return (hit && hit.color) || (cur && cur.color) || '';
      };
      this.showContentList = keys.map((k) => ({ ...CONTENT_ITEMS[k], color: colorOf(k) }));
    },

    onStyleList(e) {
      this.buildContentList(e, this.result.data.showContent);
      this.updateData(e, 'style');
      this.filterSelectContentList();
    },

    onGoodsChange(list, index, action) {
      if (action === 'add') {
        this.pickImgList = this.pickImgList.concat(list);
      } else {
        if (this.pickImgList.length <= 1) {
          this.$message.error('请至少保留一个商品');
          return;
        }
        this.pickImgList = list;
      }
      this.updateData(this.pickImgList, 'goods');
    },

    onCatePicked(url, title) {
      this.selectUrl = title || url;
      this.linkVisible = false;
      this.updateData({ title: this.selectUrl, url, count: this.isShowLine == 1 ? 10 : '' }, 'commCate');
    },
    onLineChange([{ value }]) {
      this.updateData({ count: value }, 'commCate');
    },
    changeShowLine(e) {
      if (e === 2) this.updateData({ count: '' }, 'commCate');
      this.updateData(e, 'isShowLine');
    },

    updateInput(val, item) {
      item.color = val.length === 0 ? 'transparent' : val;
      this.filterSelectContentList();
    },
    filterSelectContentList() {
      const result = this.showContentList.filter((item) => this.contentCheckList.indexOf(item.label) !== -1);
      this.updateData(result, 'showContent');
    },

    // 购物车
    onShopCartStyle(item, index) {
      this.shopCartStyle = index;
      this.updateData(Object.assign({ index }, item), 'shopCartStyle');
    },
    updateShopCartText(text) {
      this.updateData({ text }, 'shopCartStyle');
    },
    onShopCart(e, type) {
      this.updateStyle({ [type]: e }, 'shopCartStyle');
    },
    onAddShopCartBtn(e) {
      const item = this.addShopCartBtnList.find((it) => it.label == e);
      this.updateData(item, 'clickShopCartType');
    },

    // 角标
    onAngleMark(e) {
      const item = this.angleMarkList.find((it) => it.label == e);
      this.updateData(item, 'angleMark');
    },
    onAngleMarkStyle(item, index) {
      this.angleMarkStyleIndex = index;
      this.onAngleMarkChange(item, 'angleMarkStyle');
    },
    onAngleMarkChange(e, type) {
      this.updateData({ [type]: e }, 'angleMark');
    },
    addIconImg(arr) {
      this.imageUrl = arr;
      if (arr && arr[0]) this.updateData({ customImgUrl: arr[0].imgUrl }, 'angleMark');
    },

    updateColor(e) {
      this.result.computedStyle.searchBox = e[0] && e[0].color;
      this.result.computedStyle.iptBg = e[1] && e[1].color;
      this.$emit('update', this.result);
    },

    isObject(d) {
      return !!d && Object.prototype.toString.call(d) === '[object Object]';
    },
    /** 对象类型的字段做合并，其余直接覆盖，与 PHP 侧一致 */
    updateData(value, key) {
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.isObject(this.result.data[key])) {
        this.$set(this.result.data, key, Object.assign(deepClone(this.result.data[key]), value));
      } else {
        this.$set(this.result.data, key, value);
      }
      this.$emit('update', this.result);
    },
    updateStyle(value, key) {
      const cs = this.result.computedStyle;
      if (this.isObject(cs[key])) {
        this.$set(cs, key, Object.assign(deepClone(cs[key]), value));
      } else {
        this.$set(cs, key, value);
      }
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.mb10 {
  margin-bottom: 10px;
}
.row {
  display: flex;
  align-items: center;
}
.row-label {
  width: 50px;
  color: #999;
  flex-shrink: 0;
}
.row-block {
  margin-top: 12px;
}
.cate-box {
  padding: 10px;
  background: #f4f3f7;
  border-radius: 4px;
}
.cate-tip {
  color: #f56c6c;
  font-size: 12px;
  padding-top: 8px;
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
.shopping-cart-func {
  margin-top: 12px;
  background: #f4f3f7;
  border-radius: 4px;
  padding: 10px;
}
.shop-cart-row {
  display: flex;
  align-items: center;
  padding-bottom: 10px;

  .leabl {
    width: 50px;
    flex-shrink: 0;
    color: #999;
  }
  .ctrl {
    display: flex;
    align-items: center;
  }
}
.shop-cart-col {
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
.slider-text {
  margin-left: 16px;
  color: #999;
}
</style>
