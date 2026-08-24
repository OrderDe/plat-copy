<template>
  <div>
    <diy-style-contain title="设置">
      <div class="icon-set-items">
        <div class="icon-set-list-name">秒杀</div>
        <div class="icon-set-list-content">
          <el-switch v-model="is_seckill" active-color="#2D8CF0" inactive-color="#999999" @change="seckillChange" />
          <span class="switch-text">{{ is_seckill ? '开启' : '关闭' }}</span>
        </div>
      </div>
    </diy-style-contain>

    <diy-style-contain title="按钮样式">
      <el-radio-group v-model="buttonData.style" @change="radioChange($event, 'style')">
        <el-radio :label="1">{{ buttonData.type == 1 ? '图片' : '图标' }}+文字</el-radio>
        <el-radio :label="2">{{ buttonData.type == 1 ? '图片' : '图标' }}</el-radio>
        <el-radio :label="3">文字</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain v-if="buttonData.style != 3" title="按钮形状">
      <div class="button-shape-box">
        <div v-for="(it, i) in shapeList" :key="i" class="button-shape-cycle" @click="toggleShape(it)">
          <div
            class="button-shape-item"
            :class="{ active: buttonData.shape == it }"
            :style="{ borderRadius: it == 'square' ? '0px' : it == 'round' ? '3px' : '50%' }"
          />
        </div>
      </div>
    </diy-style-contain>

    <diy-style-contain v-if="buttonData.style != 3" title="按钮类型">
      <el-radio-group v-model="buttonData.type" @change="radioChange($event, 'type')">
        <el-radio :label="1">图片</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-tabs title="组件边框设置" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />
    <diy-tabs
      title="组件风格"
      radio-text="text"
      :list="buttonPattern"
      :default-item="buttonData.patternItem"
      @change="patternChange"
    />

    <diy-style-contain v-if="buttonData.pattern == 'scroll'" title="文字图片设置">
      <diy-size-setting
        top-name="字体大小"
        :min-value="12"
        :size-infos="fontSizeInfos"
        :contain-obj="{ showTitle: false }"
        @change="fontSizeChange"
      />
      <div class="weight-row">
        <span class="weight-label">粗细调节</span>
        <el-radio-group v-model="fontWeight" @change="fontWeightChange">
          <el-radio label="lighter">细</el-radio>
          <el-radio label="normal">中</el-radio>
          <el-radio label="bold">粗</el-radio>
        </el-radio-group>
      </div>
      <diy-size-setting
        top-name="图片大小"
        :min-value="40"
        :size-infos="imgSizeInfos"
        :contain-obj="{ showTitle: false }"
        @change="imgSizeChange"
      />
    </diy-style-contain>

    <diy-style-contain title="单行数量">
      <el-radio-group v-model="buttonData.single_line" @change="radioChange($event, 'single_line')">
        <el-radio v-for="n in [3, 4, 5, 6, 7]" :key="n" :label="n">{{ n }}个</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-style-contain v-if="buttonData.pattern == 'swiper'" title="每页行数">
      <el-radio-group v-model="buttonData.line_num" @change="radioChange($event, 'line_num')">
        <el-radio :label="1">1行</el-radio>
        <el-radio :label="2">2行</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-icon-set
      ref="iconSet"
      title="图标设置"
      :list="iconList"
      :type="buttonData.type"
      suggest-text="建议尺寸：88*88"
      :tag-switch="true"
      :btn-style="buttonData.style"
      :max-icon-length="100"
      :show-link="true"
      :show-add-btn="true"
      @change="setChange"
      @pick-link="(index, item) => openLinkPicker('iconSet', item)"
    />

    <diy-color :color-infos="colorInfos" :str-color="defColor" @change="updateColor" />
    <diy-size-setting
      top-name="边距"
      :size-infos="sizeInfos"
      :size-infos-value="sizeInfosValue"
      :max-value="50"
      @change="sliderChange"
    />
    <diy-size-setting top-name="圆角设置" :size-infos="defaultForm.radiusInfos" :max-value="20" @change="RadiusChange" />

    <link-picker-dialog ref="linkPicker" @picked="onLinkPicked" />
  </div>
</template>

<script>
/**
 * 按钮组 —— 属性面板。迁移自 PHP common/button-group/style.php
 *
 * PHP 侧的 default-tabs（链接选择弹窗的可选分组）在平台端 diy-icon-set 未提供，
 * 数据仍写入 data.defaultTabs 保持结构一致，接链接弹窗时可直接取用。
 */
import basicMixins from '../../controls/basicMixins';
import linkPickerMixins from '../../controls/linkPickerMixins';

// PHP 侧默认 4 个按钮，默认图 resources/img/decorate/default_btn*.png 平台端无资源，img 留空
const defaultIcon = (isFirst) => ({
  img: '',
  icon: 'el-icon-setting',
  is_show_tag: !!isFirst,
  tags: '热门',
  tagsBgColor: '#f83287',
  tagsTextColor: '#ffffff',
  btnText: '按钮文字',
  link_params: null,
});

