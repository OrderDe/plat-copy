<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="出库单号">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" clearable placeholder="全部" filterable style="width:180px">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" clearable placeholder="全部" style="width:130px">
          <el-option v-for="t in typeOptions" :key="t.itemValue" :label="t.itemName" :value="t.itemValue" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option label="草稿" :value="0" />
          <el-option label="已生效" :value="1" />
          <el-option label="已作废" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新建出库单</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="出库单号" width="180" />
      <el-table-column label="仓库" width="180">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template slot-scope="{row}">{{ typeText(row.type) }}</template>
      </el-table-column>
      <el-table-column prop="customerCode" label="客户" width="120" show-overflow-tooltip />
      <el-table-column prop="expressCompany" label="承运商" width="110" />
      <el-table-column label="优先级" width="80">
        <template slot-scope="{row}">
          <el-tag v-if="row.priority > 0" type="danger" size="mini">{{ row.priority }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyUserName" label="申请人" width="120" />
      <el-table-column prop="applyUserPhone" label="联系方式" width="130" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button type="text" @click="onPrint(row)">打印</el-button>
          <el-button v-if="row.status === 0" type="text" @click="goWave">去组波</el-button>
          <el-button v-if="row.status === 0" type="text" class="danger-text" @click="onCancel(row)">作废</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadPage"
    />

    <el-dialog
      :title="dialogMode === 'add' ? '新建出库单' : '出库单详情' + (form.code || '')"
      :visible.sync="dialogVisible"
      width="960px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small" :disabled="dialogMode === 'view'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%" @change="onWarehouseChange">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" style="width:100%">
                <el-option v-for="t in typeOptions" :key="t.itemValue" :label="t.itemName" :value="t.itemValue" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 校验 applyUserId 而不是 applyUserName：审批流按用户ID派人，只有名字没有ID
                 照样会在 flowable 侧炸掉 -->
            <el-form-item label="申请人" prop="applyUserId" required>
              <el-input v-model="form.applyUserName" placeholder="点击选择申请人" readonly>
                <el-button slot="append" icon="el-icon-user" @click="pickApplyUser">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式">
              <el-input v-model="form.applyUserPhone" placeholder="选择申请人后自动带出，可手动修改" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户">
              <el-input v-model="form.customerCode" placeholder="客户编码/名称，用于组波" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="承运商">
              <el-input v-model="form.expressCompany" placeholder="用于按承运商组波" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级">
              <el-input-number v-model="form.priority" :min="0" :max="99" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">出库明细</el-divider>
        <el-button v-if="dialogMode === 'add'" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <div class="dialog-table-scroller">
          <el-table :data="form.items" border size="mini" max-height="360">
            <el-table-column type="index" width="50" fixed="left" />
            <el-table-column label="店铺" width="180" fixed="left">
              <template slot-scope="{row}">
                <el-select v-model="row.merId" filterable size="mini" style="width:100%" placeholder="选择店铺" @change="onShopChangeWithBatch(row)">
                  <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="商品名称" min-width="220" fixed="left">
              <template slot-scope="{row}">
                <el-input v-model="row.goodsName" size="mini" readonly placeholder="点击选择商品">
                  <el-button slot="append" size="mini" icon="el-icon-search" @click="pickProductWithBatch(row)" />
                </el-input>
              </template>
            </el-table-column>
            <el-table-column label="规格" min-width="150">
              <template slot-scope="{row}">
                <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
                <span v-else-if="row.productId" class="sku-missing">未选规格</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="条码" width="140">
              <template slot-scope="{row}">{{ row.barCode || '-' }}</template>
            </el-table-column>
            <el-table-column label="商品ID" width="130">
              <template slot-scope="{row}"><el-input v-model="row.productId" size="mini" readonly /></template>
            </el-table-column>
            <!--
              指定批次：留空 = 按 FEFO 自动分配（绝大多数单据）。
              仅在合同要求同批次 / 剩余效期时才锁定，锁定后批次剩余不足会直接报错，不回退 FEFO。
            -->
            <el-table-column label="指定批次" width="220">
              <template slot-scope="{row}">
                <el-select
                  v-model="row.batchId"
                  size="mini"
                  clearable
                  filterable
                  placeholder="默认FEFO自动"
                  style="width:100%"
                  :disabled="!row.productId || !form.warehouseId"
                  @visible-change="v => v && loadBatchOptions(row)"
                >
                  <el-option
                    v-for="b in (batchOptions[batchKey(row)] || [])"
                    :key="b.id"
                    :label="b.batchNo + '（剩' + b.remainNum + (b.expiryDate ? ' / 至' + b.expiryDate : '') + '）'"
                    :value="b.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="应出库" width="110">
              <template slot-scope="{row}">
                <el-input-number v-model="row.outboundTotalNum" :min="0" size="mini" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="实出库" width="110">
              <template slot-scope="{row}">
                <el-input-number v-model="row.actualOutboundNum" :min="0" size="mini" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column v-if="dialogMode === 'add'" label="操作" width="80" fixed="right">
              <template slot-scope="{$index}">
                <el-button type="text" class="danger-text" @click="form.items.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>

      <div v-if="dialogMode === 'add'" slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSubmitForm">保存</el-button>
      </div>
    </el-dialog>

    <admin-picker-dialog ref="adminPicker" title="选择申请人" />
    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { outboundApi, batchApi, dictApi } from '@/api/warehouse';
import warehouseFormMixin from '@/views/warehouse/components/warehouseFormMixin';
import { doPrint } from '@/views/warehouse/components/printUtil';

export default {
  name: 'WarehouseOutbound',
  mixins: [warehouseFormMixin],
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      // 出库要从仓里取货，选品时现有库存为 0 的标红提醒
      productPickerRequireStock: true,
      query: { page: 1, limit: 20, code: '', warehouseId: null, type: null, status: null },
      typeOptions: [], // 出库类型，来自 wms_dict(outbound_type)
      dialogVisible: false, dialogMode: 'add',
      // 批次下拉缓存：key = 仓+商户+商品+SKU，避免每次展开都请求
      batchOptions: {},
      form: this.emptyForm(),
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        applyUserId: [{ required: true, message: '请选择申请人', trigger: 'change' }],
      },
    };
  },
  created() {
    this.loadTypeOptions();
    this.loadPage();
  },
  methods: {
    emptyForm() { return { warehouseId: null, type: 0, applyUserId: null, applyUserName: '', applyUserPhone: '', customerCode: '', expressCompany: '', priority: 0, remark: '', items: [] }; },
    typeText(t) {
      // 类型名来自字典；停用后的历史单据也能显示原名称，字典没这条时退回显示原始值
      const hit = this.typeOptions.find((x) => x.itemValue === t);
      if (hit) return hit.itemName;
      return t === null || t === undefined ? '-' : String(t);
    },
    async loadTypeOptions() {
      try {
        const res = await dictApi.items('outbound_type');
        const data = res && (res.data !== undefined ? res.data : res);
        this.typeOptions = Array.isArray(data) ? data : [];
        // 新建单据默认选第一个可用类型，避免字典改动后默认值落到停用项上
        if (this.typeOptions.length && !this.typeOptions.find((x) => x.itemValue === this.form.type)) {
          this.form.type = this.typeOptions[0].itemValue;
        }
      } catch (e) {
        this.typeOptions = [];
      }
    },
    // 批次按 仓+商户+商品+SKU 隔离，缓存键必须四项齐全，否则会串到别的商品
    /** 换仓后原批次必然不属于新仓，全部清掉并丢弃缓存 */
    onWarehouseChange() {
      this.batchOptions = {};
      (this.form.items || []).forEach(r => this.$set(r, 'batchId', null));
    },
    // 店铺/商品变了，批次的归属四元组就变了，已选批次必须作废
    onShopChangeWithBatch(row) {
      this.onShopChange(row);
      this.$set(row, 'batchId', null);
    },
    async pickProductWithBatch(row) {
      await this.pickProduct(row);
      this.$set(row, 'batchId', null);
    },
    batchKey(row) {
      return [this.form.warehouseId, row.merId || '', row.productId, row.attrValueId || 0].join('_');
    },
    /**
     * 拉取该行可选批次。留空表示走 FEFO 自动分配，因此这里只在用户主动展开下拉时请求。
     * 请求失败静默降级为空列表——选不了批次不该挡住建单。
     */
    async loadBatchOptions(row) {
      if (!row.productId || !this.form.warehouseId) return;
      const key = this.batchKey(row);
      if (this.batchOptions[key]) return;
      try {
        const list = await batchApi.pickable({
          warehouseId: this.form.warehouseId,
          merId: row.merId || undefined,
          productId: row.productId,
          attrValueId: row.attrValueId || 0,
        });
        this.$set(this.batchOptions, key, list || []);
      } catch (e) {
        this.$set(this.batchOptions, key, []);
      }
    },
    statusText(s) { return ({ 0: '草稿', 1: '已生效', 2: '已作废' })[s] || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'success', 2: 'danger' })[s] || ''; },
    async loadPage() {
      this.loading = true;
      try {
        const res = await outboundApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, type: null, status: null }; this.loadPage(); },
    openDialog() { this.form = this.emptyForm(); this.dialogMode = 'add'; this.dialogVisible = true; },
    async openDetail(id) {
      const res = await outboundApi.detail(id);
      this.form = res || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() {
      this.form.items.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, merId: null, goodsName: '', batchId: null, outboundTotalNum: 0, actualOutboundNum: 0, _options: [], _loading: false });
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmitForm() {
      await this.$refs.formRef.validate();
      if (!this.form.items.length) return this.$message.warning('请至少添加一行明细');
      if (this.form.items.find((i) => !i.productId)) return this.$message.warning('请为每行选择商品');
      // 仓储按 SKU 扣账，缺 attrValueId 会扣不到对应规格的库存行
      const noSku = this.form.items.findIndex((i) => !i.attrValueId);
      if (noSku >= 0) return this.$message.warning(`第 ${noSku + 1} 行未选择规格，请重新选择商品并指定规格`);
      // 库存按商户分行存放，漏填店铺会导致拣货分配和复核扣减都定位不到库存
      const noShop = this.form.items.findIndex((i) => !i.merId);
      if (noShop >= 0) return this.$message.warning(`第 ${noShop + 1} 行未选择店铺，将无法定位该商户的库存`);
      this.saving = true;
      try {
        const payload = { ...this.form, items: this.stripItemMeta(this.form.items) };
        await outboundApi.add(payload);
        this.$message.success('保存成功');
        this.dialogVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onPrint(row) {
      try { await doPrint('OUT', row.id); } catch (e) { this.$message.error(e.message || '打印失败'); }
    },
    /** 出库一律走 波次 → 拣货 → 复核，库存在复核确认时才扣，这里只做跳转 */
    goWave() {
      this.$router.push({ path: '/warehouse/wave' });
    },
    async onCancel(row) {
      await this.$confirm(`作废出库单「${row.code}」`, '提示', { type: 'warning' });
      await outboundApi.cancel(row.id);
      this.$message.success('已作废');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.dialog-table-scroller {
  margin-top: 8px;
}
.sku-missing { color: #f56c6c; font-size: 12px; }
</style>
