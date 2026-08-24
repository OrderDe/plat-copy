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
      <!-- 来源单号：退货入库是售后单，调拨入库是调拨单，列表上直接能核对 -->
      <el-table-column label="关联单据" width="180" show-overflow-tooltip>
        <template slot-scope="{row}">{{ row.relatedCode || '-' }}</template>
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
              <el-select v-model="form.type" style="width:100%" @change="onTypeChange">
                <el-option v-for="t in typeOptions" :key="t.itemValue" :label="t.itemName" :value="t.itemValue" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 退货入库才需要关联售后单：没有它入库单和售后单对不上，
               自动同步补偿成功后还会再入一次库 -->
          <el-col v-if="isReturnType" :span="24">
            <el-form-item label="关联退货单" :prop="editable ? 'relatedCode' : ''" :required="editable">
              <el-select
                v-model="form.relatedCode"
                filterable
                remote
                clearable
                :remote-method="loadRefundOptions"
                :loading="refundLoading"
                placeholder="搜索售后单号 / 订单号，选中后自动带出退货明细"
                style="width:100%"
                @change="onRefundChange"
              >
                <el-option
                  v-for="r in refundOptions"
                  :key="r.refundOrderNo"
                  :label="`${r.refundOrderNo}（订单 ${r.orderNo || '-'}）· ${r.summary}`"
                  :value="r.refundOrderNo"
                />
              </el-select>
              <div class="form-tip">
                正常退货由商家确认收货后自动生成入库单，这里只用于同步失败后的人工补录；已建过入库单的退货单不会出现在列表里。
              </div>
            </el-form-item>
          </el-col>
          <!-- 调拨入库必须挂在一张调拨申请单上：没有它就对不出这批货是哪张调拨单调来的，
               也挡不住同一张调拨单被入库两次（调出仓扣一次、调入仓加两次） -->
          <el-col v-if="isTransferType" :span="24">
            <el-form-item label="关联调拨单" :prop="editable ? 'relatedCode' : ''" :required="editable">
              <el-select
                v-model="form.relatedCode"
                filterable
                clearable
                :loading="transferLoading"
                placeholder="选择在途的调拨单，选中后自动带出调拨明细"
                style="width:100%"
                @change="onTransferChange"
              >
                <el-option
                  v-for="t in transferOptions"
                  :key="t.transferCode"
                  :label="`${t.transferCode} · ${t.summary}`"
                  :value="t.transferCode"
                />
              </el-select>
              <div class="form-tip">
                只列出<b>调入仓是当前仓库、且已发货在途</b>的调拨单；待发货的货还在调出仓，已到货的收过了，都不在这里。已建过入库单的也不会出现。
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
            <el-table-column label="货架 *" width="130">
              <template slot-scope="{row}">
                <el-select v-model="row.shelfId" size="mini" filterable clearable style="width:100%" @change="onShelfChange(row)" :disabled="!form.warehouseId">
                  <el-option v-for="s in shelfOptions" :key="s.id" :label="s.code" :value="s.id" />
                </el-select>
                <div v-if="zoneRule && !shelfOptions.length" class="cap-warn">该仓没有{{ zoneRule.name }}货架，请先到货架管理配置</div>
              </template>
            </el-table-column>
            <el-table-column label="库位 *" width="150">
              <template slot-scope="{row}">
                <el-select v-model="row.locationId" size="mini" filterable clearable style="width:100%" :disabled="!row.shelfId">
                  <el-option v-for="l in zoneLocations(row.shelfId)" :key="l.id" :label="locationOptionLabel(l, row)" :value="l.id" :disabled="locationOptionDisabled(l, row)" />
                </el-select>
                <div v-if="capacityHint(row)" class="cap-warn">{{ capacityHint(row) }}</div>
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
            <el-table-column v-if="editable" label="操作" width="110" fixed="right">
              <template slot-scope="{row, $index}">
                <el-button type="text" class="danger-text" @click="form.items.splice($index, 1)">删除</el-button>
                <!-- 一个库位放不下就得分几个库位放。明细行本身只能带一个库位，
                     所以这里按选中的库位把这一行拆成多行，每行一个库位 -->
                <el-button type="text" @click="openSplit(row, $index)">拆分库位</el-button>
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

    <!-- 拆分库位：一行明细的数量分摊到多个库位，确认后拆成多行明细 -->
    <el-dialog title="拆分到多个库位" :visible.sync="splitVisible" width="620px" append-to-body>
      <div class="split-head">
        <span>{{ splitRow.goodsName || '商品' }}</span>
        <span class="split-total">待分配 {{ splitRemain }} / {{ splitTotal }} 件</span>
      </div>
      <el-table :data="splitRows" border size="mini" max-height="300">
        <el-table-column type="index" width="45" />
        <el-table-column label="货架" width="150">
          <template slot-scope="{row}">
            <el-select v-model="row.shelfId" size="mini" filterable clearable style="width:100%" @change="onSplitShelfChange(row)">
              <el-option v-for="s in shelfOptions" :key="s.id" :label="s.code" :value="s.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="库位" min-width="200">
          <template slot-scope="{row}">
            <el-select v-model="row.locationId" size="mini" filterable clearable style="width:100%" :disabled="!row.shelfId">
              <el-option
                v-for="l in zoneLocations(row.shelfId)"
                :key="l.id"
                :label="splitLocationLabel(l, row)"
                :value="l.id"
                :disabled="splitLocationDisabled(l, row)"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template slot-scope="{row}">
            <el-input-number v-model="row.num" :min="0" size="mini" controls-position="right" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60">
          <template slot-scope="{$index}">
            <el-button type="text" class="danger-text" @click="splitRows.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button size="mini" icon="el-icon-plus" style="margin-top:8px" @click="addSplitRow">添加库位</el-button>
      <p class="split-tip">
        各库位数量之和必须等于该行实入库数量；库位余量不足的会在确认时提示。
      </p>
      <div slot="footer">
        <el-button size="small" @click="splitVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="confirmSplit">确认拆分</el-button>
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
import { locationLabel, locationDisabled, locationRemainForRow, findOverCapacity, overCapacityMessage } from '@/views/warehouse/components/locationCapacity';

