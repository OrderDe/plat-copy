<template>
  <div class="carousel-img-style">
    <diy-tabs
      class="style-com-but"
      title="组件风格"
      :default-item="buttonData.typeItem"
      :list="buttonPattern"
      radio-text="text"
      @change="handleStyleChange"
    />

    <diy-style-contain title="轮播点">
      <el-radio-group v-model="buttonPointData.open" @change="uodateOpenType">
        <el-radio :label="true">打开</el-radio>
        <el-radio :label="false">关闭</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-tabs
      v-show="buttonPointData.open"
      class="style-com-but"
      title="轮播点样式"
      radio-text="text"
      :list="pointPattern"
      :default-item="buttonPointData.pointItem"
      @change="pointSelect"
    />

    <diy-style-contain title="轮播播放方式">
      <el-radio-group v-model="play.play_method" @change="updatePlay">
        <el-radio :label="1">手动切换</el-radio>
        <el-radio :label="2">自动切换</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain title="间隔时长">
      <el-input v-model.number="play.play_interval" size="small" style="width: 240px" @input="updatePlayInterval">
        <template slot="append">S</template>
      </el-input>
    </diy-style-contain>

    <diy-style-contain v-show="buttonPointData.open" title="轮播点位置">
      <el-radio-group v-model="pointSiteIndex" @change="updatePointSite">
        <el-radio-button :label="0">左</el-radio-button>
        <el-radio-button :label="1">中</el-radio-button>
        <el-radio-button :label="2">右</el-radio-button>
      </el-radio-group>
    </diy-style-contain>

    <diy-img-setting-drag
      ref="imgSetting"
      :suggest-size-text="suggestText"
      top-name="轮播图片"
      :open-add-img="true"
      :img-infos="carouselImgArr"
      max-img-length="8"
      :def-img-count="2"
      @change="addIconImg"
      @pick-link="(index, item) => openLinkPicker('imgSetting', item)"
    />

    <diy-tabs title="组件边框设置" radio-text="text" :default-item="defaultForm.tabItem" @change="setComponentBorder" />
    <diy-color :color-infos="defaultForm.colorInfos" :def-color="defaultForm.defColor" @change="updateColor" />
    <diy-size-setting
      top-name="边距"
      :size-infos-value="[5]"
      :str-max-size-val="[20]"
      :size-infos="defaultForm.sizeInfos"
      :max-value="50"
      @change="sliderChange"
    />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />

    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 轮播图 —— 属性面板。迁移自 PHP common/carousel-img/style.php
 *
 * 组件风格 / 轮播点样式 / 轮播点位置三处原本都用 resources/img/decorate/ 下的示意图，
 * 平台端没有这批资源，统一改成文字标签，选中值与原实现一致。
 */
import basicMixins from '../../controls/basicMixins';
import linkPickerMixins from '../../controls/linkPickerMixins';

