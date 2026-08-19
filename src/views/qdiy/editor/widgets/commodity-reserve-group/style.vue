<template>
  <div>
    <diy-style-contain title="头部">
      <div class="head-box">
        <div class="head-row">
          <div class="leabl">标题文本</div>
          <el-input
            v-model="titleText"
            style="flex: 1"
            placeholder="请输入内容"
            maxlength="4"
            size="small"
            show-word-limit
            @input="updateHeadInfo($event, 'titleText')"
          />
        </div>
        <div class="head-row">
          <div class="leabl">更多文本</div>
          <el-input
            v-model="moreText"
            style="flex: 1"
            placeholder="请输入内容"
            maxlength="4"
            size="small"
            show-word-limit
            @input="updateHeadInfo($event, 'moreText')"
          />
        </div>
        <div class="head-row">
          <div class="leabl">链接</div>
          <diy-url :text="moreUrlTitle" @add="linkVisible = true" />
        </div>
      </div>
    </diy-style-contain>

    <!-- 商品配置部分与 commodity-group 完全一致，直接复用 -->
    <commodity-group-style :active-item="activeItem" @update="onChildUpdate" />

    <el-dialog title="选择链接" :visible.sync="linkVisible" width="960px" append-to-body :close-on-click-modal="false">
      <linkaddress v-if="linkVisible" @linkUrl="onMoreUrlPicked" />
    </el-dialog>
  </div>
</template>

<script>
/**
 * 预约商品组 —— 属性面板。迁移自 PHP common/commodity-reserve-group/style.php
 *
 * 比 commodity-group 多一个「头部」配置（标题文本 / 更多文本 / 更多链接），写入 data.headInfo。
 * 子面板改动通过 onChildUpdate 合并后再抛给编辑器，避免两个面板互相覆盖。
 */
import linkaddress from '@/components/linkaddress';
import { deepClone } from '../../controls/utils';

export default {
  name: 'CommodityReserveGroupStyle',
  components: { linkaddress },
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      result: {},
      linkVisible: false,
      titleText: '',
      moreText: '',
      moreUrl: null,
    };
  },
  computed: {
    moreUrlTitle() {
      const url = this.moreUrl;
      if (!url) return '';
      return url.title || url.url || '';
    },
  },
  created() {
    this.result = deepClone(this.activeItem);
    if (!this.result.data) this.$set(this.result, 'data', {});
    const headInfo = this.result.data.headInfo || {};
    this.titleText = headInfo.titleText || '';
    this.moreText = headInfo.moreText || '';
    this.moreUrl = headInfo.moreUrl || null;
  },
  methods: {
    updateHeadInfo(value, key) {
      const headInfo = Object.assign({}, this.result.data.headInfo || {}, { [key]: value });
      this.$set(this.result.data, 'headInfo', headInfo);
      this.$emit('update', this.result);
    },
    onMoreUrlPicked(url, title) {
      this.moreUrl = { url, title: title || url };
      this.linkVisible = false;
      this.updateHeadInfo(this.moreUrl, 'moreUrl');
    },
    // 子面板改的是同一个画布项，合并后整体上抛
    onChildUpdate(item) {
      this.result = Object.assign({}, this.result, item, {
        data: Object.assign({}, item.data, { headInfo: (this.result.data || {}).headInfo }),
      });
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.head-box {
  background: #f4f3f7;
  border-radius: 4px;
  padding: 10px;
}
.head-row {
  display: flex;
  align-items: center;
  padding-bottom: 10px;

  .leabl {
    width: 60px;
    flex-shrink: 0;
    color: #999;
  }
}
</style>
