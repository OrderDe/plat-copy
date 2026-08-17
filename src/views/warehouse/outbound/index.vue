<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="出库单号">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="关联订单号">
        <el-input v-model="query.relatedCode" placeholder="请输入订单号" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="订单金额">
        <el-input v-model="query.payPrice" placeholder="请输入金额" clearable @keyup.enter.native="onSearch" />
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
          <el-option label="待组波" :value="0" />
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
      <el-table-column label="关联单号" width="180" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.relatedCode || '-' }}</template>
      </el-table-column>
      <el-table-column prop="customerCode" label="客户" width="120" show-overflow-tooltip />
      <el-table-column label="物流状态" width="150">
        <template slot-scope="{row}">
          <el-tooltip :content="logisticsTip(row)" placement="top">
            <el-tag :type="logisticsType(row)" size="mini">{{ logisticsText(row) }}</el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
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
          <!-- 调拨/报损/领用的库存已由源单扣减，进波次会二次扣减，这里不给入口 -->
          <el-button v-if="row.status === 0 && !SOURCE_DOC_TYPES.includes(row.type)" type="text" @click="goWave">去组波</el-button>
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
              <!-- 调拨出库的仓库由调拨单的调出仓决定，选错后端也会改回，这里直接锁定 -->
              <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%"
                         :disabled="hasSourceDoc" @change="onWarehouseChange">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" style="width:100%" @change="onTypeChange">
                <el-option v-for="t in typeOptions" :key="t.itemValue" :label="t.itemName" :value="t.itemValue" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="hasSourceDoc" :span="24">
            <el-form-item :label="'关联' + sourceDocName" prop="sourceDocId" required>
              <el-select
                v-model="form.sourceDocId"
                filterable
                :placeholder="`只能选择审批通过且尚未出库的${sourceDocName}`"
                style="width:100%"
                :loading="sourceLoading"
                :disabled="dialogMode === 'view'"
                @change="onSourceChange"
              >
                <el-option
                  v-for="o in sourceOptions"
                  :key="o.id"
                  :label="`${o.code}｜${o.summary}｜${(o.items || []).length} 条明细`"
                  :value="o.id"
                />
              </el-select>
              <div v-if="dialogMode === 'add' && !sourceLoading && !sourceOptions.length" class="hint-text">
                没有可关联的{{ sourceDocName }}：需先提交并审批通过，且未被其他出库单占用。
              </div>
              <div v-else-if="dialogMode === 'add'" class="hint-text">
                明细按{{ sourceDocName }}批准的内容自动带出，不可修改；库存已由{{ sourceDocName }}扣减，本单只作出库凭证，不需要组波拣货。
              </div>
            </el-form-item>
          </el-col>
          <el-col v-if="isSale" :span="24">
            <el-form-item label="关联订单号" prop="relatedCode" required>
              <!-- 订单量大，不适合一次性拉全量，走远程搜索：输入订单号或收货人再查 -->
              <el-select
                v-model="form.relatedCode"
                filterable
                remote
                clearable
                allow-create
                default-first-option
                reserve-keyword
                placeholder="输入订单号搜索并选择，默认只列待发货订单"
                style="width:100%"
                :loading="orderLoading || orderItemsLoading"
                :remote-method="searchOrders"
                :disabled="dialogMode === 'view'"
                @focus="searchOrders('')"
                @change="onOrderChange"
              >
                <el-option
                  v-for="o in orderOptions"
                  :key="o.orderNo"
                  :label="o.orderNo"
                  :value="o.orderNo"
                >
                  <span>{{ o.orderNo }}</span>
                  <span class="option-extra">{{ o.realName || '-' }} · ￥{{ o.payPrice }} · {{ o.statusText }}</span>
                </el-option>
              </el-select>
              <div v-if="dialogMode === 'add'" class="hint-text">
                只列可出库的订单：待发货/部分发货、无进行中退款、且含纳入仓储管理的商品。
                找不到时可直接输入订单号回车。选定后自动带出该订单的商品明细，无需手工添加。
              </div>
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
        <el-button v-if="dialogMode === 'add' && !itemsLocked" size="mini" icon="el-icon-plus" @click="addItem">添加行</el-button>
        <span v-else-if="hasSourceDoc && dialogMode === 'add'" class="hint-text">明细来自关联的{{ sourceDocName }}，如需调整请修改源单并重新审批。</span>
        <span v-else-if="itemsLocked && dialogMode === 'add'" class="hint-text">
          明细已按订单 {{ form.relatedCode }} 自动带出（已扣除退款和已发货数量），如需调整请先清空关联订单号。
        </span>
        <div class="dialog-table-scroller">
          <el-table :data="form.items" border size="mini" max-height="360">
            <el-table-column type="index" width="50" fixed="left" />
            <el-table-column label="店铺" width="180" fixed="left">
              <template slot-scope="{row}">
                <el-select v-model="row.merId" :disabled="itemsLocked" filterable size="mini" style="width:100%" placeholder="选择店铺" @change="onShopChangeWithBatch(row)">
                  <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="商品名称" min-width="220" fixed="left">
              <template slot-scope="{row}">
                <el-input v-model="row.goodsName" size="mini" readonly placeholder="点击选择商品">
                  <el-button v-if="!itemsLocked" slot="append" size="mini" icon="el-icon-search" @click="pickProductWithBatch(row)" />
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
                <el-input-number v-model="row.outboundTotalNum" :min="0" :disabled="itemsLocked" size="mini" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="实出库" width="110">
              <template slot-scope="{row}">
                <el-input-number v-model="row.actualOutboundNum" :min="0" size="mini" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column v-if="dialogMode === 'add' && !itemsLocked" label="操作" width="80" fixed="right">
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
import { outboundOrderCandidatesApi, orderDetailApi } from '@/api/order';
import warehouseFormMixin from '@/views/warehouse/components/warehouseFormMixin';
import { doPrint } from '@/views/warehouse/components/printUtil';

