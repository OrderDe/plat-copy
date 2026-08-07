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
    <template #extra-columns="{ warehouseText }">
      <el-table-column label="仓库" width="180">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column prop="reason" label="报损原因" min-width="160" show-overflow-tooltip />
    </template>
    <template #form-fields="{ form, warehouseList }">
      <el-form-item label="仓库" prop="warehouseId">
        <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
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
      emptyForm: () => ({ warehouseId: null, reason: '', applyUserId: null, applyUserName: '', applyUserPhone: '', remark: '', items: [] }),
      emptyItem: () => ({ productId: null, platformType: 0, goodsName: '', damageNum: 0 }),
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        reason: [{ required: true, message: '请输入报损原因', trigger: 'blur' }],
      },
    };
  },
};
</script>