export default {
  name: 'CarouselImgStyle',
  mixins: [basicMixins, linkPickerMixins],
  data() {
    return {
      buttonPattern: [
        { label: '通栏', value: 'one' },
        { label: '卡片', value: 'two' },
        { label: '轮播', value: 'three' },
      ],
      pointPattern: [
        { label: '圆点', value: 'one' },
        { label: '胶囊', value: 'two' },
        { label: '短线', value: 'three' },
        { label: '数字', value: 'four' },
      ],
      buttonData: {
        typeItem: null,
        typeIndex: 0,
      },
      buttonPointData: {
        open: true,
        pointItem: null,
        pointIndex: 0,
        position: 1,
      },
      pointSiteIndex: 1,
      carouselImgArr: [],
      height: '210px',
      suggestText: '建议图片宽为750，高度420',
      play: {
        play_method: 1,
        play_interval: 0,
      },
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.defaultForm.sizeInfos = ['图片间距', '上边距', '下边距', '左右边距'];

      if (!this.result.data) this.$set(this.result, 'data', {});
      const d = this.result.data;

      if (!d.buttonData) {
        d.buttonData = this.buttonData;
      } else {
        this.buttonData = d.buttonData;
      }
      if (!d.buttonPointData) {
        d.buttonPointData = this.buttonPointData;
      } else {
        this.buttonPointData = d.buttonPointData;
      }
      if (d.pointSiteIndex >= 0) this.pointSiteIndex = d.pointSiteIndex;
      if (this.result.computedStyle && this.result.computedStyle.spaceStyle) {
        this.height = this.result.computedStyle.spaceStyle.height || '';
      }
      if (d.defHeight) this.height = d.defHeight;
      if (!d.play) {
        d.play = this.play;
      } else {
        this.play = d.play;
      }
      if (d.carouselImgArr) this.carouselImgArr = d.carouselImgArr;
    },
    handleStyleChange(e) {
      const { index, item } = e;
      // 通栏风格没有图片间距，隐藏第一项滑块
      if (this.defaultForm.sizeInfos && this.defaultForm.sizeInfos[0]) {
        this.$set(this.defaultForm.sizeInfos[0], 'hidden', index === 0);
      }
      this.buttonData.typeItem = item;
      this.buttonData.typeIndex = index;
      this.result.data.buttonData = this.buttonData;
      this.updateInfos();
    },
    pointSelect(val) {
      this.buttonPointData.pointItem = val.item;
      this.buttonPointData.pointIndex = val.index;
      this.result.data.buttonPointData = this.buttonPointData;
      this.updateInfos();
    },
    updatePointSite(index) {
      this.pointSiteIndex = index;
      this.result.data.pointSiteIndex = index;
      this.updateInfos();
    },
    uodateOpenType() {
      this.result.data.buttonPointData = this.buttonPointData;
      this.updateInfos();
    },
    addIconImg(val, type = null) {
      this.carouselImgArr = JSON.parse(JSON.stringify(val));
      if (this.result.data.carouselImgArr && type === null) {
        this.carouselImgArr = this.result.data.carouselImgArr;
      } else {
        this.result.data.carouselImgArr = this.carouselImgArr;
      }
      this.result.computedStyle.carouselImgArr = [...this.carouselImgArr];
      this.updateInfos();
    },
    // 覆写 mixin：第 0 项是图片间距，边距从第 1 项起，另外要带上高度
    sliderChange(val) {
      if (this.buttonData.typeIndex === 0 && val[0]) val[0].hidden = true;
      // 三目原本写反了：只要 data.spaceInfo 已存在就丢掉用户刚拖出的 val、
      // 改用上次存的旧值，表现就是边距滑块只有第一次生效。
      // val 才是本次变更，spaceInfo 只在 val 缺席时兜底。
      this.defaultForm.sizeInfos = val || this.result.data.spaceInfo;
      const s = this.defaultForm.sizeInfos;
      this.result.computedStyle.spaceStyle = {
        marginTop: s[1].value + s[1].unit,
        marginBottom: s[2].value + s[2].unit,
        marginLeft: s[3].value + s[3].unit,
        marginRight: s[3].value + s[3].unit,
        height: this.height,
      };
      this.result.data.spaceInfo = s;
      this.updateInfos();
    },
    updatePlay() {
      this.result.data.play = this.play;
      this.updateInfos();
    },
    updatePlayInterval() {
      this.result.data.play.play_interval = this.play.play_interval;
      this.updateInfos();
    },
    setComponentBorder(e) {
      const tabItem = this.defaultForm.tabItem || {};
      this.defaultForm.tabItem = Object.assign(tabItem, e.item);
      this.updataResult(this.defaultForm.tabItem, 'tabItem');
    },
    updateInfos() {
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.carousel-img-style {
  ::v-deep .style-com-but .el-radio-button__inner {
    padding: 0 12px;
  }
}
</style>
