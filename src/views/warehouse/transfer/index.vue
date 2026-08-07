<template>
  <div>
    <approval-doc-list
      ref="docList"
      title="调拨申请单"
      :api="api"
      qty-field="transferNum"
      qty-label="调拨数量"
      :empty-form="emptyForm"
      :empty-item="emptyItem"
      :rules="rules"
    >
      <template #extra-columns="{ warehouseText }">
        <el-table-column label="调出仓" width="170">
          <template slot-scope="{row}">{{ warehouseText(row.fromWarehouseId) }}</template>
        </el-table-column>
        <el-table-column label="调入仓" width="170">
          <template slot-scope="{row}">{{ warehouseText(row.toWarehouseId) }}</template>
        </el-table-column>
        <el-table-column label="物流阶段" width="200">
          <template slot-scope="{row}">
            <el-steps :active="stageActive(row)" simple style="padding:0;background:transparent" finish-status="success">
              <el-step title="待发" />
              <el-step title="在途" />
              <el-step title="到货" />
            </el-steps>
          </template>
        </el-table-column>
        <el-table-column label="运单" width="150">
          <template slot-scope="{row}">
            <span v-if="row.expressNo">{{ row.expressCompany }} {{ row.expressNo }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="物流操作" width="150">
          <template slot-scope="{row}">
            <el-button v-if="canShip(row)" type="text" size="mini" @click="openShip(row)">调出发货</el-button>
            <el-button v-if="row.shipStage === 1" type="text" size="mini" @click="onReceive(row)">确认收货</el-button>
            <el-tag v-if="row.shipStage === 2" type="success" size="mini">已完成</el-tag>
            <el-tag v-if="row.shipStage === 3" type="info" size="mini">已取消</el-tag>
          </template>
        </el-table-column>
      </template>
      <template #form-fields="{ form, warehouseList }">
        <el-form-item label="调出仓" prop="fromWarehouseId">
          <el-select v-model="form.fromWarehouseId" filterable placeholder="请选择调出仓" style="width:100%">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="调入仓" prop="toWarehouseId">
          <el-select v-model="form.toWarehouseId" filterable placeholder="请选择调入仓" style="width:100%">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
      </template>
    </approval-doc-list>

    <!-- 发货弹窗 -->
    <el-dialog title="调出发货" :visible.sync="shipVisible" width="480px">
      <el-alert type="warning" :closable="false" style="margin-bottom:12px">
        发货后：调出仓立即扣减库存，调入仓记为<b>在途库存</b>（不计入可用），收货确认后才转为可用。
      </el-alert>
      <el-form :model="shipForm" label-width="90px" size="small">
        <el-form-item label="调拨单">{{ current.code }}</el-form-item>
        <el-form-item label="承运商"><el-input v-model="shipForm.expressCompany" placeholder="如 顺丰 / 自有车队" /></el-form-item>
        <el-form-item label="运单号"><el-input v-model="shipForm.expressNo" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="shipVisible=false">取消</el-button>
        <el-button type="primary" size="small" :loading="shipping" @click="onShipSubmit">确认发货</el-button>
      </div>
    </el-dialog>
  </div>
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
      emptyForm: () => ({ fromWarehouseId: null, toWarehouseId: null, applyUserId: null, applyUserName: '', applyUserPhone: '', remark: '', items: [] }),
      emptyItem: () => ({ productId: null, platformType: 0, goodsName: '', transferNum: 0 }),
      rules: {
        fromWarehouseId: [{ required: true, message: '请选择调出仓', trigger: 'change' }],
        toWarehouseId: [{ required: true, message: '请选择调入仓', trigger: 'change' }],
      },
      shipVisible: false, shipping: false, current: {},
      shipForm: { expressCompany: '', expressNo: '' },
    };
  },
  methods: {
    /** 审批通过(2) 且 未发货 才能发货 */
    canShip(row) { return row.approvalStatus === 2 && (row.shipStage == null || row.shipStage === 0); },
    stageActive(row) {
      const s = row.shipStage;
      if (s === 3) return 0;
      if (s == null || s === 0) return row.approvalStatus === 2 ? 1 : 0;
      return s + 1;   // 1在途→2, 2到货→3
    },
    openShip(row) {
      this.current = row;
      this.shipForm = { expressCompany: '', expressNo: '' };
      this.shipVisible = true;
    },
    async onShipSubmit() {
      this.shipping = true;
      try {
        await transferApi.ship(this.current.id, this.shipForm);
        this.$message.success('已发货，调入仓已记在途');
        this.shipVisible = false;
        this.$refs.docList.loadPage();
      } finally { this.shipping = false; }
    },
    async onReceive(row) {
      await this.$confirm(`确认收货「${row.code}」? 调入仓在途库存将转为可用。`, '确认', { type: 'warning' });
      await transferApi.receive(row.id);
      this.$message.success('已收货，库存已入账');
      this.$refs.docList.loadPage();
    },
  },
};
</script>
