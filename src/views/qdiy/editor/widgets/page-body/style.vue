<template>
  <div class="page-body-style">
    <p class="tip">
      这是页面主体的位置标记。拖在它<b>上面</b>的组件显示在页面主体上方，拖在<b>下面</b>的显示在下方。
      整页没放它时，所有组件都显示在主体上方。
    </p>

    <diy-style-contain title="主体内容">
      <el-radio-group v-model="bodyMode" class="body-radio" @change="onModeChange">
        <el-radio label="default">页面原有内容（默认）</el-radio>
        <el-radio label="link">按链接展示商品数据</el-radio>
      </el-radio-group>

      <div v-if="bodyMode === 'link'" class="body-link">
        <diy-url :text="bodyLinkText" @add="openLinkPicker" />
        <el-button v-if="bodyLinkText" type="text" class="body-link-clear" @click="clearBodyLink">
          清除链接
        </el-button>
        <p class="tip tip-inline">
          选「按链接展示商品数据」后，App 的主体不再显示分类树，直接铺链接指向的那批商品。
          链接里带 <b>cid</b> / <b>cateId</b> / <b>sid</b> 的按该分类取数，不带就取全部商品。
        </p>
      </div>
    </diy-style-contain>

    <link-picker-dialog ref="linkPicker" @picked="onBodyLinkPicked" />

    <diy-style-contain title="页面自带推荐位">
      <el-radio-group v-model="nativeRecommend" class="body-radio" @change="onNativeRecommendChange">
        <el-radio label="show">显示（默认）</el-radio>
        <el-radio label="hide">隐藏</el-radio>
      </el-radio-group>
      <p class="tip tip-inline">
        购物车页主体下面有一片页面自带的「热门推荐」，它不受装修控制、固定两列。
        想完全用装修里配的商品组来替代它，就把这里关掉。
      </p>
    </diy-style-contain>

    <diy-color top-name="主体配色" :color-infos="defaultForm.colorInfos" @change="onColorChange" />

    <p class="tip tip-muted">
      主体（分类树、商品列表、购物车列表、结算栏）本身的结构改不了，但这几个颜色会下发给它：
      <br />· <b>主题色</b>：分类页的选中分类、购物车的结算按钮
      <br />· <b>价格颜色</b>：主体里商品的售价
      <br />· <b>主体背景</b>：主体区域的底色
      <br />留空就用 App 原来的颜色。
    </p>
  </div>
</template>

<script>
/**
 * 页面主体位置 —— 属性面板
 *
 * 主体是写死的功能区，装修改不了它的结构，但配色可以下发：这里存的三个颜色
 * 由 App 端（mixins/qdiyPage.js）转成页面级 CSS 变量，绑在分类页 / 购物车的
 * 根节点上，主体里的样式用 var(--qdiy-body-*, 原色) 取值。
 *
 * 存在 computedStyle 上，与其它组件一致：
 *   bodyActiveColor 主题色（选中态、结算按钮）
 *   bodyPriceColor  价格色
 *   bodyBgColor     主体背景
 * 三个都留空时 App 端不下发变量，页面完全是原来的样子。
 */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';
import LinkPickerDialog from '../../controls/LinkPickerDialog';

export default {
  name: 'PageBodyStyle',
  components: { LinkPickerDialog },
  mixins: [basicMixins],
  data() {
    return {
      bodyMode: 'default',
      bodyLink: null,
      nativeRecommend: 'show',
    };
  },
  computed: {
    bodyLinkText() {
      return (this.bodyLink && this.bodyLink.title) || '';
    },
  },
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      if (!this.result.data) this.$set(this.result, 'data', {});
      this.bodyLink = this.result.data.bodyLink || null;
      this.bodyMode = this.result.data.bodyMode === 'link' ? 'link' : 'default';
      this.nativeRecommend = this.result.data.hideNativeRecommend ? 'hide' : 'show';
      this.defaultForm.colorInfos = [
        {
          name: '主题色',
          color: getObjValue(this.result, ['computedStyle', 'bodyActiveColor'], ''),
          showAlpha: false,
        },
        {
          name: '价格颜色',
          color: getObjValue(this.result, ['computedStyle', 'bodyPriceColor'], ''),
          showAlpha: false,
        },
        {
          name: '主体背景',
          color: getObjValue(this.result, ['computedStyle', 'bodyBgColor'], ''),
          showAlpha: false,
        },
      ];
    },
    openLinkPicker() {
      this.$refs.linkPicker.open();
    },
    onBodyLinkPicked(link) {
      this.bodyLink = link;
      this.writeBodyContent();
    },
    clearBodyLink() {
      this.bodyLink = null;
      this.writeBodyContent();
    },
    onModeChange() {
      this.writeBodyContent();
    },
    onNativeRecommendChange() {
      this.$set(this.result.data, 'hideNativeRecommend', this.nativeRecommend === 'hide');
      this.$emit('update', this.result);
    },
    /** 切回「页面原有内容」时把链接一并清掉，免得存着一个不生效的配置让人困惑 */
    writeBodyContent() {
      const isLink = this.bodyMode === 'link';
      this.$set(this.result.data, 'bodyMode', isLink ? 'link' : 'default');
      this.$set(this.result.data, 'bodyLink', isLink ? this.bodyLink : null);
      // 早期版本存过 goodsClickMode / goodsLink，App 端已经不认了，顺手清掉
      this.$delete(this.result.data, 'goodsClickMode');
      this.$delete(this.result.data, 'goodsLink');
      this.$emit('update', this.result);
    },
    onColorChange(infos) {
      const keys = ['bodyActiveColor', 'bodyPriceColor', 'bodyBgColor'];
      keys.forEach((key, i) => {
        // 清空颜色时存空串，App 端据此回落到原色，不能存 null——JSON 里会变成有值的字段
        this.$set(this.result.computedStyle, key, (infos[i] && infos[i].color) || '');
      });
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.page-body-style {
  padding: 12px;

  .tip {
    margin: 0 0 12px;
    color: #909399;
    font-size: 12px;
    line-height: 20px;

    b {
      color: #606266;
    }
  }

  .tip-muted {
    margin-top: 12px;
    margin-bottom: 0;
  }

  .body-radio {
    display: flex;
    flex-direction: column;

    ::v-deep .el-radio {
      margin: 0 0 8px;
      font-size: 12px;
    }
  }

  .body-link {
    margin-top: 4px;
  }

  .body-link-clear {
    padding: 4px 0 0;
    font-size: 12px;
  }

  .tip-inline {
    margin: 8px 0 0;
  }
}
</style>
