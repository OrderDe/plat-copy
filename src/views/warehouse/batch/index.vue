<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属商户">
        <el-select v-model="query.merId" filterable clearable placeholder="全部" style="width:180px" @change="onSearch">
          <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="批次号"><el-input v-model="query.batchNo" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="商品ID"><el-input v-model="query.productId" clearable style="width:120px" /></el-form-item>
      <el-form-item label="供应商"><el-input v-model="query.supplierName" clearable /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:110px">
          <el-option label="启用" :value="1" /><el-option label="冻结" :value="2" /><el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="临期">
        <el-select v-model="query.expiryWithinDays" clearable placeholder="全部" style="width:130px" @change="onSearch">
          <el-option label="7天内到期" :value="7" />
          <el-option label="30天内" :value="30" />
          <el-option label="90天内" :value="90" />
          <el-option label="180天内" :value="180" />
          <el-option label="已过期" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="query.onlyRemain" @change="onSearch">仅剩余&gt;0</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openEdit()">手工建批次</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="batchNo" label="批次号" width="180" />
      <el-table-column label="仓库" width="180">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column prop="productId" label="商品ID" width="90" />
      <el-table-column prop="sku" label="规格" min-width="130" show-overflow-tooltip>
        <template slot-scope="{row}">
          <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
          <span v-else style="color:#c0c4cc">未指定</span>
        </template>
      </el-table-column>
      <el-table-column label="所属商户" width="150">
        <template slot-scope="{row}">
          <span v-if="row.merId">{{ merchantName(row.merId) }}</span>
          <el-tag v-else type="info" size="mini">历史数据</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="productionDate" label="生产日期" width="120" />
      <el-table-column label="有效期至" width="140">
        <template slot-scope="{row}">
          <span :class="expiryClass(row.expiryDate)">{{ row.expiryDate || '-' }}</span>
          <el-tag v-if="expiryTag(row.expiryDate)" size="mini" type="danger" style="margin-left:4px">
            {{ expiryTag(row.expiryDate) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="supplierName" label="供应商" width="140" show-overflow-tooltip />
      <el-table-column prop="supplierBatchNo" label="供应商批次" width="130" />
      <el-table-column prop="inboundNum" label="入库数量" width="90" />
      <el-table-column prop="remainNum" label="剩余数量" width="90" />
      <el-table-column label="状态" width="90">
        <template slot-scope="{row}">
          <el-tag :type="row.status===1?'success':row.status===2?'warning':'info'" size="mini">
            {{ ({0:'停用',1:'启用',2:'冻结'})[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="row.status !== 2" type="text" @click="onFreeze(row)">冻结</el-button>
          <el-button v-else type="text" @click="onUnfreeze(row)">解冻</el-button>
          <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadPage"
      @current-change="loadPage"
    />

    <el-dialog :title="form.id ? '编辑批次' : '新增批次'" :visible.sync="editVisible" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" size="small">
        <el-form-item label="仓库" prop="warehouseId">
          <el-select v-model="form.warehouseId" filterable placeholder="请选择" style="width:100%">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品" prop="productId">
          <el-input :value="productDisplayText" readonly placeholder="请选择商品" @click.native="openProductPicker">
            <el-button slot="append" icon="el-icon-search" @click="openProductPicker" />
          </el-input>
        </el-form-item>
        <el-form-item label="所属商户" prop="merId">
          <el-select v-model="form.merId" filterable clearable placeholder="寄卖商户（留空=平台自有）" style="width:100%" @change="onMerChange">
            <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="批次号"><el-input v-model="form.batchNo" placeholder="留空由系统生成" /></el-form-item>
        <el-form-item label="生产日期"><el-date-picker v-model="form.productionDate" value-format="yyyy-MM-dd" style="width:100%" /></el-form-item>
        <el-form-item label="有效期至"><el-date-picker v-model="form.expiryDate" value-format="yyyy-MM-dd" style="width:100%" /></el-form-item>
        <el-form-item label="供应商"><el-input v-model="form.supplierName" /></el-form-item>
        <el-form-item label="供应商批次"><el-input v-model="form.supplierBatchNo" /></el-form-item>
        <el-form-item label="入库数量" prop="inboundNum">
          <el-input-number v-model="form.inboundNum" :min="0" style="width:100%" @change="onInboundNumChange" />
        </el-form-item>
        <el-form-item label="剩余数量" prop="remainNum">
          <el-input-number v-model="form.remainNum" :min="0" :max="form.inboundNum || 0" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSubmit">保存</el-button>
      </div>
    </el-dialog>

    <!-- 商品选择弹窗 -->
    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { batchApi, warehouseApi } from '@/api/warehouse';
import { merchantListApi } from '@/api/merchant';
import ProductPickerDialog from '../components/ProductPickerDialog.vue';

export default {
  name: 'WarehouseBatch',
  components: { ProductPickerDialog },
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [], warehouseList: [], merchantList: [],
      query: { page: 1, limit: 20, warehouseId: null, merId: null, productId: null, batchNo: '', supplierName: '', status: null, onlyRemain: false, expiryWithinDays: null },
      editVisible: false,
      form: this.emptyForm(),
      productName: '',
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        productId: [{ required: true, message: '请选择商品', trigger: 'change' }],
        inboundNum: [{ required: true, message: '请输入入库数量', trigger: 'blur' }],
        remainNum: [{ validator: this.validateRemainNum, trigger: 'change' }],
      },
    };
  },
  computed: {
    /** 已选商品的回显文本：有名称显示「名称(ID)」，仅有ID时退化为「商品#ID」 */
    productDisplayText() {
      if (!this.form.productId) return '';
      const base = this.productName ? `${this.productName} (${this.form.productId})` : `商品#${this.form.productId}`;
      // 批次按 SKU 建，规格要显式展示出来，否则看不出这批货是哪个规格的
      return this.form.sku ? `${base} / ${this.form.sku}` : base;
    },
  },
  created() { this.loadWarehouses(); this.loadMerchants(); this.loadPage(); },
  methods: {
    emptyForm() {
      return { id: null, warehouseId: null, merId: null, productId: null, attrValueId: null, sku: '', batchNo: '', productionDate: '', expiryDate: '', supplierName: '', supplierBatchNo: '', inboundNum: 0, remainNum: 0, status: 1, remark: '' };
    },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    merchantName(id) { const m = this.merchantList.find(x => x.id === id); return m ? m.name : ('商户#' + id); },
    async loadMerchants() {
      try { const r = await merchantListApi({ page: 1, limit: 999 }); this.merchantList = (r && r.list) || (r && r.records) || []; } catch (e) {}
    },
    async loadWarehouses() {
      try { const res = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (res && res.list) || []; } catch (e) {}
    },
    async loadPage() {
      this.loading = true;
      try {
        const res = await batchApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, warehouseId: null, merId: null, productId: null, batchNo: '', supplierName: '', status: null, onlyRemain: false, expiryWithinDays: null }; this.loadPage(); },
    expiryTag(date) {
      if (!date) return '';
      const days = Math.ceil((new Date(date) - Date.now()) / 86400000);
      if (days < 0) return `已过期${-days}天`;
      if (days <= 7) return `${days}天到期`;
      return '';
    },
    expiryClass(date) {
      if (!date) return '';
      const days = Math.ceil((new Date(date) - Date.now()) / 86400000);
      if (days < 0) return 'text-danger';
      if (days <= 30) return 'text-warn';
      return '';
    },
    openEdit(row) { this.form = row ? { ...row } : this.emptyForm(); this.productName = ''; this.editVisible = true; },
    /** 入库数量变更后重新校验剩余数量（避免先填剩余再调小入库数绕过限制） */
    onInboundNumChange() {
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.validateField('remainNum');
      });
    },
    /** 剩余数量不得大于入库数量 */
    validateRemainNum(rule, value, callback) {
      const inbound = Number(this.form.inboundNum || 0);
      if (value != null && Number(value) > inbound) {
        callback(new Error(`剩余数量不能大于入库数量(${inbound})`));
        return;
      }
      callback();
    },
    /** 切换商户时清空已选商品 */
    onMerChange() {
      this.form.productId = null;
      this.form.attrValueId = null;
      this.form.sku = '';
      this.productName = '';
    },
    /** 打开商品选择弹窗，自动传入当前选中的商户ID */
    async openProductPicker() {
      const res = await this.$refs.productPicker.open({ merId: this.form.merId || null });
      if (res && res.product) {
        const product = res.product;
        // 批次唯一键含 SKU：同一商品的不同规格效期可以不同，必须分开建批次
        const sku = res.skus && res.skus.length ? res.skus[0] : null;
        this.$set(this.form, 'productId', product.id);
        this.$set(this.form, 'attrValueId', sku ? sku.id : null);
        this.$set(this.form, 'sku', sku ? sku.sku : '');
        this.productName = product.name || '';
        // 商品自带商户ID时同步回填「所属商户」，避免两处不一致
        if (product.merId) this.$set(this.form, 'merId', product.merId);
        this.$refs.formRef && this.$refs.formRef.clearValidate('productId');
      }
    },
    async onSubmit() {
      await this.$refs.formRef.validate();
      this.saving = true;
      try {
        this.form.id ? await batchApi.edit(this.form) : await batchApi.add(this.form);
        this.$message.success('保存成功');
        this.editVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onFreeze(row) { await batchApi.freeze(row.id); this.$message.success('已冻结'); this.loadPage(); },
    async onUnfreeze(row) { await batchApi.unfreeze(row.id); this.$message.success('已解冻'); this.loadPage(); },
    onDelete(row) {
      this.$confirm(`删除批次「${row.batchNo}」?`, '提示', { type: 'warning' })
        .then(async () => { await batchApi.del(row.id); this.$message.success('已删除'); this.loadPage(); })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.text-danger { color: #f56c6c; font-weight: bold; }
.text-warn { color: #e6a23c; }
</style>