export default {
  name: 'ButtonGroupStyle',
  mixins: [basicMixins, linkPickerMixins],
  data() {
    return {
      shapeList: ['square', 'round', 'circle'],
      is_seckill: false,
      buttonPattern: [
        { label: '固定显示', value: 'fixed' },
        { label: '单行滑动', value: 'scroll' },
        { label: '分页滑动', value: 'swiper' },
      ],
      colorInfos: ['底部背景', '组件背景', '文字颜色'],
      defColor: ['', '', '#333333'],
      sizeInfos: ['上边距', '下边距', '左右边距'],
      sizeInfosValue: [8, 8, 0],
      buttonData: {
        style: 1,
        type: 1,
        single_line: 3,
        line_num: 1,
        shape: 'square',
        pattern: 'fixed',
        patternItem: null,
      },
      iconList: [defaultIcon(true), defaultIcon(), defaultIcon(), defaultIcon()],
      defaultTabs: ['mall', 'goods', 'addons', 'other', 'marketing'],
      fontSizeInfos: [{ name: '字体大小', value: 12, minValue: 12, maxValue: 20, unit: 'px' }],
      imgSizeInfos: [{ name: '图片大小', value: 40, minValue: 40, maxValue: 80, unit: 'px' }],
      fontWeight: 'normal',
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const data = this.result.data;

      const pick = (key, local) => {
        if (data[key]) {
          this[local] = data[key];
        } else {
          this.$set(data, key, this[local]);
        }
      };
      pick('buttonData', 'buttonData');
      pick('defaultTabs', 'defaultTabs');
      pick('fontWeight', 'fontWeight');
      pick('imgSizeInfos', 'imgSizeInfos');
      pick('fontSizeInfos', 'fontSizeInfos');
      pick('iconList', 'iconList');
      if (data.is_seckill === undefined) {
        this.$set(data, 'is_seckill', this.is_seckill);
      } else {
        this.is_seckill = data.is_seckill;
      }

      this.updataInfos();
    },
    updateColor(e) {
      this.colorInfos = e;
      if (this.result.data.colorInfos) {
        this.colorInfos = this.result.data.colorInfos;
      } else {
        this.$set(this.result.data, 'colorInfos', this.colorInfos);
      }
      const cs = this.result.computedStyle;
      cs.searchBox = this.colorInfos[0] && this.colorInfos[0].color;
      cs.iptBg = this.colorInfos[1] && this.colorInfos[1].color;
      cs.textStyle = this.colorInfos[2] && this.colorInfos[2].color;
      this.updataInfos();
    },
    // 覆写 mixin：这里的边距要写回 data.sizeInfos
    sliderChange(arr) {
      this.sizeInfos = arr;
      if (this.result.data.sizeInfos && this.result.data.sizeInfos.length) {
        this.sizeInfos = this.result.data.sizeInfos;
      } else {
        this.$set(this.result.data, 'sizeInfos', this.sizeInfos);
      }
      const s = this.sizeInfos;
      const lr = s[2] && s[2].value + s[2].unit;
      this.searchIpts = Object.assign(this.searchIpts, {
        marginTop: s[0] && s[0].value + s[0].unit,
        marginBottom: s[1] && s[1].value + s[1].unit,
        marginLeft: lr,
        marginRight: lr,
      });
      this.updataResult(this.searchIpts, 'searchIpts');
    },
    toggleShape(it) {
      this.$set(this.buttonData, 'shape', it);
      this.updataInfos();
    },
    setChange(arr) {
      this.iconList = arr;
      this.$set(this.result.data, 'iconList', this.iconList);
      this.updataInfos();
    },
    patternChange(e) {
      this.$set(this.buttonData, 'pattern', e.item.value);
      this.$set(this.buttonData, 'patternItem', e.item);
      this.updataInfos();
    },
    radioChange(e, name) {
      this.$set(this.buttonData, name, e);
      this.updataInfos();
    },
    seckillChange(e) {
      this.$set(this.result.data, 'is_seckill', e);
      this.updataInfos();
    },
    fontWeightChange(val) {
      this.$set(this.result.data, 'fontWeight', val);
      this.updataInfos();
    },
    fontSizeChange(val) {
      this.$set(this.result.data, 'fontSizeInfos', val);
      this.updataInfos();
    },
    imgSizeChange(val) {
      this.$set(this.result.data, 'imgSizeInfos', val);
      this.updataInfos();
    },
    updataInfos() {
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.icon-set-items {
  display: flex;
  align-items: center;
}
.icon-set-list-name {
  width: 60px;
  color: #999;
}
.icon-set-list-content {
  display: flex;
  align-items: center;
}
.switch-text {
  padding-left: 7px;
  font-weight: 500;
  color: #666;
}
.button-shape-box {
  display: flex;
  align-items: center;
}
.button-shape-cycle {
  margin-right: 25px;
  cursor: pointer;
}
.button-shape-item {
  width: 36px;
  height: 36px;
  background-color: #dfdfdf;

  &.active {
    border: 1px solid #2d8cf0;
  }
}
.weight-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
}
.weight-label {
  font-weight: bold;
  color: #666;
  font-size: 14px;
  padding-right: 20px;
}
</style>
