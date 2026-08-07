<template>
  <approval-doc-list
    title="退库申请单"
    :api="api"
    qty-field="returnNum"
    qty-label="退库数量"
    :empty-form="emptyForm"
    :empty-item="emptyItem"
    :rules="rules"
  >
    <template #extra-columns="{ warehouseText }">
      <el-table-column label="退回仓库" width="180">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column prop="returnReason" label="退库原因" min-width="160" show-overflow-tooltip />
    </template>
    <template #form-fields="{ form, warehouseList }">
      <el-form-item label="退回仓库" prop="warehouseId">
        <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="退库原因" prop="returnReason">
        <el-input v-model="form.returnReason" />
      </el-form-item>
    </template>
  </approval-doc-list>
</template>

<script>
import ApprovalDocList from '../components/ApprovalDocList.vue';
import { returnApi } from '@/api/warehouse';

export default {
  name: 'WarehouseReturn',
  components: { ApprovalDocList },
  data() {
    return {
      api: returnApi,
      emptyForm: () => ({ warehouseId: null, returnReason: '', applyUserId: null, applyUserName: '', applyUserPhone: '', remark: '', items: [] }),
      emptyItem: () => ({ productId: null, platformType: 0, goodsName: '', returnNum: 0 }),
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        returnReason: [{ required: true, message: '请输入退库原因', trigger: 'blur' }],
      },
    };
  },
};
</script>
