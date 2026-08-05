<template>
  <approval-doc-list
    title="报损单"
    :api="api"
    qty-field="damageNum"
    qty-label="报损数量"
    :empty-form="emptyForm"
    :empty-item="emptyItem"
    :rules="rules"
  >
    <template #extra-columns>
      <el-table-column prop="warehouseId" label="仓库ID" width="80" />
      <el-table-column prop="reason" label="报损原因" min-width="160" show-overflow-tooltip />
    </template>
    <template #form-fields="{ form }">
      <el-form-item label="仓库ID" prop="warehouseId">
        <el-input v-model.number="form.warehouseId" type="number" />
      </el-form-item>
      <el-form-item label="报损原因" prop="reason">
        <el-input v-model="form.reason" />
      </el-form-item>
    </template>
  </approval-doc-list>
</template>

<script>
import ApprovalDocList from '../components/ApprovalDocList.vue';
import { damageApi } from '@/api/warehouse';

export default {
  name: 'WarehouseDamage',
  components: { ApprovalDocList },
  data() {
    return {
      api: damageApi,
      emptyForm: () => ({ warehouseId: null, reason: '', applyUserName: '', remark: '', items: [] }),
      emptyItem: () => ({ productId: null, platformType: 0, goodsName: '', damageNum: 0 }),
      rules: {
        warehouseId: [{ required: true, message: '请输入仓库ID', trigger: 'blur' }],
        reason: [{ required: true, message: '请输入报损原因', trigger: 'blur' }],
      },
    };
  },
};
</script>
