<template>
  <div class="presale-goods-style">
    <diy-style-contain title="风格">
      <el-radio-group v-model="styleVal" @change="onStyleList">
        <el-radio-button v-for="(item, index) in styleList" :key="index" :label="item.label">
          {{ item.text }}
        </el-radio-button>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="选择预售活动">
      <ActivityPicker :value="pickImgList" :max-length="maxGroupLen" @change="onGoodsChange" />
    </diy-style-contain>

    <diy-style-contain title="显示内容">
      <el-checkbox-group v-model="contentCheckList" @change="onContentChange">
        <div v-for="(item, index) in showContentList" :key="index" class="content-row">
          <el-checkbox :label="item.label">
            <span>{{ item.name }}</span>
          </el-checkbox>
          <el-color-picker v-model="item.color" :show-alpha="item.showAlpha" @change="onContentChange" />
          <el-input v-model="item.color" size="mini" class="color-ipt" @input="onContentChange" />
        </div>
      </el-checkbox-group>
    </diy-style-contain>

    <diy-style-contain title="付定金按钮">
      <el-radio-group v-model="shoppingCart" @change="updataData($event, 'showShopCart')">
        <el-radio :label="1">显示</el-radio>
        <el-radio :label="2">隐藏</el-radio>
      </el-radio-group>

      <div v-show="shoppingCart == 1" class="sub-panel">
        <div class="row">
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
        <div class="row">
          <div class="leabl">颜色</div>
          <div class="ctrl">
            <el-color-picker v-model="shopCartColor" @change="onShopCart($event, 'color')" />
            <el-input v-model="shopCartColor" maxlength="8" size="mini" @input="onShopCart($event, 'color')" />
          </div>
        </div>
        <div class="row">
          <div class="leabl">圆角</div>
          <div class="ctrl">
            <el-slider v-model="shopCartRadius" style="width: 165px" :min="0" :max="20" @change="onShopCart($event, 'borderReduis')" />
            <div class="slider-text">{{ shopCartRadius }}px</div>
          </div>
        </div>
        <div class="row">
          <div class="leabl">背景</div>
          <div class="ctrl">
            <el-color-picker v-model="shopCartBgColor" @change="onShopCart($event, 'backgroundColor')" />
            <el-input v-model="shopCartBgColor" maxlength="8" size="mini" @input="onShopCart($event, 'backgroundColor')" />
          </div>
        </div>
        <div class="row">
          <div class="leabl">边框</div>
          <div class="ctrl">
            <el-color-picker v-model="shopCartBorderColor" @change="onShopCart($event, 'borderColor')" />
            <el-input v-model="shopCartBorderColor" maxlength="8" size="mini" @input="onShopCart($event, 'borderColor')" />
          </div>
        </div>
        <div class="row">
          <div class="leabl">尺寸</div>
          <el-radio-group v-model="shopCartSize" @change="onShopCart($event, 'sizeType')">
            <el-radio v-for="(item, index) in shopCartSizeList" :key="index" :label="item.label">{{ item.value }}</el-radio>
          </el-radio-group>
        </div>
      </div>
    </diy-style-contain>

    <diy-style-contain title="角标设置">
      <el-radio-group v-model="angleMark" @change="onAngleMark">
        <el-radio v-for="(item, index) in angleMarkList" :key="index" :label="item.label">{{ item.value }}</el-radio>
      </el-radio-group>

      <div v-show="angleMark == 2" class="sub-panel">
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

      <div v-show="angleMark == 3" class="sub-panel">
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

    <diy-style-contain title="点击付定金按钮">
      <el-radio-group v-model="addShopCartBtn" @change="onAddShopCartBtn">
        <el-radio v-for="(item, index) in addShopCartBtnList" :key="index" :label="item.label">{{ item.value }}</el-radio>
      </el-radio-group>
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
 * 预售商品 —— 属性面板。迁移自 PHP common/presale-goods/style.php
 *
 * 结构与 commodity-group 的「购物车按钮 / 角标 / 显示内容」同源；
 * 风格图与角标示意图平台端无资源，改用文字标签；
 * 预售活动选择改用 ActivityPicker 按 ID 录入（Java 侧无预售模块接口）。
 */
import ActivityPicker from '../../components/ActivityPicker';
import basicMixins from '../../controls/basicMixins';
import marketingMixins from '../../controls/marketingMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'PresaleGoodsStyle',
  components: { ActivityPicker },
  mixins: [basicMixins, marketingMixins],
  data() {
    return {
      styleVal: 1,
      styleList: [
        { label: 1, text: '一行一个' },
        { label: 2, text: '一行两个' },
      ],
      contentCheckList: [1, 3, 4, 5],
      showContentList: [
        { label: 1, name: '商品标题', color: '#fff', showAlpha: false },
        { label: 3, name: '商品价格', color: '#fff', showAlpha: false },
        { label: 4, name: '预售价', color: '#fff', showAlpha: false },
        { label: 5, name: '付款人数', color: '#fff', showAlpha: false },
      ],
      shoppingCart: 1,
      shopCartText: '',
      shopCartColor: '',
      shopCartRadius: 0,
      shopCartBgColor: '',
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
        { label: 2, value: '直接付定金' },
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
      colorInfos: ['背景色', '商品背景'],
      colorKeys: ['bgColor', 'goodsBgColor'],
      defColor: ['transparent', '#ffffff'],
      sizeInfosValue: [5, 0, 0, 0],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.initMarketing('预售商品');
      const d = this.result.data;

      this.styleVal = d.style || 1;
      this.shoppingCart = d.showShopCart || 1;

      const cart = getObjValue(this.result, ['data', 'shopCartStyle'], {});
      const cartStyle = getObjValue(this.result, ['computedStyle', 'shopCartStyle'], {});
      this.shopCartText = cart.text || '';
      this.shopCartColor = cartStyle.color || '';
      this.shopCartRadius = cartStyle.borderReduis || 0;
      this.shopCartBgColor = cartStyle.backgroundColor || '';
      this.shopCartBorderColor = cartStyle.borderColor || '';
      this.shopCartSize = cartStyle.sizeType || 1;
      this.addShopCartBtn = d.clickShopCartType ? d.clickShopCartType.label : 1;

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
      this.updataData(e, 'style');
    },
    onContentChange() {
      const result = this.showContentList.filter((it) => this.contentCheckList.indexOf(it.label) !== -1);
      this.updataData(result, 'showContent');
    },
    updateShopCartText(text) {
      const merged = Object.assign({}, this.result.data.shopCartStyle || {}, { text });
      this.updataData(merged, 'shopCartStyle');
    },
    onShopCart(e, type) {
      const cs = this.result.computedStyle;
      const merged = Object.assign({}, cs.shopCartStyle || {}, { [type]: e });
      this.updataResult(merged, 'shopCartStyle');
    },
    onAddShopCartBtn(e) {
      const item = this.addShopCartBtnList.find((it) => it.label == e);
      this.updataData(item, 'clickShopCartType');
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
  },
};
</script>

<style scoped lang="scss">
.sub-panel {
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
  .ctrl {
    display: flex;
    align-items: center;
  }
}
.slider-text {
  margin-left: 16px;
  color: #999;
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