// 出库类型，与 wms_dict(outbound_type) 及后端 WmsOutboundServiceImpl 的常量一致
const TYPE_SALE = 0;
// 这三类的库存已由源单扣减（调拨发货 / 报损、领用审批通过），出库单只作凭证，不进波次
const SOURCE_DOC_NAMES = { 1: '调拨单', 2: '报损单', 3: '领用申请单' };
const SOURCE_DOC_TYPES = Object.keys(SOURCE_DOC_NAMES).map(Number);

export default {
  name: 'WarehouseOutbound',
  mixins: [warehouseFormMixin],
  data() {
    return {
      SOURCE_DOC_TYPES,
      loading: false, saving: false, total: 0, tableData: [],
      // 出库要从仓里取货，选品时现有库存为 0 的标红提醒
      productPickerRequireStock: true,
      query: { page: 1, limit: 20, code: '', relatedCode: '', payPrice: '', warehouseId: null, type: null, status: null },
      typeOptions: [], // 出库类型，来自 wms_dict(outbound_type)
      sourceOptions: [], // 可关联的源单（审批通过且未被占用）
      sourceLoading: false,
      orderOptions: [], // 销售出库可关联的订单（远程搜索结果）
      orderLoading: false,
      orderItemsLoading: false,
      // 明细是否由源单或订单自动带出：带出的明细不允许手工改，避免和源头对不上
      itemsAutoFilled: false,
      dialogVisible: false, dialogMode: 'add',
      // 批次下拉缓存：key = 仓+商户+商品+SKU，避免每次展开都请求
      batchOptions: {},
      form: this.emptyForm(),
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        applyUserId: [{ required: true, message: '请选择申请人', trigger: 'change' }],
        sourceDocId: [{ required: true, message: '请关联一张审批通过的源单', trigger: 'change' }],
        relatedCode: [{ required: true, message: '销售出库必须填写关联订单号', trigger: 'blur' }],
      },
    };
  },
  computed: {
    /** 调拨/报损/领用：单据内容以源单为准，仓库和明细都不允许手工改 */
    hasSourceDoc() { return !!SOURCE_DOC_NAMES[this.form.type]; },
    sourceDocName() { return SOURCE_DOC_NAMES[this.form.type] || '源单'; },
    isSale() { return this.form.type === TYPE_SALE; },
    /** 明细来自源单或订单，一律只读 */
    itemsLocked() { return this.hasSourceDoc || this.itemsAutoFilled; },
  },
  created() {
    this.loadTypeOptions();
    this.loadPage();
  },
  methods: {
    emptyForm() { return { warehouseId: null, type: 0, sourceDocId: null, relatedCode: '', applyUserId: null, applyUserName: '', applyUserPhone: '', customerCode: '', expressCompany: '', priority: 0, remark: '', items: [] }; },

    /** 切类型：换了类型原来的关联和带出明细都不再适用，一律清空重来 */
    onTypeChange() {
      this.form.sourceDocId = null;
      this.form.relatedCode = '';
      this.form.items = [];
      this.sourceOptions = [];
      this.itemsAutoFilled = false;
      if (this.hasSourceDoc) this.loadSourceOptions();
    },
    /**
     * 远程搜索可关联的订单。
     * 服务端已过滤掉取消、退款中、无仓管商品的单，状态文案也由服务端给，
     * 前端不再自己写死「待发货」——之前已退款的单也被标成待发货，选了才发现出不了货。
     * 查不到时允许手工输入（allow-create），避免历史单或特殊场景被卡死。
     */
    async searchOrders(keyword) {
      this.orderLoading = true;
      try {
        const res = await outboundOrderCandidatesApi({
          keyword: (keyword || '').trim(),
          limit: 20,
        });
        const list = (res && (res.list || res.data || res)) || [];
        this.orderOptions = (Array.isArray(list) ? list : []).map((o) => ({
          orderNo: o.orderNo,
          realName: o.realName,
          payPrice: o.payPrice,
          statusText: o.statusText,
        }));
      } catch (e) {
        // 订单服务查不通不该挡住建单，退回手工输入
        this.orderOptions = [];
      } finally { this.orderLoading = false; }
    },
    /**
     * 选中/输入订单号后自动带出该订单的商品明细。
     *
     * 出库数取「实付数 - 已退款数 - 已发货数」：整单退掉或已发过的部分不该再出一次。
     * 算下来没有可出的行时不静默留空，明确提示，否则操作员会以为系统没查出来。
     */
    async onOrderChange(orderNo) {
      this.$refs.formRef && this.$refs.formRef.validateField('relatedCode');
      // 清空订单号 = 回到手工录入模式
      if (!orderNo) {
        this.itemsAutoFilled = false;
        this.form.items = [];
        return;
      }
      this.orderItemsLoading = true;
      try {
        const res = await orderDetailApi({ orderNo });
        const data = (res && (res.data !== undefined ? res.data : res)) || {};
        const details = data.orderDetailList || [];
        const items = [];
        details.forEach((d) => {
          const num = (d.payNum || 0) - (d.refundNum || 0) - (d.deliveryNum || 0);
          if (num <= 0) return;
          items.push({
            productId: d.productId,
            attrValueId: d.attrValueId,
            sku: d.sku,
            barCode: '',
            platformType: d.platformType == null ? 0 : d.platformType,
            merId: d.merId,
            goodsName: d.productName,
            batchId: null,
            outboundTotalNum: num,
            actualOutboundNum: num,
          });
        });
        if (!items.length) {
          this.itemsAutoFilled = false;
          this.form.items = [];
          this.$message.warning('该订单没有可出库的商品（可能已全部发货或已退款），请核对订单');
          return;
        }
        this.batchOptions = {};
        this.form.items = items;
        this.itemsAutoFilled = true;
        // 订单可能跨商户，仓库仍由操作员选：一张订单的货未必都在同一个仓
        this.$message.success(`已按订单带出 ${items.length} 条明细`);
      } catch (e) {
        // 查不到明细不该挡住建单，退回手工录入
        this.itemsAutoFilled = false;
        this.$message.warning('未能读取该订单的商品明细，请手工添加出库明细');
      } finally { this.orderItemsLoading = false; }
    },
    async loadSourceOptions() {
      this.sourceLoading = true;
      try {
        const res = await outboundApi.sourceOptions(this.form.type);
        this.sourceOptions = (res && (res.data !== undefined ? res.data : res)) || [];
      } catch (e) {
        this.sourceOptions = [];
      } finally { this.sourceLoading = false; }
    },
    /** 选定源单：仓库锁成源单的仓库，明细按批准内容带出（后端也会以源单为准重算一遍） */
    onSourceChange(sourceDocId) {
      const hit = this.sourceOptions.find((o) => o.id === sourceDocId);
      if (!hit) return;
      this.form.warehouseId = hit.warehouseId;
      this.form.relatedCode = hit.code;
      this.batchOptions = {};
      this.form.items = (hit.items || []).map((it) => ({ ...it, batchId: null }));
      this.itemsAutoFilled = true;
    },
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
    /**
     * status=0 不是「还没提交的草稿」——手工「提交生效」入口已下线，出库一律走
     * 波次 → 拣货 → 复核，库存在复核时才扣。这个状态的实际含义是「已受理，等着组波」，
     * 叫草稿会让人以为还缺一步人工操作。status=1 则代表库存已经扣完。
     */
    statusText(s) { return ({ 0: '待组波', 1: '已生效', 2: '已作废' })[s] || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'success', 2: 'danger' })[s] || ''; },
    /**
     * 物流阶段。非销售出库和作废单不展示物流流程。
     *
     * 生效后根据是否取得运单号、是否完成交接展示当前进度。
     * 这样操作员无需在多个页面之间反复确认承运商状态。
     * 提示内容同时说明每个状态对应的处理动作。
     *
     * 当前轨迹回调只记录日志，暂不展示运输中、派送中和签收状态。
     * 后续接入轨迹落库后可继续细分物流阶段。
     */
    logisticsStage(row) {
      if (row.type !== TYPE_SALE) return 'none';
      if (row.status === 2) return 'canceled';
      if (!row.expressNo) return row.status === 1 ? 'noWaybill' : 'waiting';
      return row.handoverStatus === 1 ? 'handed' : 'notified';
    },
    logisticsText(row) {
      return {
        none: '-',
        canceled: '已作废',
        waiting: '待拣货',
        noWaybill: '未取号',
        notified: '已通知承运商',
        handed: '已交接承运商',
      }[this.logisticsStage(row)];
    },
    logisticsType(row) {
      return {
        none: 'info', canceled: 'info', waiting: 'info',
        noWaybill: 'warning', notified: 'primary', handed: 'success',
      }[this.logisticsStage(row)];
    },
    logisticsTip(row) {
      return {
        none: '非销售出库单不涉及订单物流',
        canceled: '出库单已作废，未进入物流',
        waiting: '出库单已受理，组波拣货复核完成后自动向承运商下单取号',
        noWaybill: '已生效但没有运单号，请检查仓库联系人和地址配置',
        notified: `已向承运商下单，运单号 ${row.expressNo}，等待司机取货`,
        handed: '已交接给承运商，订单已回写为已发货',
      }[this.logisticsStage(row)];
    },
    async loadPage() {
      this.loading = true;
      try {
        const res = await outboundApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', relatedCode: '', payPrice: '', warehouseId: null, type: null, status: null }; this.loadPage(); },
    openDialog() {
      this.form = this.emptyForm();
      this.itemsAutoFilled = false;
      this.dialogMode = 'add';
      this.dialogVisible = true;
      if (this.hasSourceDoc) this.loadSourceOptions();
    },
    async openDetail(id) {
      const res = await outboundApi.detail(id);
      this.form = res || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.itemsAutoFilled = false;
      // 详情里下拉只用来显示单号，历史单关联的源单已被占用不在候选里，这里补一条
      if (this.form.sourceDocId) {
        this.sourceOptions = [{
          id: this.form.sourceDocId,
          code: this.form.relatedCode || ('源单#' + this.form.sourceDocId),
          warehouseId: this.form.warehouseId,
          summary: '',
          items: this.form.items || [],
        }];
      }
      this.dialogMode = 'view';
      this.dialogVisible = true;
    },
    addItem() {
      this.form.items.push({ productId: null, attrValueId: null, sku: '', barCode: '', platformType: 0, merId: null, goodsName: '', batchId: null, outboundTotalNum: 0, actualOutboundNum: 0, _options: [], _loading: false });
    },
    resetForm() { this.$refs.formRef && this.$refs.formRef.resetFields(); },
    async onSubmitForm() {
      await this.$refs.formRef.validate();
      if (!this.form.items.length) {
        return this.$message.warning(this.hasSourceDoc ? `所选${this.sourceDocName}没有明细，无法生成出库单` : '请至少添加一行明细');
      }
      // 这几条是给「手工逐行录入」兜底的。源单或订单带出的明细是权威数据。
      // 单规格商品的 attrValueId 本来就是 0，用同一套校验会把它当成「没选规格」拦下来。
      if (!this.itemsLocked) {
        if (this.form.items.find((i) => !i.productId)) return this.$message.warning('请为每行选择商品');
      // 仓储按 SKU 扣账，缺 attrValueId 会扣不到对应规格的库存行
        const noSku = this.form.items.findIndex((i) => !i.attrValueId);
      if (noSku >= 0) return this.$message.warning(`第 ${noSku + 1} 行未选择规格，请重新选择商品并指定规格`);
        // 库存按商户分行存放，漏填店铺会导致拣货分配和复核扣减都定位不到库存
        const noShop = this.form.items.findIndex((i) => !i.merId);
      if (noShop >= 0) return this.$message.warning(`第 ${noShop + 1} 行未选择店铺，将无法定位该商户的库存`);
      }
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
.hint-text { color: #909399; font-size: 12px; line-height: 1.6; }
/* 下拉里订单的辅助信息靠右淡显，不抢订单号的视觉重心 */
.option-extra { float: right; color: #8492a6; font-size: 12px; margin-left: 16px; }
</style>



