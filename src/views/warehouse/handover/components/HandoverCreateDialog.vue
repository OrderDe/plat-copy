<template>
  <el-dialog title="登记交接" :visible.sync="visible" width="900px" :close-on-click-modal="false" @open="onOpen">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="快递员上门取件、当面清点无误后再提交——提交后订单立即转为已发货"
      description="只有「已生效」且未交接的出库单可以交接。提交即视为货已交给快递员：系统会立刻把这些出库单关联的订单改为已发货并回写运单号，买家马上能查到物流。之后系统还会与承运商的揽收状态比对，对不上会挂到交接异常清单。"
      style="margin-bottom: 14px"
    />

    <el-form ref="form" :model="form" :rules="rules" size="small" label-width="100px">
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <el-select v-model="form.warehouseId" filterable placeholder="请选择" style="width: 100%" @change="loadPending">
              <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="承运商">
            <el-select v-model="form.expressCompany" clearable placeholder="全部" style="width: 100%" @change="loadPending">
              <el-option label="京东物流 (JDL)" value="JDL" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="交接时间">
            <el-date-picker
              v-model="form.handoverTime"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="默认当前时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="快递员姓名" prop="courierName">
            <el-input v-model="form.courierName" placeholder="必填，追责时靠它" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="快递员工号">
            <el-input v-model="form.courierNo" placeholder="选填" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系方式">
            <el-input v-model="form.courierPhone" placeholder="选填" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注">
        <el-input v-model="form.remark" placeholder="选填，如「代收 3 件无面单」" />
      </el-form-item>
    </el-form>

    <div class="pending-head">
      <span class="pending-title">待交接出库单</span>
      <span class="pending-tip">已勾选 {{ selection.length }} 单 / 共 {{ totalPackageNum }} 件</span>
      <el-button type="text" icon="el-icon-refresh" :loading="loading" @click="loadPending">刷新</el-button>
    </div>

    <el-table
      ref="table"
      v-loading="loading"
      :data="pendingList"
      size="mini"
      border
      max-height="280"
      :row-key="(row) => row.id"
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" :reserve-selection="true" width="45" />
      <el-table-column prop="code" label="出库单号" width="180" />
      <el-table-column prop="relatedCode" label="关联订单号" width="180">
        <template slot-scope="{ row }">{{ row.relatedCode || '—' }}</template>
      </el-table-column>
      <!-- 仓库自建的销售出库单没有运单号，在这里补录：它要跟着回写到订单上，
           不然订单发了货用户查不到物流 -->
      <el-table-column label="运单号" width="190">
        <template slot-scope="{ row }">
          <span v-if="row.expressNo">{{ row.expressNo }}</span>
          <el-input
            v-else
            v-model="row.inputExpressNo"
            size="mini"
            clearable
            placeholder="留空则订单按无需物流发货"
          />
        </template>
      </el-table-column>
      <el-table-column prop="expressCompany" label="承运商" width="90">
        <template slot-scope="{ row }">{{ row.expressCompany || '—' }}</template>
      </el-table-column>
      <el-table-column label="交接件数" width="120">
        <template slot-scope="{ row }">
          <el-input-number v-model="row.packageNum" :min="1" :max="999" size="mini" controls-position="right" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="出库时间" width="150">
        <template slot-scope="{ row }">{{ formatDateTime(row.createTime) }}</template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && !pendingList.length" class="empty-tip">
      该仓没有待交接的出库单。出库单需先「已生效」才会出现在这里。
    </div>

    <div slot="footer">
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button type="primary" size="small" :loading="submitting" @click="submit">确认交货并发货</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { handoverApi, warehouseApi } from '@/api/warehouse';
import { formatDateTime } from '../../components/dateTime';

export default {
  name: 'HandoverCreateDialog',
  data() {
    return {
      visible: false,
      loading: false,
      submitting: false,
      warehouseList: [],
      pendingList: [],
      selection: [],
      form: {
        warehouseId: null,
        expressCompany: '',
        handoverTime: '',
        courierName: '',
        courierNo: '',
        courierPhone: '',
        remark: '',
      },
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        courierName: [{ required: true, message: '请填写快递员姓名', trigger: 'blur' }],
      },
    };
  },
  computed: {
    totalPackageNum() {
      return this.selection.reduce((sum, r) => sum + (r.packageNum || 1), 0);
    },
  },
  methods: {
    formatDateTime,
    open(warehouseId) {
      this.visible = true;
      this.form = {
        warehouseId: warehouseId || null,
        expressCompany: '',
        handoverTime: '',
        courierName: '',
        courierNo: '',
        courierPhone: '',
        remark: '',
      };
      this.pendingList = [];
      this.selection = [];
    },
    onOpen() {
      this.loadWarehouses();
      if (this.form.warehouseId) this.loadPending();
    },
    unwrap(res) {
      return res && (res.data !== undefined ? res.data : res);
    },
    async loadWarehouses() {
      if (this.warehouseList.length) return;
      try {
        const data = this.unwrap(await warehouseApi.page({ page: 1, limit: 200 }));
        this.warehouseList = (data && (data.list || data.records)) || [];
      } catch (e) {
        this.warehouseList = [];
      }
    },
    async loadPending() {
      if (!this.form.warehouseId) return;
      this.loading = true;
      try {
        const params = { warehouseId: this.form.warehouseId };
        if (this.form.expressCompany) params.expressCompany = this.form.expressCompany;
        const data = this.unwrap(await handoverApi.pending(params));
        // 件数默认按 1 计，仓管可逐单改
        this.pendingList = (data || []).map((r) => ({ ...r, packageNum: 1, inputExpressNo: '' }));
        if (this.$refs.table) this.$refs.table.clearSelection();
        this.selection = [];
      } catch (e) {
        this.$message.error('加载待交接出库单失败: ' + (e.message || e));
        this.pendingList = [];
      } finally {
        this.loading = false;
      }
    },
    onSelectionChange(rows) {
      this.selection = rows;
    },
    submit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        if (!this.selection.length) return this.$message.warning('请勾选要交接的出库单');
        this.submitting = true;
        try {
          const payload = {
            ...this.form,
            items: this.selection.map((r) => ({
              outboundId: r.id,
              packageNum: r.packageNum || 1,
              expressNo: (r.inputExpressNo || '').trim() || undefined,
            })),
          };
          if (!payload.handoverTime) delete payload.handoverTime;
          const data = this.unwrap(await handoverApi.create(payload));
          this.$message.success(`交接登记成功：${(data && data.code) || ''}`);
          this.visible = false;
          this.$emit('success');
        } catch (e) {
          this.$message.error('交接登记失败: ' + (e.message || e));
        } finally {
          this.submitting = false;
        }
      });
    },
  },
};
</script>

<style scoped>
.pending-head { display: flex; align-items: center; gap: 12px; margin: 6px 0 8px; }
.pending-title { font-size: 14px; font-weight: 500; }
.pending-tip { font-size: 12px; color: #86909c; }
.empty-tip { margin-top: 8px; font-size: 12px; color: #a8abb2; }
.text-muted { color: #a8abb2; }
</style>
