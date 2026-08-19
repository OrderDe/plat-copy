<template>
  <div>
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
            :class="buttonData.shape === it ? 'active' : ''"
            :style="{ borderRadius: it === 'square' ? '0px' : it === 'round' ? '3px' : '50%' }"
          />
        </div>
      </div>
    </diy-style-contain>

    <diy-style-contain v-if="buttonData.style != 3" title="按钮类型">
      <el-radio-group v-model="buttonData.type" @change="radioChange($event, 'type')">
        <el-radio :label="1">图片</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-tabs title="组件样式" radio-text="text" :default-item="defaultForm.tabItem" @change="colorSelect" />
    <diy-tabs
      title="组件风格"
      :list="buttonPattern"
      :default-item="buttonData.patternItem"
      radio-text="text"
      @change="patternChange"
    />

    <diy-style-contain title="单行数量">
      <el-radio-group v-model="buttonData.single_line" @change="radioChange($event, 'single_line')">
        <el-radio :label="3">3个</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <!-- 单行滑动风格才有的尺寸设置 -->
    <template v-if="buttonData.pattern === 'scroll'">
      <diy-style-contain title="背景设置">
        <diy-size-setting
          top-name="宽度"
          :contain-obj="{ showTitle: false }"
          :size-infos="widthInfos"
          :min-value="20"
          @change="whChange('width')"
        />
        <diy-size-setting
          top-name="高度"
          :contain-obj="{ showTitle: false }"
          :size-infos="heightInfos"
          :min-value="20"
          @change="whChange('height')"
        />
      </diy-style-contain>

      <diy-style-contain v-if="buttonData.style == 1" title="图标设置">
        <diy-size-setting
          top-name="图片大小"
          :contain-obj="{ showTitle: false }"
          :size-infos="iconImgInfos"
          :min-value="40"
          @change="iconImgChange"
        />
        <p class="tips">图片大小不能超过背景的大小</p>
        <diy-size-setting
          top-name="文字大小"
          :contain-obj="{ showTitle: false }"
          :size-infos="iconFontInfos"
          :min-value="12"
          :max-value="20"
          @change="iconFontChange"
        />
      </diy-style-contain>
    </template>

    <diy-style-contain v-if="buttonData.pattern === 'swiper'" title="每页行数">
      <el-radio-group v-model="buttonData.line_num" @change="radioChange($event, 'line_num')">
        <el-radio :label="1">1行</el-radio>
        <el-radio :label="2">2行</el-radio>
      </el-radio-group>
    </diy-style-contain>

    <diy-img-icon-set
      title="图标设置"
      :list="iconList"
      :type="buttonData.type"
      suggest-text="建议尺寸：88*88"
      :tag-switch="false"
      :btn-style="buttonData.style"
      :max-icon-length="30"
      :show-link="true"
      :show-add-btn="true"
      :img-url="defaultImg"
      @change="setChange"
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
  </div>
</template>

<script>
/**
 * 瓷片区 —— 属性面板。迁移自 PHP common/img-button-group/style.php
 *
 * 默认按钮图 default_btn1~3.png 来自 PHP 的 resources/img/decorate/，平台端没有该资源，
 * 默认项的 img 置空，由用户在「图标设置」里自行选图。
 */
import basicMixins from '../../controls/basicMixins';

const emptyIcon = (btnText = '按钮文字') => ({
  img: '',
  icon: 'el-icon-setting',
  is_show_tag: false,
  tags: '热门',
  tagsBgColor: '#f83287',
  tagsTextColor: '#ffffff',
  btnText,
  btnTips: '提示文字',
  link_params: null,
});

