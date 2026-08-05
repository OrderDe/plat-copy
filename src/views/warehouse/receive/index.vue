<template>
  <approval-doc-list
    title="领用申请单"
    :api="api"
    qty-field="receiveNum"
    qty-label="领用数量"
    :empty-form="emptyForm"
    :empty-item="emptyItem"
    :rules="rules"
  >
    <template #extra-columns>
      <el-table-column prop="warehouseId" label="仓库ID" width="80" />
      <el-table-column prop="receiveDept" label="领用部门" width="120" />
      <el-table-column prop="receiveUser" label="领用人" width="100" />
    </template>
    <template #form-fields="{ form }">
      <el-form-item label="仓库ID" prop="warehouseId">
        <el-input v-model.number="form.warehouseId" type="number" />
      </el-form-item>
      <el-form-item label="领用部门">
        <el-input v-model="form.receiveDept" />
      </el-form-item>
      <el-form-item label="领用人">
        <el-input v-model="form.receiveUser" />
      </el-form-item>
    </template>
  </approval-doc-list>
</template>

<script>
import ApprovalDocList from '../components/ApprovalDocList.vue';
import { receiveApi } from '@/api/warehouse';

export default {
  name: 'WarehouseReceive',
  components: { ApprovalDocList },
  data() {
    return {
      api: receiveApi,
      emptyForm: () => ({ warehouseId: null, receiveDept: '', receiveUser: '', applyUserName: '', remark: '', items: [] }),
      emptyItem: () => ({ productId: null, platformType: 0, goodsName: '', receiveNum: 0 }),
      rules: { warehouseId: [{ required: true, message: '请输入仓库ID', trigger: 'blur' }] },
    };
  },
};
</script>