/** 字典里查不到「退货」类型时的兜底值，与后端 WmsInboundServiceImpl.TYPE_RETURN 一致 */
const RETURN_TYPE_FALLBACK = 2;
const TRANSFER_TYPE_FALLBACK = 1;
/** 货架类型：3退货区 7待检区（见 wms_shelf.type） */
const SHELF_TYPE_RETURN = 3;
const SHELF_TYPE_QC = 7;
/** 库位用途：1待检区（见 wms_location.usage_type） */
const USAGE_QC = 1;

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
      // 拆分库位弹窗：splitIndex 记住是哪一行，确认时用拆出来的多行替换它
      splitVisible: false, splitIndex: -1, splitRow: {}, splitRows: [],
      typeOptions: [], // 入库类型，来自 wms_dict(inbound_type)
      refundOptions: [],   // 可关联的售后退货单
      refundLoading: false,
      transferOptions: [], // 可关联的调拨申请单（在途）
      transferLoading: false,
      rules: {
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        applyUserId: [{ required: true, message: '请选择申请人', trigger: 'change' }],
        relatedCode: [{ required: true, message: '请选择关联单据', trigger: 'change' }],
      },
    };
  },
  computed: {
    editable() { return this.dialogMode === 'add' || this.dialogMode === 'edit'; },
    /**
     * 退货入库类型。取字典里名称含「退货」的项，而不是写死 2——
     * 类型是字典维护的，平台改了配置这里不该跟着失效。
     */
    returnTypeValue() {
      const hit = this.typeOptions.find((t) => (t.itemName || '').includes('退货'));
      return hit ? hit.itemValue : RETURN_TYPE_FALLBACK;
    },
    isReturnType() { return this.form.type === this.returnTypeValue; },
    /** 调拨入库类型，同样按字典名称取，不写死 1 */
    transferTypeValue() {
      const hit = this.typeOptions.find((t) => (t.itemName || '').includes('调拨'));
      return hit ? hit.itemValue : TRANSFER_TYPE_FALLBACK;
    },
    isTransferType() { return this.form.type === this.transferTypeValue; },
    /**
     * 本单的货该落在哪个区。
     *
     * 只有可售区库位的库存会同步成商城可售库存，所以未质检的货（平台/采购入库）必须先进待检区、
     * 客户退回的货必须进退货区。以前下拉列的是全仓货架库位，选到可售区就等于把这批货直接上架卖了，
     * 而且没有任何一步会报错。这里把不该选的直接从下拉里去掉。
     * 返回 null 表示该类型不限制（调拨入库的货在调出仓已经检过，其他是兜底类型）。
     */
    zoneRule() {
      if (this.isReturnType) return { shelfType: SHELF_TYPE_RETURN, usage: null, name: '退货区' };
      if (this.form.type === this.transferTypeValue) return null;
      const t = this.typeText(this.form.type) || '';
      // 平台入库 / 采购入库：待检区货架 + 待检区库位
      if (t.includes('平台') || t.includes('采购')) {
        return { shelfType: SHELF_TYPE_QC, usage: USAGE_QC, name: '待检区' };
      }
      return null;
    },
    /** 按分区规则过滤后的货架下拉选项 */
    shelfOptions() {
      const rule = this.zoneRule;
      if (!rule || rule.shelfType == null) return this.shelfCache;
      return this.shelfCache.filter((s) => s.type === rule.shelfType);
    },
    /** 拆分弹窗：这一行明细一共要分配多少件 */
    splitTotal() { return this.splitTotalOf(this.splitRow || {}); },
    /** 还剩多少没分配，添加库位时默认带上，省得自己算 */
    splitRemain() {
      const used = this.splitRows.reduce((a, r) => a + (Number(r.num) || 0), 0);
      return this.splitTotal - used;
    },
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
    locationLabel,
    locationDisabled,
    /** 本单所有超容库位；按库位汇总，同一库位被多行选中时看的是合计 */
    overCapacityRows() {
      return findOverCapacity(
        this.form.items,
        (id) => Object.values(this.locationCache).flat().find((l) => l.id != null && String(l.id) === String(id)),
        (row) => (row.actualInboundNum != null ? row.actualInboundNum : row.inboundTotalNum),
        (row) => row.locationId,
      );
    },
    /** 拆分弹窗里这一行明细的总数（以实入库为准，没填则按应入库） */
    splitTotalOf(row) {
      const n = row.actualInboundNum != null ? row.actualInboundNum : row.inboundTotalNum;
      return Number(n) || 0;
    },
    openSplit(row, index) {
      if (!this.form.warehouseId) return this.$message.warning('请先选择仓库');
      const total = this.splitTotalOf(row);
      if (total <= 0) return this.$message.warning('请先填写该行的入库数量');
      this.splitIndex = index;
      this.splitRow = row;
      // 原来的库位作为第一条，数量先给满，剩下的由操作员往下拆
      this.splitRows = [{ shelfId: row.shelfId || null, locationId: row.locationId || null, num: total }];
      this.splitVisible = true;
    },
    addSplitRow() {
      this.splitRows.push({ shelfId: null, locationId: null, num: Math.max(0, this.splitRemain) });
    },
    async onSplitShelfChange(row) {
      row.locationId = null;
      await this.ensureLocations(row.shelfId);
    },
    /**
     * 确认拆分：把一行明细换成 N 行，每行一个库位。
     *
     * 数量必须刚好分完——分少了这批货有一部分没库位，分多了等于凭空多入库；
     * 两种都要等到提交生效时才被后端发现，那时候单据已经存下去了。
     */
    confirmSplit() {
      const rows = this.splitRows.filter((r) => Number(r.num) > 0);
      if (!rows.length) return this.$message.warning('请至少填写一个库位和数量');
      const noShelf = rows.findIndex((r) => !r.shelfId);
      if (noShelf >= 0) return this.$message.warning(`第 ${noShelf + 1} 行未选择货架`);
      const noLoc = rows.findIndex((r) => !r.locationId);
      if (noLoc >= 0) return this.$message.warning(`第 ${noLoc + 1} 行未选择库位`);
      const dup = rows.map((r) => r.locationId).filter((id, i, arr) => arr.indexOf(id) !== i);
      if (dup.length) return this.$message.warning('同一个库位不要拆成多行，合并成一行即可');
      const sum = rows.reduce((a, r) => a + Number(r.num || 0), 0);
      const total = this.splitTotalOf(this.splitRow);
      if (sum !== total) {
        return this.$message.warning(`各库位数量合计 ${sum} 件，与该行入库数量 ${total} 件对不上`);
      }
      const base = this.form.items[this.splitIndex];
      const created = rows.map((r) => ({
        ...base,
        shelfId: r.shelfId,
        locationId: r.locationId,
        inboundTotalNum: Number(r.num),
        actualInboundNum: Number(r.num),
      }));
      this.form.items.splice(this.splitIndex, 1, ...created);
      this.splitVisible = false;
      // 拆完立刻按累计口径复查一遍，哪个库位放不下当场就说
      const over = this.overCapacityRows();
      if (over.length) this.$message.warning(overCapacityMessage(over));
      else this.$message.success(`已拆分为 ${created.length} 行`);
    },
    /**
     * 该行所在库位是否超容，超了给一句行内红字，不用等到保存。
     *
     * <p>只在草稿可编辑时算。单据一旦生效，货就已经进了库位、库位的 remainNum 里
     * 已经扣掉了本单这批货；这时再拿本单数量去比剩余容量，等于把自己算了两遍，
     * 明明放得下也会一直显示「超出容量」。
     */
    capacityHint(row) {
      if (!this.editable) return '';
      if (!row.locationId) return '';
      const hit = this.overCapacityRows().find((o) => String(o.locationId) === String(row.locationId));
      return hit ? `超出容量，只剩 ${hit.remain} 件，请拆分库位` : '';
    },
    emptyForm() { return { warehouseId: null, type: 0, relatedCode: '', applyUserId: null, applyUserName: '', applyUserPhone: '', inboundUserId: null, inboundUserName: '', handlerUserName: '', remark: '', items: [] }; },
    /**
     * 按分区规则过滤某个货架下的库位。
     * 货架已经按类型筛过一轮，但同一个货架下的库位用途可以各不相同，这里再按用途筛一次。
     */
    zoneLocations(shelfId) {
      const list = this.locationCache[shelfId] || [];
      const rule = this.zoneRule;
      if (!rule || rule.usage == null) return list;
      return list.filter((l) => (l.usageType == null ? 0 : l.usageType) === rule.usage);
    },
    /** 换类型时清掉不再适用的关联单，免得建了张「采购入库」却挂着退货单号 */
    onTypeChange() {
      // 类型一变，原来选的货架/库位多半就不在新类型允许的区里了，留着只会在保存时才报错
      (this.form.items || []).forEach((it) => { it.shelfId = null; it.locationId = null; });
      if (this.isReturnType) {
        this.form.relatedCode = '';
        if (!this.refundOptions.length) this.loadRefundOptions('');
        return;
      }
      if (this.isTransferType) {
        this.form.relatedCode = '';
        this.loadTransferOptions();
        return;
      }
      this.form.relatedCode = '';
    },
    async loadTransferOptions() {
      this.transferLoading = true;
      try {
        const res = await inboundApi.transferOptions({ warehouseId: this.form.warehouseId || undefined });
        this.transferOptions = res || [];
      } catch (e) {
        this.transferOptions = [];
        this.$message.warning('调拨单加载失败，请重试');
      } finally {
        this.transferLoading = false;
      }
    },
    /** 同 ensureRefundOption：已建过入库单的调拨单不在下拉里，打开老单据要能显示出单号 */
    ensureTransferOption() {
      const no = this.form.relatedCode;
      if (!no || this.transferOptions.some((t) => t.transferCode === no)) return;
      this.transferOptions = [{ transferCode: no, summary: '本单已关联', items: [] }, ...this.transferOptions];
    },
    /** 选中调拨单后带出明细，数量以调拨单为准，避免人工录错件数 */
    onTransferChange(no) {
      if (!no) return;
      const hit = this.transferOptions.find((t) => t.transferCode === no);
      if (!hit || !(hit.items || []).length) return;
      const fill = () => {
        this.form.items = (hit.items || []).map((it) => ({ ...it }));
        this.$message.success(`已带出 ${this.form.items.length} 行调拨明细`);
      };
      if (this.form.items.length && !this.itemsEmpty()) {
        this.$confirm('带出调拨明细会覆盖已填写的明细，继续?', '提示', { type: 'warning' })
          .then(fill).catch(() => {});
        return;
      }
      fill();
    },
    /**
     * 已建过入库单的退货单不在下拉选项里（防重复入库），打开老单据时选项就匹配不上，
     * el-select 只会显示一串裸单号。补一条占位选项，让详情页照常显示。
     */
    ensureRefundOption() {
      const no = this.form.relatedCode;
      if (!no || this.refundOptions.some((r) => r.refundOrderNo === no)) return;
      this.refundOptions = [
        { refundOrderNo: no, orderNo: '', summary: '本单已关联', items: [] },
        ...this.refundOptions,
      ];
    },
    async loadRefundOptions(keyword) {
      this.refundLoading = true;
      try {
        const res = await inboundApi.refundOptions({ keyword: keyword || undefined });
        this.refundOptions = res || [];
      } catch (e) {
        this.refundOptions = [];
        this.$message.warning('退货单加载失败，请重试或手动核对售后单号');
      } finally {
        this.refundLoading = false;
      }
    },
    /**
     * 选中退货单后带出明细。
     * 明细直接用售后单的商品和数量，与自动同步走的是同一份数据，避免人工录错件数。
     */
    onRefundChange(no) {
      if (!no) return;
      const hit = this.refundOptions.find((r) => r.refundOrderNo === no);
      if (!hit) return;
      if (this.form.items.length && !this.itemsEmpty()) {
        this.$confirm('带出退货明细会覆盖已填写的明细，继续?', '提示', { type: 'warning' })
          .then(() => this.fillItemsFromRefund(hit))
          .catch(() => {});
        return;
      }
      this.fillItemsFromRefund(hit);
    },
    itemsEmpty() {
      return this.form.items.every((it) => !it.productId);
    },
    fillItemsFromRefund(hit) {
      this.form.items = (hit.items || []).map((it) => ({ ...it }));
      if (hit.orderNo) {
        const tip = `售后单 ${hit.refundOrderNo}（订单 ${hit.orderNo}）`;
        this.form.remark = this.form.remark ? `${this.form.remark} ${tip}` : tip;
      }
      this.$message.success(`已带出 ${this.form.items.length} 行退货明细`);
    },
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
    /**
     * 库位选项按 shelfId 缓存，且切仓库时不清空。
     *
     * 清空会和编辑单据抢时序：打开编辑时先给 form 赋值，watcher 排队去 loadShelves，
     * 而 openEdit 这边同时按明细里的 shelfId 拉库位；loadShelves 的清空动作发生在
     * 网络请求之后，正好把刚填好的库位选项抹掉，于是下拉「无数据」、
     * el-select 找不到匹配项只能把 value（库位ID）当文本显示出来。
     * shelfId 全局唯一，留着别的仓库的缓存不会串，行只按自己的 shelfId 取。
     */
    async loadShelves(warehouseId) {
      if (!warehouseId) { this.shelfCache = []; return; }
      try {
        const res = await shelfApi.page({ page: 1, limit: 999, warehouseId, status: 1 });
        // 接口参数 status=1 是服务端过滤，前端再兜底一次，避免旧服务或缓存把停用货架带进下拉。
        this.shelfCache = ((res && res.list) || []).filter((s) => Number(s.status) === 1);
      } catch (e) { this.shelfCache = []; }
    },
    async onShelfChange(row) {
      row.locationId = null;
      await this.ensureLocations(row.shelfId);
    },
    /**
     * 只补库位下拉选项，不动已选值：编辑草稿时要保留原来选好的库位。
     *
     * 停用/锁定的库位也留在选项里、只是禁选——过滤掉的话，草稿里选的库位一旦被停用，
     * 下拉里就没有匹配项，el-select 会退化成直接显示 value（库位ID）。
     */
    async ensureLocations(shelfId) {
      if (!shelfId || this.locationCache[shelfId]) return;
      try {
        const list = await locationApi.list(shelfId) || [];
        this.$set(this.locationCache, shelfId, list);
      } catch (e) {}
    },
    /** 明细里已选的货架要把库位选项带出来，否则下拉无数据、已选库位显示成 ID */
    async loadItemLocations() {
      const ids = [...new Set((this.form.items || []).map((it) => it.shelfId).filter(Boolean))];
      await Promise.all(ids.map((id) => this.ensureLocations(id)));
    },
    /** 库位下拉展示：停用/锁定的标出来，免得操作员选了才被后端打回 */
    locationOptionLabel(loc, row) {
      const base = locationLabel(loc, locationRemainForRow(loc, this.form.items, row));
      if (loc && loc.status !== 1) return `${base}（${loc.status === 2 ? '已锁定' : '已停用'}）`;
      return base;
    },
    locationOptionDisabled(loc, row) {
      const currentId = row && row.locationId;
      if (loc && loc.status !== 1 && String(loc.id) !== String(currentId)) return true;
      return locationDisabled(loc, currentId, locationRemainForRow(loc, this.form.items, row));
    },
    /**
     * 拆分弹窗里同一个库位只能出现一次。
     *
     * 拆分的意义是把一行货分散到不同库位，重复选同一个库位没有意义；更要紧的是每行的
     * 剩余容量是各算各的，两行选同一库位时校验都判通过，合计却超容，生效时才被后端打回。
     */
    splitLocationDisabled(loc, row) {
      if (this.locationOptionDisabled(loc, row.locationId)) return true;
      return this.splitLocationTaken(loc, row);
    },
    splitLocationTaken(loc, row) {
      if (!loc) return false;
      return this.splitRows.some((r) => r !== row && String(r.locationId) === String(loc.id));
    },
    /** 被别的行占掉的库位标注出来，否则只是灰着，操作员不知道为什么选不了 */
    splitLocationLabel(loc, row) {
      const base = this.locationOptionLabel(loc);
      return this.splitLocationTaken(loc, row) ? `${base}（已在其他行选择）` : base;
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
      this.ensureRefundOption();
      if (this.isTransferType) { await this.loadTransferOptions(); this.ensureTransferOption(); }
      // 货架下拉和库位下拉都要在弹窗打开前备好，否则先看到的是空下拉
      await Promise.all([this.loadShelves(this.form.warehouseId), this.loadItemLocations()]);
      this.dialogMode = 'edit';
      this.dialogVisible = true;
    },
    async openDetail(id) {
      const res = await inboundApi.detail(id);
      this.form = res || this.emptyForm();
      if (!this.form.items) this.form.items = [];
      this.ensureRefundOption();
      if (this.isTransferType) this.ensureTransferOption();
      // 详情用的是同一个弹窗，库位列也是下拉，不备选项照样只显示库位ID
      await Promise.all([this.loadShelves(this.form.warehouseId), this.loadItemLocations()]);
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
      const noShelf = this.form.items.findIndex(i => !i.shelfId);
      if (noShelf >= 0) return this.$message.warning(`第 ${noShelf + 1} 行未选择货架`);
      const noLocation = this.form.items.findIndex(i => !i.locationId);
      if (noLocation >= 0) return this.$message.warning(`第 ${noLocation + 1} 行未选择库位`);
      // 应入库是「这批该到多少」，填 0 的行就是录错了，留着只会让人以为漏发货
      const zeroPlan = this.form.items.findIndex(i => !(Number(i.inboundTotalNum) > 0));
      if (zeroPlan >= 0) return this.$message.warning(`第 ${zeroPlan + 1} 行应入库数量必须大于 0`);
      // picker 的 disabledDate 只挡鼠标点选，手输能绕过，保存前统一再查一遍
      const badDate = this.checkItemDates();
      if (badDate) return this.$message.warning(badDate);
      // 容量在后端是硬约束，但那道拦截在「提交生效」时才触发、而且一行一行报。
      // 这里一次把所有放不下的库位说清楚，省得改一轮报一个。
      const over = this.overCapacityRows();
      if (over.length) return this.$message.warning(overCapacityMessage(over));
      this.saving = true;
      try {
        const payload = {
          ...this.form,
          relatedCode: (this.isReturnType || this.isTransferType) ? (this.form.relatedCode || null) : null,
          items: this.stripItemMeta(this.form.items),
        };
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
      // 实入库全 0 的单生效后什么也没入，却再也改不了，只能作废重开——先问清楚。
      // 这里的 detail 失败必须报出来：不接住的话 promise 静默 reject，
      // 按钮点下去毫无反应，操作员只会以为页面卡了。
      let total = 0;
      try {
        const detail = await inboundApi.detail(row.id);
        const items = (detail && detail.items) || [];
        total = items.reduce((a, it) => a + (Number(it.actualInboundNum) || 0), 0);
      } catch (e) {
        return this.$message.error((e && (e.message || e.msg)) || '入库单详情加载失败，请重试');
      }
      if (total <= 0) {
        return this.$message.warning('实入库数量合计为 0，没有货可入库；请先填写实际到货数量，若确实未到货请作废本单');
      }
      try {
        await this.$confirm(`提交后将增加库存 ${total} 件、写流水、反写商品库，不可撤销。继续？`, '确认', { type: 'warning' });
      } catch (e) {
        return; // 用户点了取消
      }
      try {
        await inboundApi.submit(row.id);
        this.$message.success('已生效');
        this.loadPage();
      } catch (e) {
        this.$message.error((e && (e.message || e.msg)) || '提交生效失败');
      }
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
.form-tip { margin-top: 2px; font-size: 12px; line-height: 1.6; color: #909399; }
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
.cap-warn { color: #f56c6c; font-size: 12px; line-height: 1.4; margin-top: 2px; }
.split-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px; }
.split-total { color: #909399; }
.split-tip { margin: 8px 0 0; font-size: 12px; color: #909399; line-height: 1.5; }
</style>
