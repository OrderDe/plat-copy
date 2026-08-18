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
      <!-- 审批通过只代表批准了，货还在货架上；扣没扣账要看这一列 -->
      <el-table-column label="取货状态" width="110">
        <template slot-scope="{row}">
          <el-tag v-if="row.approvalStatus === 2" :type="pickStatusType(row.pickStatus)" size="mini">
            {{ pickStatusText(row.pickStatus) }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
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
  methods: {
    /**
     * 取货状态。审批通过后货并没有立刻消失——要等拣货员去货位把实物取出来确认，
     * 那一刻才扣库存，所以列表上必须能一眼看出这批货到底取没取。
     */
    pickStatusText(s) {
      return ({ 0: '待生成', 1: '待取货', 2: '已取货', 3: '缺货终止' })[s == null ? 0 : s] || '-';
    },
    pickStatusType(s) {
      return ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' })[s == null ? 0 : s] || 'info';
    },
  },
};
</script>
