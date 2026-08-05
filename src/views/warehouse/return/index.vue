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
    <template #extra-columns>
      <el-table-column prop="warehouseId" label="退回仓库" width="90" />
      <el-table-column prop="relatedCode" label="关联单据" width="150" />
      <el-table-column prop="returnReason" label="退库原因" min-width="160" show-overflow-tooltip />
    </template>
    <template #form-fields="{ form }">
      <el-form-item label="退回仓库" prop="warehouseId">
        <el-input v-model.number="form.warehouseId" type="number" />
      </el-form-item>
      <el-form-item label="关联单据">
        <el-input v-model="form.relatedCode" />
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
      emptyForm: () => ({ warehouseId: null, relatedCode: '', returnReason: '', applyUserName: '', remark: '', items: [] }),
      emptyItem: () => ({ productId: null, platformType: 0, goodsName: '', returnNum: 0 }),
      rules: {
        warehouseId: [{ required: true, message: '请输入仓库ID', trigger: 'blur' }],
        returnReason: [{ required: true, message: '请输入退库原因', trigger: 'blur' }],
      },
    };
  },
};
</script>
