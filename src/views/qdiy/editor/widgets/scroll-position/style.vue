<template>
  <div>
    <diy-style-contain title="锚点">
      <div class="row">
        <div class="row-label">ID</div>
        <el-input v-model="defaultForm.name" size="small" readonly />
      </div>
    </diy-style-contain>
  </div>
</template>

<script>
/**
 * 锚点 —— 属性面板。迁移自 PHP common/scroll-position/style.php
 *
 * ID 首次进入时自动生成 6 位随机码，只读，供「滚动定位」类组件跳转使用。
 */
import basicMixins from '../../controls/basicMixins';
import { getObjValue } from '../../controls/utils';

export default {
  name: 'ScrollPositionStyle',
  mixins: [basicMixins],
  methods: {
    init() {
      basicMixins.methods.init.call(this);
      this.$set(this.defaultForm, 'name', getObjValue(this.result, ['data', 'name'], ''));
      if (!this.defaultForm.name) {
        const code = this.createCode();
        if (!this.result.data) this.$set(this.result, 'data', {});
        this.result.data.name = code;
        this.defaultForm.name = code;
        this.$emit('update', this.result);
      }
    },
    createCode() {
      const len = 6;
      const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789';
      const codeList = [];
      for (let i = 0; i < len; i++) {
        codeList.push(chars.charAt(Math.floor(Math.random() * chars.length)));
      }
      return codeList.join('').toLowerCase();
    },
  },
};
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
}
.row-label {
  width: 60px;
  color: #999;
  flex-shrink: 0;
}
</style>
