<template>
  <div>
    <el-cascader
      v-model="merIds"
      class="selWidth"
      :show-all-levels="false"
      :options="merSelect"
      :props="merProps"
      filterable
      clearable
      placeholder="请选择商户"
      @change="onChangeMerId"
    />
  </div>
</template>

<script>
import * as merchant from '@/api/merchant';
import product from '@/mixins/product';
export default {
  name: 'index',
  props: {
    multiple: {
      type: Boolean,
      default: true,
    },
    merIdChecked: {
      type: [Array , String, Number],
      default: () => null,
    },
  },
  watch: {
    merIdChecked(n) {
      this.merIds = n;
    },
  },
  data() {
    return {
      merProps: {
        value: 'id',
        label: 'name',
        children: 'merchantList',
        expandTrigger: 'hover',
        emitPath: false,
        multiple: this.multiple,
      },
      merSelect: [],
      merIds: null,
    };
  },
  mounted() {
    this.merIds = this.merIdChecked;
    this.getMerList();
  },
  methods: {
    // 列表
    getMerList() {
      merchant.merCategoryListApi().then((res) => {
        this.merSelect = res;
      });
    },
    onChangeMerId() {
      this.$emit('getMerId', this.merIds);
    },
  },
};
</script>
<style lang="scss">
::v-deep.el-cascader__search-input{
  color: white;
  opacity: 0 !important;
}
</style>
