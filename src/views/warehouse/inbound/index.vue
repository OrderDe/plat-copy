<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="入库单号">
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
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新建入库单</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="入库单号" width="180" />
      <el-table-column label="仓库" width="180">
        <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template slot-scope="{row}">{{ typeText(row.type) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}">
          <el-tag :type="statusType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="质检" width="100">
        <template slot-scope="{row}">
          <el-tag :type="({0:'info',1:'warning',2:'success'})[row.inspectStatus || 0]" size="mini">
            {{ ({0:'未质检',1:'质检中',2:'已质检'})[row.inspectStatus || 0] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="applyUserName" label="申请人" width="120" />
      <el-table-column prop="applyUserPhone" label="联系方式" width="130" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDetail(row.id)">详情</el-button>
          <el-button type="text" @click="onPrint(row)">打印</el-button>
          <el-button v-if="row.status === 0" type="text" @click="openEdit(row)">修改</el-button>
          <el-button v-if="row.status === 0" type="text" @click="onSubmit(row)">提交生效</el-button>
          <el-button v-if="row.status === 1 && (row.inspectStatus || 0) === 0" type="text" style="color:#67c23a" @click="onCreateInspect(row)">生成质检单</el-button>
          <el-button v-if="row.inspectCode" type="text" @click="goInspect(row)">查看质检</el-button>
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
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="960px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small" :disabled="dialogMode === 'view'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%">
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
          <el-col :span="12">
            <!-- 入库人、经办人都允许手工输入：现场收货的人不一定有后台账号，
                 经办人更常见是承运商/供应商的人，只留姓名即可 -->
            <el-form-item label="入库人">
              <el-input v-model="form.inboundUserName" maxlength="64" placeholder="可选择管理员或直接输入姓名">
                <el-button slot="append" icon="el-icon-user" @click="pickInboundUser">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经办人">
              <el-input v-model="form.handlerUserName" maxlength="64" placeholder="送货/交接对接人，可直接输入姓名">
                <el-button slot="append" icon="el-icon-user" @click="pickHandlerUser">选择</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">入库明细</el-divider>
        <el-button v-if="editable" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <div class="dialog-table-scroller">
          <el-table :data="form.items" border size="mini" max-height="360">
            <el-table-column type="index" width="50" fixed="left" />
            <el-table-column label="店铺" width="180" fixed="left">
              <template slot-scope="{row}">
                <el-select v-model="row.merId" filterable size="mini" style="width:100%" placeholder="选择店铺" @change="onShopChange(row)">
                  <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
              </template>
            </el-table-column>
            <!-- 左侧固定：列多要横向滚动，滚到右边还得知道这行是哪个商品 -->
            <el-table-column label="商品名称" min-width="220" fixed="left">
              <template slot-scope="{row}">
                <el-input v-model="row.goodsName" size="mini" readonly placeholder="点击选择商品">
                  <el-button slot="append" size="mini" icon="el-icon-search" @click="pickProduct(row)" />
                </el-input>
                <!-- 商品ID 原来单独占一列 130px，只读且很少看，收进来当副信息 -->
                <span v-if="row.productId" class="cell-sub">ID: {{ row.productId }}</span>
              </template>
            </el-table-column>
            <el-table-column label="规格 / 条码" min-width="160">
              <template slot-scope="{row}">
                <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
                <span v-else-if="row.productId" class="sku-missing">未选规格</span>
                <span v-else>-</span>
                <!-- 条码原来也单独占 140px，同样并进来 -->
                <span v-if="row.barCode" class="cell-sub">{{ row.barCode }}</span>
              </template>
            </el-table-column>
            <el-table-column label="应入库" width="100">
              <template slot-scope="{row}">
                <el-input-number v-model="row.inboundTotalNum" :min="0" size="mini" controls-position="right" style="width:100%" />
              </template>
            </el-table-column>
            <el-table-column label="实入库" width="100">
              <template slot-scope="{row}">
                <el-input-number v-model="row.actualInboundNum" :min="0" size="mini" controls-position="right" style="width:100%" />
              </template>
            </el-table-column>
            <el-table-column label="货架" width="130">
              <template slot-scope="{row}">
                <el-select v-model="row.shelfId" size="mini" filterable clearable style="width:100%" @change="onShelfChange(row)" :disabled="!form.warehouseId">
                  <el-option v-for="s in shelfCache" :key="s.id" :label="s.code" :value="s.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="库位" width="150">
              <template slot-scope="{row}">
                <el-select v-model="row.locationId" size="mini" filterable clearable style="width:100%" :disabled="!row.shelfId">
                  <el-option v-for="l in (locationCache[row.shelfId] || [])" :key="l.id" :label="l.code" :value="l.id" />
                </el-select>
              </template>
            </el-table-column>
            <!-- 这两个日期会在入库确认时带进自动生成的批次，不是可有可无的装饰 -->
            <el-table-column label="生产日期" width="150">
              <template slot-scope="{row}">
                <el-date-picker
                  v-model="row.productionDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  size="mini"
                  placeholder="选择日期"
                  style="width:100%"
                  :picker-options="prodPickerOptions"
                />
              </template>
            </el-table-column>
            <el-table-column label="有效期至" width="150">
              <template slot-scope="{row}">
                <el-date-picker
                  v-model="row.expiryDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  size="mini"
                  placeholder="选择日期"
                  style="width:100%"
                  :picker-options="expiryPickerOptionsOf(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="供应商批次" width="130">
              <template slot-scope="{row}"><el-input v-model="row.supplierBatchNo" size="mini" /></template>
            </el-table-column>
            <el-table-column v-if="editable" label="操作" width="70" fixed="right">
              <template slot-scope="{$index}">
                <el-button type="text" class="danger-text" @click="form.items.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>

      <div v-if="editable" slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSubmitForm">保存</el-button>
      </div>
    </el-dialog>

    <admin-picker-dialog ref="adminPicker" :title="adminPickerTitle" />
    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { inboundApi, shelfApi, locationApi, inspectApi, dictApi } from '@/api/warehouse';
import warehouseFormMixin from '@/views/warehouse/components/warehouseFormMixin';
import { doPrint } from '@/views/warehouse/components/printUtil';

export default {
  name: 'WarehouseInbound',
  mixins: [warehouseFormMixin],
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [],
      query: { page: 1, limit: 20, code: '', warehouseId: null, type: null, status: null },
      dialogVisible: false, dialogMode: 'add',
      form: this.emptyForm(),
      shelfCache: [],
      adminPickerTitle: '选择申请人', // 申请人/入库人/经办人共用一个选择器，标题跟着入口走
      locationCache: {},
      typeOptions: [], // 入库类型，来自 wms_dict(inbound_type)
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        applyUserId: [{ required: true, message: '请选择申请人', trigger: 'change' }],
      },
    };
  },
  computed: {
    editable() { return this.dialogMode === 'add' || this.dialogMode === 'edit'; },
    dialogTitle() {
      if (this.dialogMode === 'add') return '新建入库单';
      return (this.dialogMode === 'edit' ? '编辑入库单 ' : '入库单详情 ') + (this.form.code || '');
    },
    /** 生产日期不能晚于今天：还没生产出来的货不可能已入库 */
    prodPickerOptions() {
      return { disabledDate: (d) => d.getTime() > Date.now() };
    },
  },
  created() {
    this.loadTypeOptions();
    this.loadPage();
  },
  watch: {
    'form.warehouseId'(v) { this.loadShelves(v); },
  },
  methods: {
    emptyForm() { return { warehouseId: null, type: 0, applyUserId: null, applyUserName: '', applyUserPhone: '', inboundUserId: null, inboundUserName: '', handlerUserName: '', remark: '', items: [] }; },
    /** 入库人可以是没有后台账号的现场人员，所以选择器只是省事的入口，输入框本身可编辑 */
    async pickInboundUser() {
      this.adminPickerTitle = '选择入库人';
      const u = await this.$refs.adminPicker.open();
      this.adminPickerTitle = '选择申请人';
      if (!u) return;
      this.$set(this.form, 'inboundUserId', u.id);
      this.$set(this.form, 'inboundUserName', u.realName || u.account || '');
    },
    /** 经办人常是承运商/供应商的人，后台没有账号，只存姓名不存ID */
    async pickHandlerUser() {
      this.adminPickerTitle = '选择经办人';
      const u = await this.$refs.adminPicker.open();
      this.adminPickerTitle = '选择申请人';
      if (!u) return;
      this.$set(this.form, 'handlerUserName', u.realName || u.account || '');
    },
    async loadShelves(warehouseId) {
      if (!warehouseId) { this.shelfCache = []; this.locationCache = {}; return; }
      try {
        const res = await shelfApi.page({ page: 1, limit: 999, warehouseId, status: 1 });
        this.shelfCache = (res && res.list) || [];
      } catch (e) { this.shelfCache = []; }
      this.locationCache = {};
    },
    async onShelfChange(row) {
      row.locationId = null;
      await this.ensureLocations(row.shelfId);
    },
    /** 只补库位下拉选项，不动已选值：编辑草稿时要保留原来选好的库位 */
    async ensureLocations(shelfId) {
      if (!shelfId || this.locationCache[shelfId]) return;
      try {
        const list = await locationApi.list(shelfId) || [];
        this.$set(this.locationCache, shelfId, list.filter(l => l.status === 1));
      } catch (e) {}
    },
    typeText(t) {
      // 类型名来自字典；停用后的历史单据也能显示原名称，字典没这条时退回显示原始值
      const hit = this.typeOptions.find((x) => x.itemValue === t);
      if (hit) return hit.itemName;
      return t === null || t === undefined ? '-' : String(t);
    },
    async loadTypeOptions() {
      try {
        const res = await dictApi.items('inbound_type');
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
    statusText(s) { return ({ 0: '草稿', 1: '已生效', 2: '已作废' })[s] || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'success', 2: 'danger' })[s] || ''; },
    async loadPage() {
      this.loading = true;
      try {
        const res = await inboundApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, type: null, status: null }; this.loadPage(); },
    openDialog() {
      this.form = this.emptyForm();
      this.dialogMode = 'add';
      this.dialogVisible = true;
    },
    /** 草稿才可编辑，状态判断以后端为准，这里只做入口控制 */
    async openEdit(row) {
      if (row.status !== 0) return this.$message.warning('只有草稿状态的入库单可以修改');
      const res = await inboundApi.detail(row.id);
      this.form = res || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      // 等 form.warehouseId 的 watcher 先跑完：loadShelves 会清空 locationCache，
      // 不等它就先填，填进去的库位选项会被清掉，编辑时库位下拉又是空的
      await this.$nextTick();
      // 明细里已选的货架要把库位选项带出来，否则编辑时库位下拉是空的
      for (const it of this.form.items) { if (it.shelfId) await this.ensureLocations(it.shelfId); }
      this.dialogMode = 'edit';
      this.dialogVisible = true;
    },
    async openDetail(id) {
      const res = await inboundApi.detail(id);
      this.form = res || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() {
      this.form.items.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, merId: null, goodsName: '', inboundTotalNum: 0, actualInboundNum: 0, unitCost: 0, productionDate: '', expiryDate: '', supplierBatchNo: '', shelfId: null, locationId: null, _options: [], _loading: false });
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    /**
     * 逐行检查日期，返回第一条错误信息，全部合法返回 null。
     * 有效期已过期不拦 —— 补录历史批次、临期退货入库都要填过期日期。
     */
    checkItemDates() {
      const endOfToday = new Date().setHours(23, 59, 59, 999);
      for (let i = 0; i < this.form.items.length; i++) {
        const it = this.form.items[i];
        // 批次按生产日期/有效期建档，先进先出和临期预警都依赖它们，留空后面补不回来
        if (!it.productionDate) {
          return `第 ${i + 1} 行请选择生产日期`;
        }
        if (!it.expiryDate) {
          return `第 ${i + 1} 行请选择有效期至`;
        }
        const prod = it.productionDate ? new Date(`${it.productionDate}T00:00:00`).getTime() : null;
        const exp = it.expiryDate ? new Date(`${it.expiryDate}T00:00:00`).getTime() : null;
        if (prod != null && prod > endOfToday) {
          return `第 ${i + 1} 行生产日期不能晚于今天`;
        }
        if (prod != null && exp != null && exp < prod) {
          return `第 ${i + 1} 行有效期不能早于生产日期(${it.productionDate})`;
        }
      }
      return null;
    },
    /** 每行的有效期不能早于该行的生产日期，逐行算 */
    expiryPickerOptionsOf(row) {
      if (!row || !row.productionDate) return {};
      const min = new Date(`${row.productionDate}T00:00:00`).getTime();
      return { disabledDate: (d) => d.getTime() < min };
    },
    async onSubmitForm() {
      // validate 失败会 reject，不接住的话点保存毫无反应、也看不出哪里没填
      try {
        await this.$refs.formRef.validate();
      } catch (e) {
        return this.$message.warning('请先补全带 * 的必填项');
      }
      if (!this.form.items.length) return this.$message.warning('请至少添加一行明细');
      const bad = this.form.items.find(i => !i.productId);
      if (bad) return this.$message.warning('请为每行选择商品');
      // 仓储按 SKU 记账：没有 attrValueId 的行会落到「未指定规格」兜底行，
      // 导致该规格的可售库存回写不到 eb_product_attr_value，前台库存显示偏低
      const noSku = this.form.items.findIndex(i => !i.attrValueId);
      if (noSku >= 0) return this.$message.warning(`第 ${noSku + 1} 行未选择规格，请重新选择商品并指定规格`);
      // 店铺决定库存的商户归属，漏填会落成 mer_id=NULL 的「历史数据」，后续无法按商户对账
      const noShop = this.form.items.findIndex(i => !i.merId);
      if (noShop >= 0) return this.$message.warning(`第 ${noShop + 1} 行未选择店铺，库存将无法归属商户`);
      // picker 的 disabledDate 只挡鼠标点选，手输能绕过，保存前统一再查一遍
      const badDate = this.checkItemDates();
      if (badDate) return this.$message.warning(badDate);
      this.saving = true;
      try {
        const payload = { ...this.form, items: this.stripItemMeta(this.form.items) };
        if (this.dialogMode === 'edit') {
          await inboundApi.update(payload);
          this.$message.success('修改成功');
        } else {
          await inboundApi.add(payload);
          this.$message.success('保存成功');
        }
        this.dialogVisible = false;
        this.loadPage();
      } catch (e) {
        this.$message.error((e && (e.message || e.msg)) || '保存失败');
      } finally { this.saving = false; }
    },
    async onPrint(row) {
      try { await doPrint('IN', row.id); } catch (e) { this.$message.error(e.message || '打印失败'); }
    },
    async onCreateInspect(row) {
      await this.$confirm(`将根据入库单「${row.code}」的明细自动生成质检单（送检数=实入库数），继续？`, '确认', { type: 'warning' });
      // 质检员是必填项，自动生成时先落当前登录用户，避免生成一张必填项为空的草稿
      const u = this.$store.getters.userInfo || {};
      const d = await inspectApi.createFromInbound(row.id, {
        inspectorId: u.id,
        inspectorName: u.realName || u.account || this.$store.getters.name,
        inspectorPhone: u.phone,
      });
      this.$message.success(`已生成质检单 ${d.code}，请到"质检管理"填写质检结果`);
      this.loadPage();
    },
    goInspect(row) {
      this.$router.push({ path: '/warehouse/inspect', query: { inboundId: row.id } });
    },
    async onSubmit(row) {
      await this.$confirm('提交后将增加库存、写流水、反写商品库，不可撤销。继续？', '确认', { type: 'warning' });
      await inboundApi.submit(row.id);
      this.$message.success('已生效');
      this.loadPage();
    },
    async onCancel(row) {
      await this.$confirm(`作废入库单「${row.code}」`, '提示', { type: 'warning' });
      await inboundApi.cancel(row.id);
      this.$message.success('已作废');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.amount { color: #e6a23c; }
/*
  这里原来给外层套了 overflow-x + min-width:1990px，等于在 el-table 自带的
  横向滚动外面又加了一层：出现双滚动条，而且 fixed 列会跟着外层一起滚走、
  失去固定效果。滚动交给 el-table 自己（max-height + fixed 列），外层只留间距。
*/
.dialog-table-scroller {
  margin-top: 8px;
}
.sku-missing { color: #f56c6c; font-size: 12px; }
/* 商品ID、条码并入相邻列后的副信息样式 */
.cell-sub {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.3;
  color: #909399;
}
</style>