export default {
  name: 'ImgButtonGroupStyle',
  mixins: [basicMixins],
  data() {
    return {
      shapeList: ['square', 'round', 'cricle'],
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
      defaultImg: '',
      iconList: [emptyIcon(), emptyIcon(), emptyIcon()],
      iconFontInfos: [
        { name: '大文字大小', value: 14, minValue: 12, maxValue: 20, unit: 'px' },
        { name: '小文字大小', value: 14, minValue: 12, maxValue: 20, unit: 'px' },
      ],
      iconImgInfos: [
        { name: '图片宽度', value: 40, minValue: 40, maxValue: 80, unit: 'px' },
        { name: '图片高度', value: 40, minValue: 40, maxValue: 80, unit: 'px' },
      ],
      widthInfos: [{ name: '宽度', value: 121, minValue: 20, maxValue: 200, unit: 'px' }],
      heightInfos: [{ name: '高度', value: 52, minValue: 20, maxValue: 100, unit: 'px' }],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      const d = this.result.data;

      // 已有数据优先，否则把默认值回写进 result
      const pick = (key, field) => {
        if (d[key]) {
          this[field] = d[key];
        } else {
          d[key] = this[field];
        }
      };
      pick('buttonData', 'buttonData');
      pick('iconFontInfos', 'iconFontInfos');
      pick('widthInfos', 'widthInfos');
      pick('heightInfos', 'heightInfos');

      if (d.iconImgInfos) {
        this.iconImgInfos = d.iconImgInfos;
        // 老数据可能只存了宽度，补上高度
        if (!this.iconImgInfos[1]) {
          this.iconImgInfos.push({ name: '图片高度', value: 40, minValue: 40, maxValue: 80, unit: 'px' });
        }
      } else {
        d.iconImgInfos = this.iconImgInfos;
      }

      if (d.iconList && d.iconList.length) this.iconList = d.iconList;
      this.updataInfos();
    },
    updateColor(e) {
      this.colorInfos = e;
      if (this.result.data.colorInfos) {
        this.colorInfos = this.result.data.colorInfos;
      } else {
        this.result.data.colorInfos = this.colorInfos;
      }
      this.result.computedStyle.searchBox = this.colorInfos[0].color;
      this.result.computedStyle.iptBg = this.colorInfos[1].color;
      this.result.computedStyle.textStyle = this.colorInfos[2].color;
      this.updataInfos();
    },
    sliderChange(arr) {
      this.sizeInfos = arr;
      if (this.result.data.sizeInfos && this.result.data.sizeInfos.length) {
        this.sizeInfos = this.result.data.sizeInfos;
      } else {
        this.result.data.sizeInfos = this.sizeInfos;
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
      this.buttonData.shape = it;
      this.updataInfos();
    },
    setChange(arr) {
      this.iconList = arr;
      if (this.result.data.iconList && this.result.data.iconList.length) {
        this.iconList = this.result.data.iconList;
      } else {
        this.result.data.iconList = this.iconList;
      }
      this.updataInfos();
    },
    patternChange(e) {
      this.buttonData.pattern = e.item.value;
      this.buttonData.patternItem = e.item;
      this.updataInfos();
    },
    radioChange(e, name) {
      // 「仅图片」样式下，图片尺寸跟随背景尺寸
      if (name === 'style') {
        if (e === 2) {
          this.iconImgInfos = [
            {
              name: '图片宽度',
              value: this.widthInfos[0].value,
              minValue: this.widthInfos[0].minValue,
              maxValue: this.widthInfos[0].maxValue,
              unit: 'px',
            },
            {
              name: '图片高度',
              value: this.heightInfos[0].value,
              minValue: this.heightInfos[0].minValue,
              maxValue: this.heightInfos[0].maxValue,
              unit: 'px',
            },
          ];
          this.result.data.iconImgInfos = this.iconImgInfos;
        } else if (e === 1) {
          this.iconImgInfos = [
            { name: '图片宽度', value: 40, minValue: 40, maxValue: 80, unit: 'px' },
            { name: '图片高度', value: 40, minValue: 40, maxValue: 80, unit: 'px' },
          ];
          this.result.data.iconImgInfos = this.iconImgInfos;
        }
      }
      this.buttonData[name] = e;
      this.updataInfos();
    },
    iconFontChange(val) {
      this.result.data.iconFontInfos = val;
      this.updataInfos();
    },
    iconImgChange(val) {
      if (val[0].value > this.heightInfos[0].value || val[1].value > this.heightInfos[0].value) {
        this.$message({ message: '图片大小不能超过背景的大小', type: 'warning' });
        this.iconImgInfos[0].value = 40;
        this.iconImgInfos[1].value = 40;
        return;
      }
      this.result.data.iconImgInfos = val;
      this.updataInfos();
    },
    whChange(type) {
      if (type === 'width') {
        this.result.data.widthInfos = this.widthInfos;
        this.iconImgInfos[0].value = this.widthInfos[0].value;
        this.result.data.iconImgInfos = [
          { name: '图片宽度', value: this.widthInfos[0].value, minValue: 40, maxValue: this.widthInfos[0].maxValue, unit: 'px' },
          {
            name: '图片高度',
            value: this.iconImgInfos[1] ? this.iconImgInfos[1].value : 40,
            minValue: 40,
            maxValue: 80,
            unit: 'px',
          },
        ];
      } else if (type === 'height') {
        this.result.data.heightInfos = this.heightInfos;
        this.iconImgInfos[1].value = this.heightInfos[0].value;
        this.result.data.iconImgInfos = [
          {
            name: '图片宽度',
            value: this.iconImgInfos[0] ? this.iconImgInfos[0].value : 40,
            minValue: 40,
            maxValue: 80,
            unit: 'px',
          },
          { name: '图片高度', value: this.heightInfos[0].value, minValue: 40, maxValue: this.heightInfos[0].maxValue, unit: 'px' },
        ];
      }
      this.updataInfos();
    },
    updataInfos() {
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
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
  border: 1px solid #dcdfe6;
  background: #f4f3f7;
  &.active {
    border-color: #2d8cf0;
  }
}
.tips {
  color: #c0c4cc;
  padding: 10px 0 0 20px;
  font-size: 12px;
}
</style>
