<template>
  <div>
    <diy-style-contain title="公告图标">
      <el-radio-group v-model="iconSel.selected" @change="updateInfos">
        <el-radio :label="1">系统图标</el-radio>
        <el-radio :label="2">自定义</el-radio>
      </el-radio-group>

      <div v-show="iconSel.selected == 1" class="icon-model">
        <div
          v-for="(item, index) in iconSel.system.imgs"
          :key="index"
          class="system-img"
          :class="{ 'system-img-sel': iconSel.system.selected == index }"
          @click="selSystemIcon(index)"
        >
          <i class="el-icon-bell" />
        </div>
      </div>

      <div v-show="iconSel.selected == 2" class="icon-model">
        <diy-img-setting
          :img-infos="iconSel.diy.img"
          :def-img-count="1"
          :show-url="false"
          :suggest-site="2"
          suggest-size-text="建议尺寸：22x22"
          :img-contain-style="{ padding: 0 }"
          :show-title="false"
          @change="addIconImg"
        />
      </div>
    </diy-style-contain>

    <diy-style-contain title="数据显示">
      <el-radio-group v-model="dataShow.selected" @change="updateInfos">
        <el-radio :label="1">读取系统</el-radio>
        <el-radio :label="2">自定义</el-radio>
      </el-radio-group>

      <div v-show="dataShow.selected == 2" class="img-data-show">
        <div class="img-data-model">
          <div class="img-data-text">公告内容</div>
          <el-input
            v-model="dataShow.diy.text"
            type="textarea"
            placeholder="请输入内容"
            maxlength="100"
            show-word-limit
            @input="updateInfos"
          />
        </div>
        <div class="img-data-model">
          <div class="img-data-text">点击类型</div>
          <el-radio-group v-model="dataShow.diy.clickType" @change="updateInfos">
            <el-radio :label="1">弹出公告内容</el-radio>
            <el-radio :label="2">跳转链接</el-radio>
          </el-radio-group>
        </div>
        <div v-show="dataShow.diy.clickType == 2" class="img-data-model">
          <div class="img-data-text">链接</div>
          <diy-url :text="dataShow.diy.urlName" @add="linkVisible = true" />
        </div>
      </div>
    </diy-style-contain>

    <diy-style-contain v-if="dataShow.selected == 2" title="文字设置">
      <diy-size-setting
        top-name="字体大小"
        :min-value="14"
        :max-value="20"
        :contain-obj="{ showTitle: false }"
        :size-infos="fontSizeInfos"
        @change="fontSizeChange"
      />
      <div class="img-data-model">
        <div class="img-data-text">粗细调节</div>
        <el-radio-group v-model="fontWeight" @change="fontWeightChange">
          <el-radio label="lighter">细</el-radio>
          <el-radio label="normal">中</el-radio>
          <el-radio label="bold">粗</el-radio>
        </el-radio-group>
      </div>
    </diy-style-contain>

    <diy-tabs radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />
    <diy-color :color-infos="placardColorArr" :str-color="['', '#FFF', '#000', '#666']" @change="updateColor" />
    <diy-size-setting top-name="边距" :size-infos="defaultForm.sizeInfos" @change="sliderChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />

    <el-dialog title="选择链接" :visible.sync="linkVisible" width="960px" append-to-body :close-on-click-modal="false">
      <linkaddress v-if="linkVisible" @linkUrl="onLinkPicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 公告 —— 属性面板。迁移自 PHP common/placard/style.php
 *
 * com-pick-link → diy-url + @/components/linkaddress 弹窗，
 * linkaddress 回传 (url, title)，写回 dataShow.diy。
 */
import linkaddress from '@/components/linkaddress';
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'PlacardStyle',
  components: { linkaddress },
  mixins: [basicMixins],
  data() {
    return {
      linkVisible: false,
      iconSel: {
        selected: 1,
        system: { imgs: ['horn'], selected: 0 },
        diy: { img: [] },
      },
      dataShow: {
        selected: 1,
        system: { text: '由于天气原因，近期物流会推迟发货' },
        diy: { text: '', clickType: 1, url: '', urlName: '', urlType: '' },
      },
      placardColorArr: ['底部颜色', '组件背景', '线条颜色', '文字颜色'],
      fontSizeInfos: [{ name: '字体大小', value: 14, minValue: 14, maxValue: 20, unit: 'px' }],
      fontWeight: 'normal',
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const data = this.result.data;
      const cs = this.result.computedStyle;

      if (data.iconSel) {
        this.iconSel = data.iconSel;
      } else {
        this.$set(data, 'iconSel', this.iconSel);
      }
      if (data.dataShow) {
        this.dataShow = data.dataShow;
      } else {
        this.$set(data, 'dataShow', this.dataShow);
      }
      if (cs.fontSizeInfos) {
        this.fontSizeInfos[0].value = cs.fontSizeInfos[0].value;
      } else {
        this.$set(cs, 'fontSizeInfos', this.fontSizeInfos);
      }
      if (cs.fontWeight) {
        this.fontWeight = cs.fontWeight;
      } else {
        this.$set(cs, 'fontWeight', this.fontWeight);
      }
      this.$emit('update', this.result);
    },
    addIconImg(arr) {
      if (!arr || !arr[0]) return;
      this.$set(this.iconSel.diy, 'img', [arr[0]]);
      if (this.iconSel.selected === 2) {
        this.$set(this.result.data, 'img', arr[0].imgUrl);
        this.$set(this.result.data, 'imgType', this.iconSel.selected);
      }
      this.updateInfos();
    },
    selSystemIcon(index) {
      this.iconSel.system.selected = index;
      this.updateInfos();
    },
    updateInfos() {
      this.$emit('update', this.result);
    },
    updateColor(val) {
      this.placardColorArr = val;
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (this.result.data.placardColorArr) {
        this.placardColorArr = this.result.data.placardColorArr;
      } else {
        this.$set(this.result.data, 'placardColorArr', this.placardColorArr);
      }
      this.$set(
        this.result.computedStyle,
        'colorArr',
        this.placardColorArr.map((v) => v.color),
      );
      this.updateInfos();
    },
    onLinkPicked(url, title) {
      this.$set(this.dataShow.diy, 'url', url);
      this.$set(this.dataShow.diy, 'urlName', title || url);
      this.$set(this.dataShow.diy, 'urlType', 'link');
      this.$set(this.result.data, 'dataShow', this.dataShow);
      this.linkVisible = false;
      this.updateInfos();
    },
    fontSizeChange(val) {
      this.updataResult(val, 'fontSizeInfos');
    },
    fontWeightChange(val) {
      this.updataResult(val, 'fontWeight');
    },
  },
};
</script>

<style scoped lang="scss">
.icon-model {
  margin-top: 10px;
  display: flex;
}
.system-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 78px;
  height: 34px;
  cursor: pointer;
  font-size: 18px;
  color: #666;
}
.system-img-sel {
  border: 1px solid #2d8cf0;
}
.img-data-show {
  margin-top: 10px;
  background: #f4f3f7;
  border-radius: 4px;
  padding: 10px 20px 10px 10px;
  color: #666;
  font-size: 12px;
}
.img-data-model {
  margin-top: 16px;

  &:first-child {
    margin-top: 0;
  }
}
.img-data-text {
  min-width: 56px;
  margin-bottom: 6px;
}
</style>
