<template>
  <approval-doc-list
    title="调拨申请单"
    :api="api"
    qty-field="transferNum"
    qty-label="调拨数量"
    :empty-form="emptyForm"
    :empty-item="emptyItem"
    :rules="rules"
  >
    <template #extra-columns>
      <el-table-column prop="fromWarehouseId" label="调出仓" width="80" />
      <el-table-column prop="toWarehouseId" label="调入仓" width="80" />
    </template>
    <template #form-fields="{ form }">
      <el-form-item label="调出仓" prop="fromWarehouseId">
        <el-input v-model.number="form.fromWarehouseId" type="number" />
      </el-form-item>
      <el-form-item label="调入仓" prop="toWarehouseId">
        <el-input v-model.number="form.toWarehouseId" type="number" />
      </el-form-item>
    </template>
  </approval-doc-list>
</template>

<script>
import ApprovalDocList from '../components/ApprovalDocList.vue';
import { transferApi } from '@/api/warehouse';

export default {
  name: 'WarehouseTransfer',
  components: { ApprovalDocList },
  data() {
    return {
      api: transferApi,
      emptyForm: () => ({ fromWarehouseId: null, toWarehouseId: null, applyUserName: '', remark: '', items: [] }),
      emptyItem: () => ({ productId: null, platformType: 0, goodsName: '', transferNum: 0 }),
      rules: {
        fromWarehouseId: [{ required: true, message: '请输入调出仓', trigger: 'blur' }],
        toWarehouseId: [{ required: true, message: '请输入调入仓', trigger: 'blur' }],
      },
    };
  },
};
</script>
