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
      <el-form-item label="来源单据">
        <el-input v-model="query.sourceCode" placeholder="入库单/调拨单号" clearable style="width:180px" @keyup.enter.native="onSearch" />
      </el-form-item>
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
      <el-table-column prop="sourceCode" label="来源单据" width="180">
        <template slot-scope="{ row }">
          <span v-if="row.sourceCode">{{ row.sourceCode }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
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
      <!-- 这个入口只写批次表、不写库存，容易被误当成入库用，说明白 -->
      <el-alert
        v-if="!form.id"
        type="warning"
        :closable="false"
        show-icon
        title="此处仅补录批次记录，不会增加库存"
        style="margin-bottom:12px"
      >
        <div style="font-size:12px;line-height:1.6">
          正常收货请走「入库单」：填实入库数量和效期后确认，系统会自动建批次并写入库存。
          这里适用于系统上线前的老批次、或历史数据缺失时的补录。
        </div>
      </el-alert>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" size="small">
        <!--
          仓库/商品/商户在编辑态锁死：wms_stock 靠 batch_id 关联本批次，
          而出库查批次按「仓+商户+商品+规格」过滤，改了就和库存行脱钩、货出不掉。
          后端 updateKeepingIdentity 也会强制回落原值，这里置灰只是别让人白改。
        -->
        <el-form-item label="仓库" prop="warehouseId">
          <el-select
            v-model="form.warehouseId"
            filterable
            placeholder="请选择"
            style="width:100%"
            :disabled="!!form.id"
            @change="onWarehouseChange"
          >
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品" prop="productId">
          <el-input
            :value="productDisplayText"
            readonly
            :disabled="!!form.id"
            placeholder="请选择商品"
            @click.native="form.id ? null : openProductPicker()"
          >
            <el-button v-if="!form.id" slot="append" icon="el-icon-search" @click="openProductPicker" />
          </el-input>
        </el-form-item>
        <el-form-item label="所属商户" prop="merId">
          <el-select
            v-model="form.merId"
            filterable
            clearable
            placeholder="寄卖商户（留空=平台自有）"
            style="width:100%"
            :disabled="!!form.id"
            @change="onMerChange"
          >
            <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <p v-if="form.id" class="form-tips">仓库、商品、商户建立后不可修改（库存已按此关联），需要更换请删除本批次重建。</p>
        </el-form-item>
        <el-form-item label="批次号"><el-input v-model="form.batchNo" placeholder="留空由系统生成" /></el-form-item>
        <!-- 生产日期只能是今天或更早：未来生产的货不可能已经在仓里 -->
        <el-form-item label="生产日期" prop="productionDate">
          <el-date-picker
            v-model="form.productionDate"
            value-format="yyyy-MM-dd"
            placeholder="选择日期"
            style="width:100%"
            :picker-options="prodPickerOptions"
            @change="onDateChange"
          />
        </el-form-item>
        <!-- 有效期不禁用过期日期：补录历史批次、处理临期退货都要填，只给警告 -->
        <el-form-item label="有效期至" prop="expiryDate">
          <el-date-picker
            v-model="form.expiryDate"
            value-format="yyyy-MM-dd"
            placeholder="选择日期"
            style="width:100%"
            :picker-options="expiryPickerOptions"
            @change="onDateChange"
          />
          <p v-if="expiryPassed" class="form-tips text-danger">
            该有效期已过期，这批货入库后会直接进临期/过期预警。确认是补录历史批次再保存。
          </p>
        </el-form-item>
        <el-form-item label="供应商"><el-input v-model="form.supplierName" /></el-form-item>
        <el-form-item label="供应商批次"><el-input v-model="form.supplierBatchNo" /></el-form-item>
        <el-form-item label="入库数量" prop="inboundNum">
          <el-input-number v-model="form.inboundNum" :min="0" :precision="0" step-strictly style="width:100%" @change="onInboundNumChange" />

          <!--
            这个规格还有多少货没登记批次 = SKU 库存 − 各批次入库合计（含本批）。
            批次的 remain_num 由入库数量自动带出，不给编辑：它是出库扣减的依据，
            手填成别的数会让出库扣出不存在的货。
          -->
          <div v-if="skuStock != null" class="unreg-box">
            <span class="unreg-label">该规格未登记批次的数量</span>
            <span :class="['unreg-num', unregisteredNum < 0 ? 'text-danger' : '']">{{ unregisteredNum }}</span>
            <span class="unreg-formula">
              = 商品库存 {{ skuStock }} − 各批次入库合计 {{ otherInboundSum + (Number(form.inboundNum) || 0) }}
            </span>
            <p v-if="unregisteredNum < 0" class="form-tips text-danger">
              已为负数：各批次入库合计已超过商品库存 {{ skuStock }}，请核对入库数量。
            </p>
          </div>

          <!-- 该规格当前在这个仓的库位分布：操作员据此判断这批新货该放哪 -->
          <div v-loading="locLoading" class="loc-stock">
            <template v-if="locStock && locStock.length">
              <p class="loc-stock-head">
                该规格在<b>{{ warehouseText(form.warehouseId) }}</b>已入库
                <b class="loc-total">{{ locStockTotal }}</b> 件，分布在 {{ locStock.length }} 个库位：
              </p>
              <p v-for="s in locStock" :key="s.id" class="loc-stock-row">
                <span class="loc-name">{{ s.shelfName || s.shelfCode || '未上架' }} / {{ s.locationCode || '未分配库位' }}</span>
                <span class="loc-num">{{ s.stockNum || 0 }} 件</span>
                <span v-if="s.batchNo" class="loc-batch">批次 {{ s.batchNo }}</span>
              </p>
            </template>
            <!--
              库存为空 ≠ 没建过批次：手工建批次不写库存，只有入库单确认才会。
              所以这里不能说「这是第一批」。
            -->
            <p v-else-if="!locLoading && locStock" class="form-tips">
              该规格在<b>{{ warehouseText(form.warehouseId) }}</b>暂无库存记录（库存由入库单确认时写入，补录批次不会产生库存）。
            </p>
          </div>
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
import { batchApi, warehouseApi, stockApi } from '@/api/warehouse';
import { merchantListApi } from '@/api/merchant';
import { productDetailApi } from '@/api/product';
import ProductPickerDialog from '../components/ProductPickerDialog.vue';

export default {
  name: 'WarehouseBatch',
  components: { ProductPickerDialog },
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [], warehouseList: [], merchantList: [],
      query: { page: 1, limit: 20, warehouseId: null, merId: null, productId: null, batchNo: '', sourceCode: '', supplierName: '', status: null, onlyRemain: false, expiryWithinDays: null },
      editVisible: false,
      form: this.emptyForm(),
      productName: '',
      // 已选 SKU 在商品详情里的库存，仅作提示用
      // 该规格当前在所选仓库的库位分布，纯展示
      locStock: null,
      locLoading: false,
      // 商品详情里该 SKU 的库存（跨仓总量）
      skuStock: null,
      // 该 SKU 其他批次的入库数量合计（编辑时已排除自己）
      otherInboundSum: 0,
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        productId: [{ required: true, message: '请选择商品', trigger: 'change' }],
        inboundNum: [{ required: true, message: '请输入入库数量', trigger: 'blur' }],
        productionDate: [{ validator: this.validateProductionDate, trigger: 'change' }],
        expiryDate: [{ validator: this.validateExpiryDate, trigger: 'change' }],
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
    /** 生产日期不能晚于今天：还没生产出来的货不可能已入库 */
    prodPickerOptions() {
      return { disabledDate: (d) => d.getTime() > Date.now() };
    },
    /** 有效期不能早于生产日期；未填生产日期时不限制 */
    expiryPickerOptions() {
      const prod = this.form.productionDate;
      if (!prod) return {};
      const min = new Date(`${prod}T00:00:00`).getTime();
      return { disabledDate: (d) => d.getTime() < min };
    },
    /** 有效期已过期，只提示不拦截 */
    expiryPassed() {
      if (!this.form.expiryDate) return false;
      return new Date(`${this.form.expiryDate}T23:59:59`).getTime() < Date.now();
    },
    /** 该规格在所选仓库的现有库存合计 */
    locStockTotal() {
      if (!this.locStock) return 0;
      return this.locStock.reduce((sum, s) => sum + (Number(s.stockNum) || 0), 0);
    },
    /** 该规格还有多少货没登记批次 = SKU 库存 − 各批次入库合计（含本批） */
    unregisteredNum() {
      if (this.skuStock == null) return 0;
      return Number(this.skuStock) - this.otherInboundSum - (Number(this.form.inboundNum) || 0);
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
    onReset() { this.query = { page: 1, limit: 20, warehouseId: null, merId: null, productId: null, batchNo: '', sourceCode: '', supplierName: '', status: null, onlyRemain: false, expiryWithinDays: null }; this.loadPage(); },
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
    openEdit(row) {
      this.form = row ? { ...row } : this.emptyForm();
      this.productName = '';
      this.locStock = null;
      // 编辑时 SKU 库存拿不到（没走商品选择器），未登记数量那块就不显示
      this.skuStock = null;
      this.otherInboundSum = 0;
      this.editVisible = true;
      if (row) {
        // 编辑时仓库和商品已确定，直接把库位分布拉出来
        this.loadLocationStock();
        // 批次表只存 productId，没存商品名称，补查一次否则只显示「商品#3」
        this.loadProductName(row.productId);
      }
    },
    /**
     * picker 的 disabledDate 只挡鼠标点选，手输还是能绕过，所以校验必须再做一遍。
     * 生产日期不能晚于今天。
     */
    validateProductionDate(rule, value, callback) {
      if (!value) return callback();
      const d = new Date(`${value}T00:00:00`).getTime();
      const endOfToday = new Date().setHours(23, 59, 59, 999);
      if (d > endOfToday) {
        return callback(new Error('生产日期不能晚于今天'));
      }
      callback();
    },
    /** 有效期必须晚于生产日期；已过期只在界面上警告，不在这里拦 */
    validateExpiryDate(rule, value, callback) {
      if (!value || !this.form.productionDate) return callback();
      const exp = new Date(`${value}T00:00:00`).getTime();
      const prod = new Date(`${this.form.productionDate}T00:00:00`).getTime();
      if (exp < prod) {
        return callback(new Error(`有效期不能早于生产日期(${this.form.productionDate})`));
      }
      callback();
    },
    /** 两个日期互相约束，改一个要重校验另一个 */
    onDateChange() {
      this.$nextTick(() => {
        const f = this.$refs.formRef;
        if (!f) return;
        f.validateField('productionDate');
        f.validateField('expiryDate');
      });
    },
    /** 编辑态回显商品名称，查不到就退化成「商品#ID」，不阻断编辑 */
    async loadProductName(productId) {
      if (!productId) return;
      try {
        const res = await productDetailApi(productId);
        if (res && res.name) this.productName = res.name;
      } catch (e) { /* 名称拿不到不影响改批次 */ }
    },
    /**
     * 剩余数量不再让人填，新增时自动等于入库数量：这批刚入库、还没出过。
     * 它是出库扣减的依据（deductByFefo 按它决定这批还能出多少），手填容易出错。
     *
     * 编辑已有批次不同步 —— 那批货可能已经出掉一部分，
     * 改入库数就把剩余抹回满值，批次账会凭空多出货。
     */
    onInboundNumChange(val) {
      if (!this.form.id) {
        this.form.remainNum = Number(val || 0);
      }
    },
    /**
     * 查该规格当前在这个仓的库位分布，纯展示用，不改表单里的任何值。
     * 建批次时操作员需要知道「这个规格现在放在哪几个库位、各有多少」，
     * 好决定这批新货该放哪、跟哪批是同一堆。
     */
    async loadLocationStock() {
      this.locStock = null;
      if (!this.form.warehouseId || !this.form.productId) return;
      this.locLoading = true;
      try {
        const res = await stockApi.page({
          page: 1,
          limit: 100,
          warehouseId: this.form.warehouseId,
          productId: this.form.productId,
          attrValueId: this.form.attrValueId,
          merId: this.form.merId,
        });
        this.locStock = (res && res.list) || [];
      } catch (e) {
        this.locStock = null;
      } finally {
        this.locLoading = false;
      }
    },
    /**
     * 拉该 SKU 其他批次的入库数量合计。
     * 不限仓库 —— 与商品 SKU 库存同口径，那个数本来就是跨仓总量。
     */
    async loadOtherInboundSum() {
      this.otherInboundSum = 0;
      if (!this.form.productId) return;
      try {
        const n = await batchApi.inboundSum({
          productId: this.form.productId,
          attrValueId: this.form.attrValueId,
          excludeId: this.form.id || undefined,
        });
        this.otherInboundSum = Number(n) || 0;
      } catch (e) { /* 查不到就当 0，只影响提示数字 */ }
    },
    /** 切仓库要重查：库位是按仓隔离的 */
    onWarehouseChange() {
      this.loadLocationStock();
    },
    /** 切换商户时清空已选商品 */
    onMerChange() {
      this.form.productId = null;
      this.form.attrValueId = null;
      this.form.sku = '';
      this.productName = '';
      this.locStock = null;
      this.skuStock = null;
      this.otherInboundSum = 0;
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

        // 商品详情里该 SKU 的库存，用来算「还有多少货没登记批次」
        this.skuStock = sku && sku.stock != null ? Number(sku.stock) : null;

        this.$refs.formRef && this.$refs.formRef.clearValidate('productId');
        this.loadLocationStock();
        this.loadOtherInboundSum();
      }
    },
    async onSubmit() {
      await this.$refs.formRef.validate();
      // 新增时剩余固定等于入库量。onInboundNumChange 只在值变化时触发，
      // 直接敲数字再点保存有可能没走到，这里兜一下。
      if (!this.form.id) this.form.remainNum = Number(this.form.inboundNum) || 0;
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
.form-tips { margin: 4px 0 0; font-size: 12px; line-height: 1.5; color: #909399; }
.unreg-box { margin-top: 6px; padding: 6px 10px; background: #f4f4f5; border-radius: 3px; font-size: 12px; line-height: 1.6; }
.unreg-label { color: #606266; }
.unreg-num { margin: 0 6px; font-size: 15px; font-weight: bold; color: #409eff; }
.unreg-formula { color: #909399; }
.loc-stock { margin-top: 6px; font-size: 12px; line-height: 1.7; color: #606266; }
.loc-stock-head { margin: 0 0 2px; color: #909399; }
.loc-total { color: #409eff; }
.loc-stock-row { margin: 0; padding-left: 10px; }
.loc-name { display: inline-block; min-width: 200px; }
.loc-num { display: inline-block; min-width: 60px; color: #67c23a; font-weight: bold; }
.loc-batch { color: #c0c4cc; }
</style>

