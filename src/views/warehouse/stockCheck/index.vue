<template>
  <div class="app-container inventory-check">
    <!-- 顶部：标题 + 全局入口，与原型 app-header 一致 -->
    <header class="app-header">
      <div class="app-heading">
        <div class="app-heading-icon"><i class="el-icon-tickets" /></div>
        <div>
          <strong>库存盘点</strong>
          <div class="text-small text-muted">盘点单列表 / {{ stepLabels[activeStep] }}</div>
        </div>
      </div>
      <div class="header-actions">
        <el-button size="small" icon="el-icon-time" @click="showStep('history')">历史记录</el-button>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="onNewCheck">新建盘点单</el-button>
      </div>
    </header>

    <!-- 流程导航：两步 -->
    <nav v-if="checkDialogVisible" class="workflow">
      <button
        v-for="(key, index) in stepOrder"
        :key="key"
        type="button"
        class="workflow-step"
        :class="{ 'is-selected': activeStep === key }"
        @click="showStep(key)"
      >
        <span class="badge">{{ index + 1 }}</span><span>{{ stepLabels[key] }}</span>
      </button>
    </nav>

    <main>
      <el-dialog
        :title="activeStep === 'create' ? '建单与盘点范围' : '盘点与提交'"
        :visible.sync="checkDialogVisible"
        width="94%"
        top="3vh"
        append-to-body
        :close-on-click-modal="false"
        @closed="onCheckDialogClosed"
      >
      <!-- 1. 建单与范围 -->
      <section v-show="activeStep === 'create'" class="screen">
        <div class="section-heading">
          <div>
            <h2>建单与盘点范围</h2>
            <p class="text-muted">选择目标仓库和货品品类，系统按仓库、货架、库位和 SKU 自动生成盘点明细。</p>
          </div>
          <span class="badge" :class="statusBadgeClass(form.status)">{{ statusText(form.status) }}</span>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" size="small" label-position="top" :disabled="!scopeEditable">
          <div class="form-grid">
            <el-form-item label="盘点单号">
              <el-input v-model="form.checkNo" placeholder="保存后自动生成" readonly />
            </el-form-item>
            <el-form-item label="盘点日期">
              <el-date-picker v-model="form.checkDate" type="date" value-format="yyyy-MM-dd" style="width:100%" />
            </el-form-item>
            <!-- 一张单可同时盘多个仓，明细按仓库分组，审核归档时各回各仓 -->
            <el-form-item label="目标仓库（可多选）" prop="warehouseIdList">
              <el-select
                v-model="form.warehouseIdList"
                multiple
                collapse-tags
                filterable
                placeholder="请选择仓库，可多选"
                style="width:100%"
                @change="onWarehouseChange"
              >
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="货品品类">
              <el-select v-model="form.categoryId" clearable filterable placeholder="全部品类" style="width:100%">
                <el-option v-for="c in categoryList" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <!-- 盘点人同时是审批流的发起人，缺了流程派不出去 -->
            <el-form-item label="盘点人 / 审批申请人" prop="checkUserId">
              <el-input v-model="form.checkPeople" placeholder="点击选择盘点人" readonly>
                <el-button slot="append" icon="el-icon-user" @click="pickCheckUser">选择</el-button>
              </el-input>
            </el-form-item>
            <el-form-item label="盘点方式">
              <el-select v-model="form.checkMode" style="width:100%">
                <el-option label="明盘（显示账面数）" :value="0" />
                <el-option label="盲盘（隐藏账面数）" :value="1" />
              </el-select>
            </el-form-item>
            <el-form-item label="限定货架" class="form-span">
              <el-select
                v-model="lockedShelfIdList"
                multiple
                collapse-tags
                filterable
                clearable
                :disabled="!selectedWarehouseIds.length || !scopeEditable"
                :placeholder="selectedWarehouseIds.length ? '不选 = 所选仓库整仓盘点' : '请先选择仓库'"
                style="width:100%"
              >
                <el-option v-for="s in shelfList" :key="s.id" :label="shelfLabel(s)" :value="s.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注" class="form-span">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </div>
        </el-form>

        <div class="scope-band">
          <div><i class="el-icon-box" /><span>盘点范围</span></div>
          <span>{{ scopeText }}</span>
        </div>

        <div class="action-bar split-actions">
          <el-button v-if="details.length" size="small" @click="showStep('check')">
            查看盘点明细 <i class="el-icon-arrow-right" />
          </el-button>
          <span v-else />
          <el-button type="primary" size="small" :loading="saving" :disabled="!scopeEditable" @click="onGenerate">
            <i class="el-icon-plus" /> 生成盘点明细
          </el-button>
        </div>
      </section>

      <!-- 2. 盘点与提交：打印、录入反馈、提交审批都在这一页 -->
      <section v-show="activeStep === 'check'" class="screen">
        <div class="section-heading">
          <div>
            <h2>盘点与提交</h2>
            <p class="text-muted">
              打印盘点表线下盘 → 回来逐条录入实盘数量和货品状态 → 提交审批。
              损坏、缺失或其他异常必须填写反馈说明；
              盘亏且状态为「损坏」的还要挂上对应报损单，库存由报损单扣减，盘点不再重复扣。
            </p>
          </div>
          <div class="heading-actions">
            <el-switch v-model="blindPrint" active-text="盲盘打印" />
            <el-button size="small" icon="el-icon-printer" :disabled="!details.length" @click="onPrint">打印盘点表</el-button>
            <el-button v-if="submitted" size="small" icon="el-icon-refresh" :loading="saving" @click="onRefreshApproval">刷新审批状态</el-button>
            <span class="badge" :class="statusBadgeClass(form.status)">{{ statusText(form.status) }}</span>
          </div>
        </div>

        <!-- 已发起审批后，本页转为这张单的审批状态展示 -->
        <div v-if="submitted" class="notice-band approval-band">
          <i class="el-icon-s-check" />
          <div>
            <strong>{{ auditStateText }}</strong>
            <div class="text-small">
              审批实例：{{ form.approvalInstanceId || '未发起' }} ·
              提交时间：{{ fmtTime(form.submitTime) || '-' }}
              <template v-if="form.auditComment"> · 审批意见：{{ form.auditComment }}</template>
            </div>
          </div>
          <el-button v-if="form.approvalInstanceId" type="primary" size="small" icon="el-icon-position" @click="gotoApproval">
            前往审批中心
          </el-button>
        </div>
        <div v-else-if="form.status === ST.REJECTED" class="notice-band reject-band">
          <i class="el-icon-warning-outline" />
          <div>
            <strong>审批已驳回，可修改后重新提交</strong>
            <div class="text-small">驳回意见：{{ form.auditComment || '-' }}</div>
          </div>
        </div>

        <div class="doc-band">
          <span>{{ form.checkNo || '未保存' }}</span>
          <span>{{ warehousesText(form) }} · {{ categoryText(form.categoryId) }}</span>
          <span>盘点人：{{ form.checkPeople || '-' }}</span>
          <span>盘点日期：{{ form.checkDate || '-' }}</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card"><span class="text-muted">应盘 SKU</span><strong>{{ details.length }}</strong><small>{{ summary.locations }} 个库位</small></div>
          <div class="summary-card"><span class="text-muted">正常</span><strong>{{ summary.normal }}</strong><small>账实一致</small></div>
          <div class="summary-card"><span class="text-muted">异常</span><strong>{{ summary.abnormal }}</strong><small>损坏 {{ summary.damaged }} / 缺失 {{ summary.missing }}</small></div>
          <div class="summary-card"><span class="text-muted">差异金额</span><strong>¥{{ summary.amount.toFixed(2) }}</strong><small>按当前成本估算</small></div>
        </div>

        <table class="data-table feedback-table">
          <thead>
            <tr><th>库位 / SKU</th><th>商品名称</th><th>账面</th><th>实盘</th><th>差异</th><th>状态</th><th>关联报损单</th><th>反馈说明</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in details" :key="d.id">
              <td>
                <!-- 多仓盘点时同一个库位编码可能在几个仓里都有，不标仓库分不清这行盘的是哪一仓 -->
                <div v-if="multiWarehouse" class="text-small text-muted">{{ warehouseText(d.warehouseId) }}</div>
                {{ d.locationCode || '-' }} / {{ d.sku || '-' }}
              </td>
              <td>{{ d.goodsName }} {{ d.specName }}</td>
              <td>{{ d.bookStock == null ? '—' : d.bookStock }}</td>
              <td>
                <el-input-number v-model="d.actualStock" :min="0" :precision="0" step-strictly v-int-only :disabled="!feedbackEditable" size="mini" controls-position="right" style="width:100%" @change="onActualStockChange(d)" />
              </td>
              <td :class="diffClass(d)">{{ diffLabel(d) }}</td>
              <td>
                <!-- 有差异就不能报「正常」：差异会照着调库存，标正常等于让审核人无从判断 -->
                <el-select v-model="d.goodsStatus" size="mini" :disabled="!feedbackEditable" style="width:100%" @change="onGoodsStatusChange(d)">
                  <el-option
                    v-for="g in goodsStatusOptions"
                    :key="g.value"
                    :label="g.value === 'NORMAL' && diffOf(d) !== 0 ? '正常（有差异不可选）' : g.label"
                    :value="g.value"
                    :disabled="g.value === 'NORMAL' && diffOf(d) !== 0"
                  />
                </el-select>
              </td>
              <td>
                <!-- 报损差异的库存由报损单扣：不挂单，盘点调账 + 报损单拣货会把同一批货扣两遍 -->
                <el-select
                  v-if="needDamage(d) && feedbackEditable"
                  v-model="d.damageId"
                  size="mini"
                  clearable
                  filterable
                  :loading="damageLoading[d.id]"
                  placeholder="请选择报损单"
                  style="width:100%"
                  @visible-change="(v) => v && loadDamageOptions(d)"
                >
                  <el-option
                    v-for="o in damageOptions[d.id] || []"
                    :key="o.damageId"
                    :label="`${o.code}（可报损 ${o.damageNum}）`"
                    :value="o.damageId"
                  />
                </el-select>
                <span v-else-if="d.damageCode" class="text-small">{{ d.damageCode }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <el-input
                  v-model="d.feedbackRemark"
                  size="mini"
                  :disabled="!feedbackEditable"
                  :placeholder="d.goodsStatus === 'NORMAL' ? '无异常' : '请填写具体情况'"
                />
              </td>
            </tr>
            <tr v-if="!details.length"><td colspan="8" class="empty-row">请先在「建单与范围」生成盘点明细</td></tr>
          </tbody>
        </table>

        <div v-if="!submitted" class="notice-band">
          <i class="el-icon-bell" />
          <div>
            <strong>提交即发起「盘点审批」，反馈数据锁定</strong>
            <div class="text-small">
              提交会先保存当前页面的实盘数据，再以盘点人身份发起审批；
              审批通过前库存不会变更，被驳回后可继续修改重提。
            </div>
          </div>
        </div>
        <div v-if="feedbackError" class="validation-message">{{ feedbackError }}</div>

        <div class="action-bar split-actions">
          <el-button size="small" icon="el-icon-arrow-left" @click="showStep('create')">返回范围</el-button>
          <div v-if="!submitted" class="button-group">
            <el-button type="primary" size="small" icon="el-icon-s-promotion" :loading="saving" :disabled="!canSubmitAudit" @click="onSubmit">
              保存并提交审批
            </el-button>
          </div>
        </div>

        <!-- 打印用的 A4 排版，不在页面上显示，onPrint 直接取它的 innerHTML -->
        <article id="check-print-sheet" class="print-sheet is-hidden">
          <div class="sheet-title">货品盘点表</div>
          <div class="sheet-meta">
            <span>盘点单号：<b>{{ form.checkNo || '-' }}</b></span>
            <span>仓库：<b>{{ warehousesText(form) }}</b></span>
            <span>品类：<b>{{ categoryText(form.categoryId) }}</b></span>
            <span>盘点人：<b>{{ form.checkPeople || '-' }}</b></span>
            <span>日期：<b>{{ form.checkDate || '-' }}</b></span>
          </div>
          <table class="data-table print-table">
            <thead>
              <tr>
                <th>序号</th><th>库位</th><th>SKU</th><th>商品名称</th><th>规格</th>
                <th>单位</th><th>账面数量</th><th>实盘数量</th><th>状态</th><th>反馈说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(d, i) in details" :key="d.id">
                <td>{{ i + 1 }}</td>
                <td>{{ multiWarehouse ? warehouseText(d.warehouseId) + ' · ' : '' }}{{ d.locationCode || '-' }}</td>
                <td>{{ d.sku || '-' }}</td>
                <td>{{ d.goodsName || '-' }}</td>
                <td>{{ d.specName || '-' }}</td>
                <td>{{ d.unitName || '-' }}</td>
                <td>{{ blindPrint || d.bookStock == null ? '—' : d.bookStock }}</td>
                <td /><td /><td />
              </tr>
            </tbody>
          </table>
          <div class="signatures"><span>盘点人签字</span><span>复核人签字</span><span>领导签字</span></div>
        </article>
      </section>
      </el-dialog>
      <!-- 3. 历史记录：保留盘点单列表和归档详情，方便追溯历史盘点结果 -->
      <section v-show="activeStep === 'history'" class="screen">
        <div class="section-heading">
          <div>
            <h2>盘点历史记录</h2>
            <p class="text-muted">查询盘点单，查看盘点范围、明细、反馈、审批意见和库存调整结果。</p>
          </div>
        </div>

        <div class="history-filters">
          <label><span class="text-small text-muted">盘点单号</span>
            <el-input v-model="query.checkNo" size="small" placeholder="输入盘点单号" clearable @keyup.enter.native="onSearch" />
          </label>
          <label><span class="text-small text-muted">仓库</span>
            <el-select v-model="query.warehouseId" size="small" clearable filterable placeholder="全部仓库" style="width:100%">
              <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
            </el-select>
          </label>
          <label><span class="text-small text-muted">品类</span>
            <el-select v-model="query.categoryId" size="small" clearable filterable placeholder="全部品类" style="width:100%">
              <el-option v-for="c in categoryList" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </label>
          <label><span class="text-small text-muted">状态</span>
            <el-select v-model="query.status" size="small" clearable placeholder="全部状态" style="width:100%">
              <el-option v-for="status in statusOptions" :key="status.value" :label="status.label" :value="status.value" />
            </el-select>
          </label>
          <label class="filter-wide"><span class="text-small text-muted">盘点日期</span>
            <el-date-picker
              v-model="dateRange" size="small" type="daterange" value-format="yyyy-MM-dd"
              range-separator="至" start-placeholder="开始" end-placeholder="结束" style="width:100%"
            />
          </label>
          <el-button type="primary" size="small" icon="el-icon-search" @click="onSearch">查询</el-button>
        </div>

        <table v-loading="loading" class="data-table history-table">
          <thead>
            <tr><th>盘点单号</th><th>仓库 / 品类</th><th>盘点人</th><th>盘点日期</th><th>差异</th><th>差异金额</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.id">
              <td>{{ row.checkNo }}</td>
              <td>{{ warehousesText(row) }} · {{ row.categoryName || '全部品类' }}</td>
              <td>{{ row.checkPeople || '-' }}</td>
              <td>{{ row.checkDate || '-' }}</td>
              <td>{{ row.totalDiff || 0 }}</td>
              <td>¥{{ Number(row.diffAmount || 0).toFixed(2) }}</td>
              <td><span class="badge" :class="statusBadgeClass(row.status)">{{ statusText(row.status) }}</span></td>
              <td class="row-actions">
                <el-button type="text" @click="openHistory(row)">详情</el-button>
                <el-button type="text" @click="openHistory(row, true)">打印</el-button>
                <el-button v-if="canCancelHistory(row)" type="text" class="danger-text" @click="cancelHistory(row)">作废</el-button>
              </td>
            </tr>
            <tr v-if="!tableData.length"><td colspan="8" class="empty-row">没有查询到盘点记录</td></tr>
          </tbody>
        </table>

        <el-pagination
          class="history-pager"
          :current-page.sync="query.page"
          :page-size.sync="query.limit"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadPage"
        />

        <el-dialog
          title="盘点记录详情"
          :visible.sync="historyDialogVisible"
          width="90%"
          top="5vh"
          append-to-body
          :close-on-click-modal="false"
          @closed="historyDetail = null"
        >
          <div v-if="historyDetail" class="history-detail history-dialog-body">
          <div class="history-summary">
            <span>盘点单号：{{ historyDetail.checkNo || '-' }}</span>
            <span>状态：{{ statusText(historyDetail.status) }}</span>
            <span>仓库：{{ warehousesText(historyDetail) }}</span>
            <span>品类：{{ historyDetail.categoryName || categoryText(historyDetail.categoryId) }}</span>
            <span>盘点人：{{ historyDetail.checkPeople || '-' }}</span>
            <span>盘点日期：{{ historyDetail.checkDate || '-' }}</span>
            <span>正常：{{ historyDetail.normalCount || 0 }}</span>
            <span>异常：{{ historyDetail.abnormalCount || 0 }}</span>
            <span>差异：{{ historyDetail.totalDiff || 0 }}</span>
            <span>差异金额：¥{{ Number(historyDetail.diffAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="history-audit-info">
            <span>审核人：{{ historyDetail.auditUser || '-' }}</span>
            <span>审核意见：{{ historyDetail.auditComment || '-' }}</span>
            <span>归档时间：{{ fmtTime(historyDetail.archiveTime) || '-' }}</span>
          </div>
          <table class="data-table history-detail-table">
            <thead><tr><th>库位 / SKU</th><th>商品</th><th>账面</th><th>实盘</th><th>差异</th><th>状态</th><th>反馈说明</th></tr></thead>
            <tbody>
              <tr v-for="item in (historyDetail.details || [])" :key="item.id">
                <td>
                  <div v-if="warehouseIdsOf(historyDetail).length > 1" class="text-small text-muted">{{ warehouseText(item.warehouseId) }}</div>
                  {{ item.locationCode || '-' }} / {{ item.sku || '-' }}
                </td>
                <td>{{ item.goodsName || '-' }} {{ item.specName || '' }}</td>
                <td>{{ item.bookStock == null ? '—' : item.bookStock }}</td>
                <td>{{ item.actualStock == null ? '—' : item.actualStock }}</td>
                <td :class="diffClass(item)">{{ item.diffNum == null ? diffLabel(item) : item.diffNum }}</td>
                <td>{{ goodsStatusText(item.goodsStatus) }}</td>
                <td>{{ item.feedbackRemark || '-' }}</td>
              </tr>
              <tr v-if="!(historyDetail.details || []).length"><td colspan="7" class="empty-row">暂无盘点明细</td></tr>
            </tbody>
          </table>
          </div>
          <span slot="footer">
            <el-button size="small" @click="historyDialogVisible = false">关闭</el-button>
          </span>
        </el-dialog>
      </section>
    </main>

    <admin-picker-dialog ref="adminPicker" title="选择盘点人" />
  </div>
</template>

<script>
import { stockCheckApi, shelfApi } from '@/api/warehouse';
import * as categoryApi from '@/api/categoryApi';
import warehouseFormMixin from '@/views/warehouse/components/warehouseFormMixin';

// 与后端 WmsStockCheckServiceImpl 的状态常量一一对应
const ST = { DRAFT: 0, ARCHIVED: 1, CANCELED: 2, AUDITING: 3, WAIT_FB: 4, FEEDBACK: 5, REJECTED: 6 };

export default {
  name: 'WarehouseStockCheck',
  mixins: [warehouseFormMixin],
  data() {
    return {
      ST,
      activeStep: 'history',
      // 打印和提交都是盘点页上的动作，不单列步骤；审核归档走审批中心
      stepOrder: ['create', 'check', 'history'],
      stepLabels: { create: '建单与范围', check: '盘点与提交', history: '历史记录' },
      saving: false,
      loading: false,
      total: 0,
      tableData: [],
      dateRange: [],
      query: { page: 1, limit: 20, checkNo: '', warehouseId: null, categoryId: null, status: null, startDate: '', endDate: '' },
      historyDetail: null,
      historyDialogVisible: false,
      checkDialogVisible: false,
      categoryList: [],
      shelfList: [],
      lockedShelfIdList: [],
      form: this.emptyForm(),
      details: [],
      blindPrint: false,
      feedbackError: '',
      statusOptions: [
        { value: ST.DRAFT, label: '草稿' },
        { value: ST.WAIT_FB, label: '待反馈' },
        { value: ST.FEEDBACK, label: '已反馈' },
        { value: ST.AUDITING, label: '审批中' },
        { value: ST.REJECTED, label: '已驳回' },
        { value: ST.ARCHIVED, label: '已归档' },
        { value: ST.CANCELED, label: '已作废' },
      ],
      // 报损单候选按明细行缓存：{ [detailId]: [option] }
      damageOptions: {},
      damageLoading: {},
      goodsStatusOptions: [
        { value: 'NORMAL', label: '正常' },
        { value: 'DAMAGED', label: '损坏' },
        { value: 'MISSING', label: '缺失' },
        { value: 'OTHER', label: '其他' },
      ],
      rules: {
        warehouseIdList: [{ required: true, type: 'array', min: 1, message: '请选择仓库', trigger: 'change' }],
        checkUserId: [{ required: true, message: '请选择盘点人，审批流按用户派单', trigger: 'change' }],
      },
    };
  },
  computed: {
    /** 草稿阶段才允许改范围：明细生成后改仓库/品类会让已录入的实盘数对不上号 */
    scopeEditable() {
      return !this.form.id || this.form.status === ST.DRAFT;
    },
    feedbackEditable() {
      return [ST.WAIT_FB, ST.FEEDBACK, ST.REJECTED].includes(this.form.status);
    },
    canSubmitAudit() {
      return this.details.length > 0 && this.feedbackEditable;
    },
    auditStateText() {
      return ({ [ST.AUDITING]: '审批中', [ST.ARCHIVED]: '审批通过，已归档并联动库存' })[this.form.status] || '待提交';
    },
    /** 已发起审批（含审批完成）的单据，本页转为只读的审批状态展示 */
    submitted() {
      return [ST.AUDITING, ST.ARCHIVED].includes(this.form.status);
    },
    selectedWarehouseIds() {
      return this.form.warehouseIdList || [];
    },
    multiWarehouse() {
      return this.warehouseIdsOf(this.form).length > 1;
    },
    scopeText() {
      if (!this.details.length) return '保存并生成明细后显示应盘 SKU 与库位数量';
      const locations = new Set(this.details.map((d) => d.locationId).filter((x) => x != null));
      return `${this.warehousesText(this.form)} · ${this.categoryText(this.form.categoryId)} · ${this.details.length} 个 SKU · ${locations.size} 个库位`;
    },
    summary() {
      const result = { normal: 0, damaged: 0, missing: 0, abnormal: 0, totalDiff: 0, amount: 0, locations: 0 };
      const locations = new Set();
      this.details.forEach((d) => {
        const diff = this.diffOf(d);
        if (d.goodsStatus === 'DAMAGED') result.damaged += 1;
        if (d.goodsStatus === 'MISSING') result.missing += 1;
        if (d.goodsStatus === 'NORMAL' && diff === 0) result.normal += 1;
        else result.abnormal += 1;
        result.totalDiff += diff;
        result.amount += Math.abs(diff) * Number(d.unitCost || 0);
        if (d.locationId != null) locations.add(d.locationId);
      });
      result.locations = locations.size;
      return result;
    },
  },
  created() {
    this.loadCategories();
    this.loadPage();
  },
  methods: {
    emptyForm() {
      return {
        id: null, checkNo: '', warehouseId: null, warehouseIds: '', warehouseIdList: [], categoryId: null, categoryName: '',
        checkDate: this.today(), checkUserId: null, checkPeople: '', checkMode: 0,
        lockedShelfIds: '', remark: '', status: ST.DRAFT,
        submitTime: null, auditTime: null, archiveTime: null, auditUser: '', auditComment: '',
        approvalInstanceId: '',
      };
    },
    today() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },
    fmtTime(t) { return t ? String(t).replace('T', ' ').substring(0, 19) : ''; },
    statusText(s) {
      const hit = this.statusOptions.find((x) => x.value === s);
      return hit ? hit.label : '-';
    },
    goodsStatusText(s) {
      const hit = this.goodsStatusOptions.find((x) => x.value === s);
      return hit ? hit.label : (s || '-');
    },
    statusBadgeClass(s) {
      return ({ [ST.ARCHIVED]: 'badge-success', [ST.CANCELED]: 'badge-danger', [ST.REJECTED]: 'badge-danger', [ST.AUDITING]: 'badge-warning' })[s] || '';
    },
    categoryText(id) {
      if (!id) return '全部品类';
      const hit = this.categoryList.find((c) => c.id === id);
      return hit ? hit.name.trim() : String(id);
    },
    /** 单据上的仓库ID：多仓存 warehouseIds 逗号串，老单据只有 warehouseId */
    warehouseIdsOf(row) {
      if (!row) return [];
      if (row.warehouseIdList && row.warehouseIdList.length) return row.warehouseIdList;
      if (row.warehouseIds) return String(row.warehouseIds).split(',').filter((x) => x !== '').map(Number);
      return row.warehouseId != null ? [row.warehouseId] : [];
    },
    /** 多仓时列出全部仓库名，超过 3 个折成「等 N 个仓库」，免得把整行撑破 */
    warehousesText(row) {
      const ids = this.warehouseIdsOf(row);
      if (!ids.length) return '-';
      if (ids.length <= 3) return ids.map((id) => this.warehouseText(id)).join('、');
      return `${ids.slice(0, 3).map((id) => this.warehouseText(id)).join('、')} 等 ${ids.length} 个仓库`;
    },
    shelfLabel(shelf) {
      const name = shelf.name ? `${shelf.code} / ${shelf.name}` : shelf.code;
      // 多仓时不带仓库名的话，两个仓里同名货架根本分不出是哪一个
      return this.selectedWarehouseIds.length > 1 ? `${this.warehouseText(shelf.warehouseId)} · ${name}` : name;
    },
    diffOf(row) { return (row.actualStock || 0) - (row.bookStock || 0); },
    diffLabel(row) {
      const diff = this.diffOf(row);
      return diff > 0 ? `+${diff}` : String(diff);
    },
    diffClass(row) {
      const diff = this.diffOf(row);
      return diff < 0 ? 'diff-negative' : diff > 0 ? 'diff-positive' : '';
    },

    showStep(step) {
      this.activeStep = step;
      if (step === 'history') {
        this.checkDialogVisible = false;
        this.historyDetail = null;
        this.loadPage();
      } else {
        this.checkDialogVisible = true;
      }
    },
    onNewCheck() {
      this.form = this.emptyForm();
      this.details = [];
      this.lockedShelfIdList = [];
      this.shelfList = [];
      this.blindPrint = false;
      this.feedbackError = '';
      this.historyDetail = null;
      this.checkDialogVisible = true;
      if (this.$refs.formRef) this.$refs.formRef.clearValidate();
      this.showStep('create');
    },
    onCheckDialogClosed() {
      this.activeStep = 'history';
      this.loadPage();
    },

    async loadCategories() {
      try {
        const data = await categoryApi.treeCategroy({ type: 1, status: 1, name: '' });
        this.categoryList = this.flattenCategory(data || []);
      } catch (e) { this.categoryList = []; }
    },
    /** 分类是树，盘点范围按具体分类节点选，拍平成一维下拉，层级用缩进表示 */
    flattenCategory(tree, depth = 0) {
      const out = [];
      tree.forEach((node) => {
        out.push({ id: node.id, name: `${'　'.repeat(depth)}${node.name}` });
        const children = node.child || node.children;
        if (children && children.length) out.push(...this.flattenCategory(children, depth + 1));
      });
      return out;
    },
    /** 多仓时逐仓拉货架再合并；货架接口只支持单仓过滤 */
    async loadShelfOptions(warehouseIds) {
      this.shelfList = [];
      const ids = (warehouseIds || []).filter((x) => x != null);
      if (!ids.length) return;
      try {
        const pages = await Promise.all(
          ids.map((warehouseId) => shelfApi.page({ page: 1, limit: 999, warehouseId, status: 1 })),
        );
        this.shelfList = pages.reduce((all, res) => all.concat((res && res.list) || []), []);
      } catch (e) { this.shelfList = []; }
    },
    async onWarehouseChange(warehouseIds) {
      // 主仓保持为第一个选中的仓，后端和只认单仓的老逻辑靠它兜底
      this.form.warehouseId = (warehouseIds && warehouseIds[0]) || null;
      await this.loadShelfOptions(warehouseIds);
      // 取消勾选某个仓后，它下面已选的货架要一并清掉，否则会带着不在范围内的货架去生成明细
      const valid = new Set(this.shelfList.map((s) => s.id));
      this.lockedShelfIdList = this.lockedShelfIdList.filter((id) => valid.has(id));
    },

    async pickCheckUser() {
      const u = await this.$refs.adminPicker.open();
      if (!u) return;
      this.form.checkUserId = u.id;
      this.form.checkPeople = u.realName || u.account || '';
      if (this.$refs.formRef) this.$refs.formRef.clearValidate('checkUserId');
    },

    /** 保存草稿(首次) + 按范围从库存展开应盘明细，完成后直接进盘点页 */
    async onGenerate() {
      await this.$refs.formRef.validate();
      this.saving = true;
      try {
        if (!this.form.id) {
          const created = await stockCheckApi.add({
            ...this.form,
            categoryName: this.categoryText(this.form.categoryId),
            lockedShelfIds: this.lockedShelfIdList.join(','),
          });
          this.form = { ...this.form, ...(created || {}) };
        }
        const count = await stockCheckApi.generate({
          checkId: this.form.id,
          warehouseIdList: this.selectedWarehouseIds,
          warehouseId: this.selectedWarehouseIds[0] || null,
          categoryId: this.form.categoryId,
          shelfIdList: this.lockedShelfIdList,
        });
        this.$message.success(`已从库存中生成 ${count} 条盘点明细`);
        await this.refreshDetail();
        this.showStep('check');
      } finally { this.saving = false; }
    },
    async refreshDetail() {
      const res = await stockCheckApi.detail(this.form.id);
      this.form = { ...this.form, ...(res || {}) };
      // 后端只有 warehouseIds 串时（老单据）也要还原成多选用的数组
      this.form.warehouseIdList = this.warehouseIdsOf(this.form);
      this.details = ((res && res.details) || []).map((d) => ({
        ...d,
        goodsStatus: d.goodsStatus || 'NORMAL',
        damageId: d.damageId || null,
      }));
      // 明细重建后行ID可能变，旧缓存的报损单候选对不上号
      this.damageOptions = {};
      this.damageLoading = {};
    },

    onGoodsStatusChange(row) {
      if (row.goodsStatus === 'NORMAL' && !row.feedbackRemark) this.$set(row, 'feedbackRemark', '无异常');
      // 不再是报损盘亏就把挂单清掉，否则这行会一直跳过库存校准
      if (!this.needDamage(row)) this.$set(row, 'damageId', null);
      else this.loadDamageOptions(row);
    },

    /** 报损且实盘少于账面时才需要挂单：盘盈没有可扣的量 */
    needDamage(row) {
      return row.goodsStatus === 'DAMAGED' && this.diffOf(row) < 0;
    },

    async loadDamageOptions(row) {
      if (this.damageOptions[row.id] || this.damageLoading[row.id]) return;
      this.$set(this.damageLoading, row.id, true);
      try {
        const res = await stockCheckApi.damageOptions(row.id);
        this.$set(this.damageOptions, row.id, res || []);
      } finally { this.$set(this.damageLoading, row.id, false); }
    },

    /**
     * 改了实盘数就重新评估状态。
     *
     * 盘出差异时把状态从「正常」清空，逼盘点员选一个异常原因——
     * 不清空的话默认值一直是「正常」，一路点到底就能提交一张「有差异但全部正常」的单子。
     */
    onActualStockChange(row) {
      const diff = this.diffOf(row);
      if (diff !== 0 && row.goodsStatus === 'NORMAL') {
        this.$set(row, 'goodsStatus', '');
        if (String(row.feedbackRemark || '').trim() === '无异常') this.$set(row, 'feedbackRemark', '');
      }
      if (diff === 0 && !row.goodsStatus) {
        this.$set(row, 'goodsStatus', 'NORMAL');
        if (!String(row.feedbackRemark || '').trim()) this.$set(row, 'feedbackRemark', '无异常');
      }
      if (!this.needDamage(row)) this.$set(row, 'damageId', null);
    },

    onPrint() {
      const sheet = document.getElementById('check-print-sheet');
      if (!sheet) return;
      const win = window.open('', '_blank');
      if (!win) return this.$message.warning('打印窗口被浏览器拦截，请允许弹出窗口');
      win.document.write(`<html><head><title>${this.form.checkNo || '货品盘点表'}</title><style>
        body{font-family:PingFang SC,Microsoft YaHei,sans-serif;font-size:12px;padding:16px}
        .sheet-title{text-align:center;font-size:16px;font-weight:600;margin-bottom:12px}
        .sheet-meta{display:flex;flex-wrap:wrap;justify-content:center;margin-bottom:14px}
        .sheet-meta span{margin:0 10px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #333;padding:6px;text-align:center;height:26px}
        .signatures{display:flex;justify-content:space-between;margin-top:48px}
        .signatures span{border-top:1px solid #333;padding-top:6px;width:28%;text-align:center}
      </style></head><body>${sheet.innerHTML}</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
    },

    /**
     * 保存反馈。silent=true 时由提交流程调用，不弹提示、不刷新，
     * 让「保存 + 提交」在用户看来是一个动作。
     */
    async onSaveFeedback(silent = false) {
      // 前端先拦一道，省去异常行还要等后端来回；后端同样有校验，是最终防线
      const diffNormal = this.details.find((d) => this.diffOf(d) !== 0 && d.goodsStatus === 'NORMAL');
      if (diffNormal) {
        this.feedbackError = `${diffNormal.sku || diffNormal.goodsName} 实盘与账面差异 ${this.diffOf(diffNormal)}，`
          + '状态不能选「正常」，请选择损坏/缺失/其他并填写反馈说明。';
        return false;
      }
      const invalid = this.details.find((d) => d.goodsStatus !== 'NORMAL' && !String(d.feedbackRemark || '').trim());
      if (invalid) {
        this.feedbackError = `${invalid.sku || invalid.goodsName} 为异常状态，请填写具体反馈说明。`;
        return false;
      }
      // 报损盘亏必须挂报损单，否则盘点调账和报损单拣货会把同一批货各扣一次
      const noDamage = this.details.find((d) => this.needDamage(d) && !d.damageId);
      if (noDamage) {
        this.feedbackError = `${noDamage.sku || noDamage.goodsName} 为报损异常，请选择对应的报损单，`
          + '库存由报损单扣减，避免盘点重复扣一次。';
        return false;
      }
      this.feedbackError = '';
      if (!silent) this.saving = true;
      try {
        await stockCheckApi.feedback({
          checkId: this.form.id,
          submit: false,
          items: this.details.map((d) => ({
            id: d.id,
            actualStock: d.actualStock || 0,
            goodsStatus: d.goodsStatus,
            feedbackRemark: d.feedbackRemark || '',
            damageId: this.needDamage(d) ? d.damageId : null,
          })),
        });
        if (!silent) {
          this.$message.success('反馈已保存，盘点汇总已生成');
          await this.refreshDetail();
        }
        return true;
      } finally { if (!silent) this.saving = false; }
    },

    /**
     * 提交审批。后端 submitAudit 只认库里的明细，页面上没保存的实盘数它读不到，
     * 所以这里必须先落一次库再发起，否则会出现「页面显示新值、审批用旧值」。
     */
    async onSubmit() {
      if (!this.form.checkUserId) {
        this.$message.warning('请先在「建单与范围」选择盘点人，审批流需要按用户派单');
        return;
      }
      await this.$confirm('提交后将保存当前反馈并发起「盘点审批」，审批通过前库存不会变更。继续?', '确认', { type: 'warning' });
      this.saving = true;
      try {
        if (!await this.onSaveFeedback(true)) return;
        await stockCheckApi.submitAudit(this.form.id, this.form.checkPeople);
        this.$message.success('已发起审批，审批人可在审批中心处理');
        await this.refreshDetail();
      } finally { this.saving = false; }
    },

    /** 审批结果由 flowable 回调写回单据，页面只能主动拉最新状态 */
    async onRefreshApproval() {
      if (!this.form.id) return;
      this.saving = true;
      try {
        await this.refreshDetail();
        this.$message.success(`当前状态：${this.statusText(this.form.status)}`);
      } finally { this.saving = false; }
    },
    async loadPage() {
      this.loading = true;
      try {
        this.query.startDate = (this.dateRange && this.dateRange[0]) || '';
        this.query.endDate = (this.dateRange && this.dateRange[1]) || '';
        const res = await stockCheckApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } catch (e) {
        this.tableData = [];
        this.total = 0;
        this.$message.error((e && (e.message || e.msg)) || '盘点记录加载失败');
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() {
      this.dateRange = [];
      this.query = { page: 1, limit: 20, checkNo: '', warehouseId: null, categoryId: null, status: null, startDate: '', endDate: '' };
      this.loadPage();
    },
    canCancelHistory(row) {
      return [ST.DRAFT, ST.WAIT_FB, ST.FEEDBACK, ST.AUDITING, ST.REJECTED].includes(row.status);
    },
    async openHistory(row, print) {
      try {
        const res = await stockCheckApi.detail(row.id);
        this.historyDetail = { ...(res || {}), details: ((res && res.details) || []).map((item) => ({ ...item })) };
        if (print) this.printHistory(this.historyDetail);
        else this.historyDialogVisible = true;
      } catch (e) {
        this.$message.error((e && (e.message || e.msg)) || '盘点记录详情加载失败');
      }
    },
    printHistory(check) {
      const esc = (value) => String(value == null ? '' : value).replace(/[&<>\"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[ch]));
      const multiWh = this.warehouseIdsOf(check).length > 1;
      const rows = (check.details || []).map((item, index) => `<tr><td>${index + 1}</td><td>${esc(multiWh ? `${this.warehouseText(item.warehouseId)} · ${item.locationCode || '-'}` : (item.locationCode || '-'))}</td><td>${esc(item.sku || '-')}</td><td>${esc(item.goodsName || '-')}</td><td>${esc(item.bookStock == null ? '-' : item.bookStock)}</td><td>${esc(item.actualStock == null ? '-' : item.actualStock)}</td><td>${esc(item.diffNum == null ? this.diffLabel(item) : item.diffNum)}</td><td>${esc(this.goodsStatusText(item.goodsStatus))}</td><td>${esc(item.feedbackRemark || '-')}</td></tr>`).join('');
      const win = window.open('', '_blank');
      if (!win) return this.$message.warning('打印窗口被浏览器拦截，请允许弹出窗口');
      win.document.write(`<html><head><title>${esc(check.checkNo || '盘点记录')}</title><style>body{font-family:Microsoft YaHei,sans-serif;font-size:12px;padding:16px}h2{text-align:center}p{text-align:center;color:#666}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:6px;text-align:center}</style></head><body><h2>库存盘点记录</h2><p>盘点单号：${esc(check.checkNo || '-')}　仓库：${esc(this.warehousesText(check))}　状态：${esc(this.statusText(check.status))}</p><table><thead><tr><th>序号</th><th>库位</th><th>SKU</th><th>商品</th><th>账面</th><th>实盘</th><th>差异</th><th>状态</th><th>说明</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
    },
    async cancelHistory(row) {
      try {
        await this.$confirm(`作废盘点单「${row.checkNo}」?`, '提示', { type: 'warning' });
        await stockCheckApi.cancel(row.id);
        this.historyDialogVisible = false;
        this.historyDetail = null;
        this.$message.success('已作废');
        this.loadPage();
      } catch (e) {
        if (e !== 'cancel' && e !== 'close') this.$message.error((e && (e.message || e.msg)) || '盘点单作废失败');
      }
    },    gotoApproval() {
      this.$router.push(`/approvalCenter/detail/${this.form.approvalInstanceId}`);
    },
  },
};
</script>

<style scoped>
.inventory-check { color: #303133; }
.text-muted { color: #909399; }
.text-small { font-size: 12px; }

.app-header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px 18px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px;
}
.app-heading { display: flex; align-items: center; gap: 10px; }
.app-heading strong { font-size: 15px; }
.app-heading-icon {
  display: grid; place-items: center; width: 36px; height: 36px;
  color: #fff; background: #409eff; border-radius: 6px; font-size: 18px;
}
.header-actions { display: flex; gap: 8px; }

.workflow {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px;
  margin-top: 12px; padding: 8px; background: #f4f6f8; border: 1px solid #ebeef5; border-radius: 8px;
}
.workflow-step {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 34px; padding: 0 8px; border: 1px solid transparent; border-radius: 6px;
  background: transparent; color: #606266; cursor: pointer; font-size: 13px;
}
.workflow-step:hover { background: #eaeef3; }
.workflow-step.is-selected { background: #409eff; border-color: #409eff; color: #fff; }
.workflow-step.is-selected .badge { background: rgba(255, 255, 255, .25); color: #fff; }

.badge {
  display: inline-block; padding: 2px 8px; border-radius: 999px;
  background: #ecf5ff; color: #409eff; font-size: 12px; line-height: 18px;
}
.badge-success { background: #f0f9eb; color: #67c23a; }
.badge-warning { background: #fdf6ec; color: #e6a23c; }
.badge-danger { background: #fef0f0; color: #f56c6c; }

main { padding-top: 14px; }
.screen { padding: 22px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
.section-heading h2 { margin: 0; font-size: 16px; }
.section-heading p { margin: 5px 0 0; font-size: 13px; }
.heading-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
.form-span { grid-column: 1 / -1; }
.form-grid >>> .el-form-item { margin-bottom: 16px; }
.form-grid >>> .el-form-item__label { padding-bottom: 2px; line-height: 22px; color: #606266; }

.scope-band, .notice-band {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-top: 18px; padding: 13px 14px; background: #ecf5ff; color: #4e5969;
  border: 1px solid #d3e3ff; border-left: 3px solid #409eff; border-radius: 6px;
}
.scope-band > div { display: flex; align-items: center; gap: 8px; font-weight: 500; }
.notice-band { justify-content: flex-start; gap: 10px; }
.notice-band i { font-size: 16px; color: #409eff; }
.approval-band { justify-content: space-between; margin-top: 0; margin-bottom: 16px; }
.approval-band > div { flex: 1; }
.reject-band {
  margin-top: 0; margin-bottom: 16px;
  background: #fef0f0; border-color: #fbc4c4; border-left-color: #f56c6c;
}
.reject-band i { color: #f56c6c; }

/* 单据信息压缩成一行，省掉一整块摘要区 */
.doc-band {
  display: flex; flex-wrap: wrap; gap: 6px 24px; margin-bottom: 16px; padding: 10px 14px;
  background: #fafbfc; border: 1px solid #ebeef5; border-radius: 6px; font-size: 13px; color: #606266;
}
.doc-band span:first-child { font-weight: 600; color: #303133; }

.action-bar { margin-top: 18px; }
.split-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.button-group { display: flex; gap: 10px; }
.validation-message { margin-top: 10px; color: #f56c6c; font-size: 13px; }

.data-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 9px 8px; border-bottom: 1px solid #ebeef5; text-align: center; vertical-align: middle; word-break: break-all; }
.data-table th { background: #f5f7fa; color: #606266; font-weight: 500; }
.data-table tbody tr:hover { background: #f5faff; }
.empty-row { padding: 26px 0; color: #c0c4cc; }
.diff-negative { color: #f56c6c; font-weight: 600; }
.diff-positive { color: #67c23a; font-weight: 600; }

.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
.summary-card {
  display: flex; flex-direction: column; gap: 2px; padding: 12px;
  background: #fafbfc; border: 1px solid #ebeef5; border-radius: 8px; text-align: center;
}
.summary-card strong { font-size: 20px; }
.summary-card small { color: #c0c4cc; font-size: 12px; }

.feedback-table th:nth-child(1) { width: 14%; }
.feedback-table th:nth-child(2) { width: 18%; }
.feedback-table th:nth-child(3), .feedback-table th:nth-child(4), .feedback-table th:nth-child(5) { width: 9%; }
.feedback-table th:nth-child(6) { width: 13%; }
.feedback-table th:nth-child(7) { width: 28%; }

/* 只作为打印内容的载体，不占页面空间 */
.is-hidden { position: absolute; left: -9999px; top: 0; width: 1000px; }
.sheet-title { text-align: center; font-weight: 600; font-size: 15px; margin-bottom: 12px; }
.sheet-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 20px; margin-bottom: 16px; color: #909399; font-size: 12px; }
.print-table th, .print-table td { border: 1px solid #dcdfe6; }
.signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 38px; text-align: center; color: #909399; }
.signatures span { padding-top: 8px; border-top: 1px solid #303133; }

.history-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; align-items: end; gap: 10px; margin-bottom: 16px; }
.history-filters label { display: block; }
.history-filters label span { display: block; margin-bottom: 4px; }
.filter-wide { grid-column: span 2; }
.history-table th:nth-child(1) { width: 15%; }
.history-table th:nth-child(2) { width: 19%; }
.history-table th:nth-child(8) { width: 18%; }
.row-actions >>> .el-button--text { padding: 0 4px; }
.history-pager { margin-top: 16px; text-align: right; }
.history-detail { margin-top: 20px; padding: 16px; background: #fafbfc; border: 1px solid #ebeef5; border-radius: 6px; }
.history-dialog-body { max-height: 68vh; margin-top: 0; overflow-y: auto; }
.compact-heading { margin-bottom: 12px; }
.history-summary, .history-audit-info { display: flex; flex-wrap: wrap; gap: 8px 24px; padding: 10px 12px; margin-bottom: 10px; background: #fff; border: 1px solid #ebeef5; border-radius: 6px; color: #606266; font-size: 13px; }
.history-audit-info { color: #909399; }
.history-detail-table th:nth-child(1) { width: 16%; }
.history-detail-table th:nth-child(2) { width: 20%; }
.history-detail-table th:nth-child(7) { width: 20%; }
@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .form-grid { grid-template-columns: 1fr; }
  .history-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-wide { grid-column: span 2; }
}
</style>
