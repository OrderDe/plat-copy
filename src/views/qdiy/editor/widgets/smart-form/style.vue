<template>
  <div>
    <diy-style-contain title="关联表单模板">
      <div class="row">
        <div class="row-label">模板ID</div>
        <el-input v-model="templateId" size="small" placeholder="输入表单模板ID" @input="templateChange" />
      </div>
      <div class="tips-text">Java 侧暂无表单模板列表接口，先按模板 ID 关联，表单项由 App 端按 ID 渲染</div>
    </diy-style-contain>

    <diy-style-contain title="按钮设置">
      <div class="row">
        <div class="row-label">背景色</div>
        <div class="ctrl">
          <el-color-picker v-model="btnBgColor" @change="btnBgChange" />
          <el-input v-model="btnBgColor" maxlength="8" size="mini" @change="btnBgChange" />
        </div>
      </div>
      <div class="row">
        <div class="row-label">文字</div>
        <el-input v-model="value" size="small" placeholder="提交" :maxlength="8" show-word-limit @input="titleChange" />
      </div>
      <div class="row">
        <div class="row-label">链接</div>
        <diy-url :text="selectUrl" @add="linkVisible = true" />
      </div>
    </diy-style-contain>

    <diy-color top-name="选择颜色" :color-infos="colorInfos" :str-color="defColor" @change="updateColor" />
    <diy-size-setting top-name="边距" :size-infos="sizeInfos" :max-value="50" @change="onSizeChange" />
    <diy-size-setting top-name="圆角设置" :size-infos="radiusInfos" :max-value="20" @change="onRadiusChange" />

    <el-dialog title="选择链接" :visible.sync="linkVisible" width="960px" append-to-body :close-on-click-modal="false">
      <linkaddress v-if="linkVisible" @linkUrl="onLinkPicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 自定义表单 —— 属性面板。迁移自 PHP common/smart-form/style.php
 *
 * PHP 侧用 com-pick-link 选 SmartForm 插件的表单模板，选完把 columns 整份拷进 funcListItem；
 * Java 侧无该插件与接口，改为填模板 ID（写入 funcListItem.template_id），其余配置项照搬。
 */
import linkaddress from '@/components/linkaddress';
import basicMixins from '../../controls/basicMixins';

export default {
  name: 'SmartFormStyle',
  components: { linkaddress },
  mixins: [basicMixins],
  data() {
    return {
      linkVisible: false,
      templateId: '',
      btnBgColor: '#F10009',
      selectUrl: '',
      value: '',
      colorInfos: ['底部背景', '组件背景', '文字颜色'],
      colorKeys: ['bodyBg', 'formBg', 'textColor'],
      defColor: ['#fff', '#fff', '#000'],
      sizeInfos: ['上边距', '下边距', '左右边距'],
      radiusInfos: ['上圆角', '下圆角'],
    };
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      if (!this.result.funcListItem) this.$set(this.result, 'funcListItem', {});

      const d = this.result.data;
      if (d.padArr) this.sizeInfos = d.padArr;
      if (d.colorInfos) this.colorInfos = d.colorInfos;
      if (d.radiusArr) this.radiusInfos = d.radiusArr;
      if (d.btnTitle) this.value = d.btnTitle;
      if (d.btnLink && d.btnLink.title) this.selectUrl = d.btnLink.title;
      if (this.result.computedStyle.btnBg) this.btnBgColor = this.result.computedStyle.btnBg;
      this.templateId = this.result.funcListItem.template_id || '';
    },
    templateChange(e) {
      this.$set(this.result.funcListItem, 'template_id', e);
      this.$emit('update', this.result);
    },
    btnBgChange(e) {
      this.updataResult(e, 'btnBg');
    },
    titleChange(e) {
      this.updataData(e, 'btnTitle');
    },
    onLinkPicked(url, title) {
      this.selectUrl = title || url;
      this.linkVisible = false;
      this.updataData({ url, title: this.selectUrl }, 'btnLink');
    },
    updateColor(arr) {
      this.colorInfos = arr;
      this.$set(this.result.data, 'colorInfos', arr);
      const cs = this.result.computedStyle;
      this.colorKeys.forEach((key, i) => {
        if (arr[i]) cs[key] = arr[i].color;
      });
      this.$emit('update', this.result);
    },
    onSizeChange(arr) {
      this.sizeInfos = arr;
      this.$set(this.result.data, 'padArr', arr);
      const cs = this.result.computedStyle;
      cs.padTop = arr[0] && arr[0].value;
      cs.padBot = arr[1] && arr[1].value;
      cs.padLr = arr[2] && arr[2].value;
      this.$emit('update', this.result);
    },
    onRadiusChange(arr) {
      this.radiusInfos = arr;
      this.$set(this.result.data, 'radiusArr', arr);
      const cs = this.result.computedStyle;
      cs.radiusTop = arr[0] && arr[0].value;
      cs.radiusBot = arr[1] && arr[1].value;
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  padding-bottom: 10px;

  .row-label {
    width: 60px;
    flex-shrink: 0;
    color: #999;
  }
  .ctrl {
    display: flex;
    align-items: center;
  }
}
.tips-text {
  color: #999;
  font-size: 12px;
}
</style>
