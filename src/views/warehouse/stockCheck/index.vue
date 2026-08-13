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

    <!-- 流程导航：六步 -->
    <nav class="workflow">
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
      <!-- 1. 新增盘点表 -->
      <section v-show="activeStep === 'create'" class="screen">
        <div class="section-heading">
          <div>
            <h2>新增盘点单</h2>
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
            <el-form-item label="目标仓库" prop="warehouseId">
              <el-select v-model="form.warehouseId" filterable placeholder="请选择仓库" style="width:100%" @change="onWarehouseChange">
                <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="货品品类">
              <el-select v-model="form.categoryId" clearable filterable placeholder="全部品类" style="width:100%">
                <el-option v-for="c in categoryList" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="盘点人">
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
                :disabled="!form.warehouseId || !scopeEditable"
                :placeholder="form.warehouseId ? '不选 = 整仓盘点' : '请先选择仓库'"
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

        <div class="action-bar">
          <el-button type="primary" class="btn-block" :loading="saving" :disabled="!scopeEditable" @click="onGenerate">
            <i class="el-icon-plus" /> 生成盘点明细
          </el-button>
        </div>
      </section>

      <!-- 2. 打印盘点表 -->
      <section v-show="activeStep === 'print'" class="screen">
        <div class="section-heading">
          <div>
            <h2>打印盘点表</h2>
            <p class="text-muted">盘点表不显示库存金额，线下填写实盘数量、货品状态和反馈说明。</p>
          </div>
          <div class="heading-actions">
            <el-switch v-model="blindPrint" active-text="盲盘打印" />
            <el-button type="primary" size="small" icon="el-icon-printer" @click="onPrint">打印</el-button>
          </div>
        </div>

        <article id="check-print-sheet" class="print-sheet">
          <div class="sheet-title">货品盘点表</div>
          <div class="sheet-meta">
            <span>盘点单号：<b>{{ form.checkNo || '-' }}</b></span>
            <span>仓库：<b>{{ warehouseText(form.warehouseId) }}</b></span>
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
                <td>{{ d.locationCode || '-' }}</td>
                <td>{{ d.sku || '-' }}</td>
                <td>{{ d.goodsName || '-' }}</td>
                <td>{{ d.specName || '-' }}</td>
                <td>{{ d.unitName || '-' }}</td>
                <td>{{ blindPrint || d.bookStock == null ? '—' : d.bookStock }}</td>
                <td /><td /><td />
              </tr>
              <tr v-if="!details.length"><td colspan="10" class="empty-row">请先在「新增盘点表」生成盘点明细</td></tr>
            </tbody>
          </table>
          <div class="signatures"><span>盘点人签字</span><span>复核人签字</span><span>领导签字</span></div>
        </article>

        <div class="action-bar split-actions">
          <el-button size="small" icon="el-icon-arrow-left" @click="showStep('create')">返回修改</el-button>
          <el-button type="primary" size="small" @click="showStep('feedback')">已完成线下盘点，录入反馈 <i class="el-icon-arrow-right" /></el-button>
        </div>
      </section>

      <!-- 3. 盘点反馈 -->
      <section v-show="activeStep === 'feedback'" class="screen">
        <div class="section-heading">
          <div>
            <h2>盘点反馈</h2>
            <p class="text-muted">逐条录入实盘数量和货品状态。损坏、缺失或其他异常必须填写反馈说明。</p>
          </div>
          <span class="badge">{{ details.length }} / {{ details.length }} 已录入</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card"><span class="text-muted">应盘 SKU</span><strong>{{ details.length }}</strong><small>本次盘点范围</small></div>
          <div class="summary-card"><span class="text-muted">正常</span><strong>{{ summary.normal }}</strong><small>账实一致</small></div>
          <div class="summary-card"><span class="text-muted">损坏</span><strong>{{ summary.damaged }}</strong><small>需核实处理</small></div>
          <div class="summary-card"><span class="text-muted">缺失</span><strong>{{ summary.missing }}</strong><small>需查明原因</small></div>
        </div>

        <table class="data-table feedback-table">
          <thead>
            <tr><th>库位 / SKU</th><th>商品名称</th><th>账面</th><th>实盘</th><th>差异</th><th>状态</th><th>反馈说明</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in details" :key="d.id">
              <td>{{ d.locationCode || '-' }} / {{ d.sku || '-' }}</td>
              <td>{{ d.goodsName }} {{ d.specName }}</td>
              <td>{{ d.bookStock == null ? '—' : d.bookStock }}</td>
              <td>
                <el-input-number v-model="d.actualStock" :min="0" :disabled="!feedbackEditable" size="mini" controls-position="right" style="width:100%" />
              </td>
              <td :class="diffClass(d)">{{ diffLabel(d) }}</td>
              <td>
                <el-select v-model="d.goodsStatus" size="mini" :disabled="!feedbackEditable" style="width:100%" @change="onGoodsStatusChange(d)">
                  <el-option v-for="g in goodsStatusOptions" :key="g.value" :label="g.label" :value="g.value" />
                </el-select>
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
            <tr v-if="!details.length"><td colspan="7" class="empty-row">暂无盘点明细</td></tr>
          </tbody>
        </table>

        <div class="notice-band">
          <i class="el-icon-info" />
          <div>
            <strong>反馈操作说明</strong>
            <div class="text-small">修改实盘数量后自动计算差异。异常状态需说明具体情况，退回修改时保留已录入数据。</div>
          </div>
        </div>
        <div v-if="feedbackError" class="validation-message">{{ feedbackError }}</div>

        <div class="action-bar split-actions">
          <el-button size="small" icon="el-icon-arrow-left" @click="showStep('print')">返回打印页</el-button>
          <el-button type="primary" size="small" icon="el-icon-document-checked" :loading="saving" :disabled="!feedbackEditable" @click="onSaveFeedback">
            保存反馈并生成汇总
          </el-button>
        </div>
      </section>

      <!-- 4. 提交领导审核 -->
      <section v-show="activeStep === 'submit'" class="screen">
        <div class="section-heading">
          <div>
            <h2>提交领导审核</h2>
            <p class="text-muted">确认反馈无误后提交，领导将收到待办通知并查看盘点差异摘要。</p>
          </div>
          <span class="badge" :class="statusBadgeClass(form.status)">{{ statusText(form.status) }}</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card"><span class="text-muted">盘点 SKU 总数</span><strong>{{ details.length }}</strong><small>{{ summary.locations }} 个库位</small></div>
          <div class="summary-card"><span class="text-muted">正常</span><strong>{{ summary.normal }}</strong><small>无需调整</small></div>
          <div class="summary-card"><span class="text-muted">异常</span><strong>{{ summary.abnormal }}</strong><small>损坏与缺失</small></div>
          <div class="summary-card"><span class="text-muted">差异金额</span><strong>¥{{ summary.amount.toFixed(2) }}</strong><small>按当前成本估算</small></div>
        </div>

        <div class="review-layout">
          <section class="review-block">
            <h3>异常项汇总</h3>
            <div v-if="!exceptionRows.length" class="text-muted text-small">本次盘点账实一致，无异常项。</div>
            <div v-for="d in exceptionRows" :key="d.id" class="exception-row">
              <span>{{ d.sku || '-' }} · {{ d.goodsName }} {{ d.specName }}</span>
              <span>账面 {{ d.bookStock }} → 实盘 {{ d.actualStock }}（{{ goodsStatusText(d.goodsStatus) }} {{ diffLabel(d) }}）</span>
            </div>
          </section>
          <section class="review-block">
            <h3>盘点摘要</h3>
            <dl class="detail-list">
              <div><dt>盘点单号</dt><dd>{{ form.checkNo || '-' }}</dd></div>
              <div><dt>仓库 / 品类</dt><dd>{{ warehouseText(form.warehouseId) }} / {{ categoryText(form.categoryId) }}</dd></div>
              <div><dt>盘点人</dt><dd>{{ form.checkPeople || '-' }}</dd></div>
              <div><dt>盘点日期</dt><dd>{{ form.checkDate || '-' }}</dd></div>
              <div><dt>库存差异</dt><dd>{{ summary.totalDiff > 0 ? '+' + summary.totalDiff : summary.totalDiff }}</dd></div>
            </dl>
          </section>
        </div>

        <div class="notice-band">
          <i class="el-icon-bell" />
          <div>
            <strong>提交后将锁定反馈数据</strong>
            <div class="text-small">审批通过前库存不会变更；退回后可重新修改实盘数量、状态和说明。</div>
          </div>
        </div>

        <div class="action-bar split-actions">
          <el-button size="small" icon="el-icon-arrow-left" @click="showStep('feedback')">返回反馈</el-button>
          <el-button type="primary" size="small" icon="el-icon-s-promotion" :loading="saving" :disabled="!canSubmitAudit" @click="onSubmitAudit">
            提交领导审核
          </el-button>
        </div>
      </section>

      <!-- 5. 审核与归档 -->
      <section v-show="activeStep === 'audit'" class="screen">
        <div class="section-heading">
          <div>
            <h2>领导审核与归档</h2>
            <p class="text-muted">审批通过后自动归档盘点记录，并按差异生成库存调整流水。</p>
          </div>
          <span class="badge" :class="statusBadgeClass(form.status)">{{ statusText(form.status) }}</span>
        </div>

        <div class="audit-layout">
          <ol class="timeline">
            <li class="timeline-item" :class="{ done: !!form.submitTime }">
              <span class="timeline-mark"><i class="el-icon-check" /></span>
              <div>
                <strong>盘点员提交盘点反馈</strong>
                <span class="badge">{{ form.submitTime ? '已完成' : '待执行' }}</span>
                <p class="text-muted">{{ form.checkPeople || '-' }} · {{ fmtTime(form.submitTime) || '未提交' }} · 提交 {{ details.length }} 条明细，含 {{ summary.abnormal }} 条异常</p>
              </div>
            </li>
            <li class="timeline-item" :class="{ done: form.status === ST.ARCHIVED, current: form.status === ST.AUDITING }">
              <span class="timeline-mark"><i class="el-icon-user" /></span>
              <div>
                <strong>领导审核</strong>
                <span class="badge">{{ auditStateText }}</span>
                <p class="text-muted">
                  审核人：{{ form.auditUser || '待指派' }} · 差异金额 ¥{{ summary.amount.toFixed(2) }}
                </p>
                <p v-if="form.auditComment" class="text-muted">审核意见：{{ form.auditComment }}</p>
                <template v-if="form.status === ST.AUDITING">
                  <label class="audit-comment">
                    <span class="text-small text-muted">审核意见</span>
                    <el-input v-model="auditComment" type="textarea" :rows="2" size="small"
                              placeholder="审批通过可填写处理意见；退回时必须说明原因" />
                  </label>
                  <div class="audit-actions">
                    <el-button size="small" icon="el-icon-refresh-left" :loading="saving" @click="onAudit(false)">退回修改</el-button>
                    <el-button type="primary" size="small" icon="el-icon-circle-check" :loading="saving" @click="onAudit(true)">审核通过</el-button>
                  </div>
                </template>
              </div>
            </li>
            <li class="timeline-item" :class="{ done: form.status === ST.ARCHIVED }">
              <span class="timeline-mark"><i class="el-icon-folder-checked" /></span>
              <div>
                <strong>盘点历史归档</strong>
                <span class="badge">{{ form.status === ST.ARCHIVED ? '已完成' : '待执行' }}</span>
                <p class="text-muted">归档范围、明细、反馈和审核意见，支持按时间、仓库、品类查询。</p>
              </div>
            </li>
            <li class="timeline-item" :class="{ done: form.status === ST.ARCHIVED }">
              <span class="timeline-mark"><i class="el-icon-refresh" /></span>
              <div>
                <strong>库存联动更新</strong>
                <span class="badge">{{ form.status === ST.ARCHIVED ? '已完成' : '待执行' }}</span>
                <p class="text-muted">按实盘结果更新账面库存，并生成库存调整流水。</p>
              </div>
            </li>
          </ol>

          <aside class="audit-summary">
            <h3>本次审核摘要</h3>
            <dl class="detail-list">
              <div><dt>盘点单</dt><dd>{{ form.checkNo || '-' }}</dd></div>
              <div><dt>正常 / 异常</dt><dd>{{ summary.normal }} / {{ summary.abnormal }}</dd></div>
              <div><dt>库存差异</dt><dd>{{ summary.totalDiff > 0 ? '+' + summary.totalDiff : summary.totalDiff }}</dd></div>
              <div><dt>差异金额</dt><dd>¥{{ summary.amount.toFixed(2) }}</dd></div>
            </dl>
            <el-button class="btn-block" size="small" icon="el-icon-document" @click="showStep('submit')">查看提交详情</el-button>
          </aside>
        </div>
        <div v-if="auditError" class="validation-message">{{ auditError }}</div>
      </section>

      <!-- 6. 历史查询 -->
      <section v-show="activeStep === 'history'" class="screen">
        <div class="section-heading">
          <div>
            <h2>盘点历史查询</h2>
            <p class="text-muted">查询盘点单，查看盘点范围、明细、反馈、审核意见和库存调整结果。</p>
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
              <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
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
              <td>{{ warehouseText(row.warehouseId) }} · {{ row.categoryName || '全部品类' }}</td>
              <td>{{ row.checkPeople || '-' }}</td>
              <td>{{ row.checkDate || '-' }}</td>
              <td>{{ row.totalDiff || 0 }}</td>
              <td>¥{{ Number(row.diffAmount || 0).toFixed(2) }}</td>
              <td><span class="badge" :class="statusBadgeClass(row.status)">{{ statusText(row.status) }}</span></td>
              <td class="row-actions">
                <el-button type="text" @click="openCheck(row)">{{ primaryActionText(row) }}</el-button>
                <el-button type="text" @click="openCheck(row, 'print')">打印</el-button>
                <el-button v-if="canCancel(row)" type="text" class="danger-text" @click="onCancel(row)">作废</el-button>
              </td>
            </tr>
            <tr v-if="!tableData.length"><td colspan="8" class="empty-row">没有查询到盘点单</td></tr>
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

        <section v-if="historyDetail" class="history-detail">
          <div class="section-heading compact-heading">
            <div>
              <h3>归档详情</h3>
              <p class="text-muted">{{ historyDetail.checkNo }} · {{ statusText(historyDetail.status) }}</p>
            </div>
            <el-button type="text" icon="el-icon-close" @click="historyDetail = null">关闭</el-button>
          </div>
          <div class="review-layout">
            <dl class="detail-list">
              <div><dt>审核结果</dt><dd>{{ statusText(historyDetail.status) }}</dd></div>
              <div><dt>审核人</dt><dd>{{ historyDetail.auditUser || '-' }}</dd></div>
              <div><dt>审核意见</dt><dd>{{ historyDetail.auditComment || '-' }}</dd></div>
              <div><dt>差异金额</dt><dd>¥{{ Number(historyDetail.diffAmount || 0).toFixed(2) }}</dd></div>
              <div><dt>归档时间</dt><dd>{{ fmtTime(historyDetail.archiveTime) || '-' }}</dd></div>
            </dl>
            <div class="inventory-result">
              <div v-for="(text, i) in archiveResultTexts" :key="i">
                <i :class="historyDetail.status === ST.ARCHIVED ? 'el-icon-circle-check done-icon' : 'el-icon-time'" />
                <span>{{ text }}</span>
              </div>
            </div>
          </div>
        </section>
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
      activeStep: 'create',
      stepOrder: ['create', 'print', 'feedback', 'submit', 'audit', 'history'],
      stepLabels: {
        create: '新增盘点表', print: '打印盘点表', feedback: '盘点反馈',
        submit: '提交领导审核', audit: '审核与归档', history: '历史查询',
      },
      loading: false,
      saving: false,
      total: 0,
      tableData: [],
      dateRange: [],
      query: { page: 1, limit: 20, checkNo: '', warehouseId: null, categoryId: null, status: null, startDate: '', endDate: '' },
      categoryList: [],
      shelfList: [],
      lockedShelfIdList: [],
      form: this.emptyForm(),
      details: [],
      historyDetail: null,
      blindPrint: false,
      feedbackError: '',
      auditError: '',
      auditComment: '',
      archiveResultTexts: ['盘点记录与反馈已归档', '库存调整流水已生成', '商品库账面数量已更新'],
      statusOptions: [
        { value: ST.DRAFT, label: '草稿' },
        { value: ST.WAIT_FB, label: '待反馈' },
        { value: ST.FEEDBACK, label: '已反馈' },
        { value: ST.AUDITING, label: '待审核' },
        { value: ST.REJECTED, label: '已退回' },
        { value: ST.ARCHIVED, label: '已归档' },
        { value: ST.CANCELED, label: '已作废' },
      ],
      goodsStatusOptions: [
        { value: 'NORMAL', label: '正常' },
        { value: 'DAMAGED', label: '损坏' },
        { value: 'MISSING', label: '缺失' },
        { value: 'OTHER', label: '其他' },
      ],
      rules: { warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }] },
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
      return this.details.length > 0 && [ST.WAIT_FB, ST.FEEDBACK, ST.REJECTED].includes(this.form.status);
    },
    auditStateText() {
      return ({ [ST.AUDITING]: '审核中', [ST.ARCHIVED]: '已通过', [ST.REJECTED]: '已退回' })[this.form.status] || '待提交';
    },
    scopeText() {
      if (!this.details.length) return '保存并生成明细后显示应盘 SKU 与库位数量';
      const locations = new Set(this.details.map((d) => d.locationId).filter((x) => x != null));
      return `${this.warehouseText(this.form.warehouseId)} · ${this.categoryText(this.form.categoryId)} · ${this.details.length} 个 SKU · ${locations.size} 个库位`;
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
    exceptionRows() {
      return this.details.filter((d) => d.goodsStatus !== 'NORMAL' || this.diffOf(d) !== 0);
    },
  },
  created() {
    this.loadCategories();
    this.loadPage();
  },
  methods: {
    emptyForm() {
      return {
        id: null, checkNo: '', warehouseId: null, categoryId: null, categoryName: '',
        checkDate: this.today(), checkUserId: null, checkPeople: '', checkMode: 0,
        lockedShelfIds: '', remark: '', status: ST.DRAFT,
        submitTime: null, auditTime: null, archiveTime: null, auditUser: '', auditComment: '',
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
    statusBadgeClass(s) {
      return ({ [ST.ARCHIVED]: 'badge-success', [ST.CANCELED]: 'badge-danger', [ST.REJECTED]: 'badge-danger', [ST.AUDITING]: 'badge-warning' })[s] || '';
    },
    goodsStatusText(s) {
      const hit = this.goodsStatusOptions.find((x) => x.value === s);
      return hit ? hit.label : s;
    },
    categoryText(id) {
      if (!id) return '全部品类';
      const hit = this.categoryList.find((c) => c.id === id);
      return hit ? hit.name.trim() : String(id);
    },
    shelfLabel(shelf) { return shelf.name ? `${shelf.code} / ${shelf.name}` : shelf.code; },
    diffOf(row) { return (row.actualStock || 0) - (row.bookStock || 0); },
    diffLabel(row) {
      const diff = this.diffOf(row);
      return diff > 0 ? `+${diff}` : String(diff);
    },
    diffClass(row) {
      const diff = this.diffOf(row);
      return diff < 0 ? 'diff-negative' : diff > 0 ? 'diff-positive' : '';
    },
    canCancel(row) { return [ST.DRAFT, ST.WAIT_FB, ST.FEEDBACK, ST.AUDITING, ST.REJECTED].includes(row.status); },
    primaryActionText(row) {
      return ({
        [ST.DRAFT]: '生成明细', [ST.WAIT_FB]: '录入反馈', [ST.FEEDBACK]: '提交审核',
        [ST.AUDITING]: '审核', [ST.REJECTED]: '修改反馈',
      })[row.status] || '查看详情';
    },

    showStep(step) {
      this.activeStep = step;
      if (step === 'history') this.loadPage();
    },
    onNewCheck() {
      this.form = this.emptyForm();
      this.details = [];
      this.lockedShelfIdList = [];
      this.shelfList = [];
      this.blindPrint = false;
      this.feedbackError = '';
      this.auditError = '';
      this.auditComment = '';
      if (this.$refs.formRef) this.$refs.formRef.clearValidate();
      this.showStep('create');
      this.$message.success('已创建新的盘点单草稿');
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
    async loadShelfOptions(warehouseId) {
      this.shelfList = [];
      if (!warehouseId) return;
      try {
        const res = await shelfApi.page({ page: 1, limit: 999, warehouseId, status: 1 });
        this.shelfList = (res && res.list) || [];
      } catch (e) { this.shelfList = []; }
    },
    onWarehouseChange(warehouseId) {
      this.lockedShelfIdList = [];
      this.loadShelfOptions(warehouseId);
    },

    async loadPage() {
      this.loading = true;
      try {
        this.query.startDate = (this.dateRange && this.dateRange[0]) || '';
        this.query.endDate = (this.dateRange && this.dateRange[1]) || '';
        const res = await stockCheckApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },

    /** 从历史列表打开一张单：按状态跳到该处理的那一步 */
    async openCheck(row, mode) {
      const res = await stockCheckApi.detail(row.id);
      this.form = { ...this.emptyForm(), ...(res || {}) };
      this.details = ((res && res.details) || []).map((d) => ({ ...d, goodsStatus: d.goodsStatus || 'NORMAL' }));
      this.lockedShelfIdList = (this.form.lockedShelfIds || '').split(',').filter(Boolean).map(Number);
      this.blindPrint = this.form.checkMode === 1;
      this.auditComment = '';
      this.feedbackError = '';
      this.auditError = '';
      await this.loadShelfOptions(this.form.warehouseId);
      if (this.form.status === ST.ARCHIVED || this.form.status === ST.CANCELED) this.historyDetail = this.form;
      this.showStep(mode === 'print' ? 'print' : this.stepOf(this.form.status));
    },
    stepOf(status) {
      return ({
        [ST.DRAFT]: 'create', [ST.WAIT_FB]: 'feedback', [ST.FEEDBACK]: 'submit',
        [ST.AUDITING]: 'audit', [ST.REJECTED]: 'feedback', [ST.ARCHIVED]: 'audit', [ST.CANCELED]: 'submit',
      })[status] || 'create';
    },

    async pickCheckUser() {
      const u = await this.$refs.adminPicker.open();
      if (!u) return;
      this.form.checkUserId = u.id;
      this.form.checkPeople = u.realName || u.account || '';
    },

    /** 保存草稿(首次) + 按范围从库存展开应盘明细 */
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
          warehouseId: this.form.warehouseId,
          categoryId: this.form.categoryId,
          shelfIdList: this.lockedShelfIdList,
        });
        this.$message.success(`已从库存中生成 ${count} 条盘点明细`);
        await this.refreshDetail();
        this.showStep('print');
      } finally { this.saving = false; }
    },
    async refreshDetail() {
      const res = await stockCheckApi.detail(this.form.id);
      this.form = { ...this.form, ...(res || {}) };
      this.details = ((res && res.details) || []).map((d) => ({ ...d, goodsStatus: d.goodsStatus || 'NORMAL' }));
    },

    onGoodsStatusChange(row) {
      if (row.goodsStatus === 'NORMAL' && !row.feedbackRemark) this.$set(row, 'feedbackRemark', '无异常');
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

    async onSaveFeedback() {
      // 前端先拦一道，省去异常行还要等后端来回；后端同样有校验，是最终防线
      const invalid = this.details.find((d) => d.goodsStatus !== 'NORMAL' && !String(d.feedbackRemark || '').trim());
      if (invalid) {
        this.feedbackError = `${invalid.sku || invalid.goodsName} 为异常状态，请填写具体反馈说明。`;
        return;
      }
      this.feedbackError = '';
      this.saving = true;
      try {
        await stockCheckApi.feedback({
          checkId: this.form.id,
          submit: false,
          items: this.details.map((d) => ({
            id: d.id,
            actualStock: d.actualStock || 0,
            goodsStatus: d.goodsStatus,
            feedbackRemark: d.feedbackRemark || '',
          })),
        });
        this.$message.success('反馈已保存，盘点汇总已生成');
        await this.refreshDetail();
        this.showStep('submit');
      } finally { this.saving = false; }
    },

    async onSubmitAudit() {
      await this.$confirm('提交后将锁定反馈数据，审批通过前库存不会变更。继续?', '确认', { type: 'warning' });
      this.saving = true;
      try {
        await stockCheckApi.submitAudit(this.form.id, this.form.checkPeople);
        this.$message.success('已提交领导审核，待办通知发送成功');
        await this.refreshDetail();
        this.showStep('audit');
      } finally { this.saving = false; }
    },

    async onAudit(pass) {
      const comment = String(this.auditComment || '').trim();
      if (!pass && !comment) {
        this.auditError = '退回盘点单前必须填写退回原因。';
        return;
      }
      this.auditError = '';
      if (pass) await this.$confirm('审核通过后将按差异校准库存并归档盘点记录。继续?', '确认', { type: 'warning' });
      this.saving = true;
      try {
        await stockCheckApi.audit({ checkId: this.form.id, pass, comment });
        this.$message.success(pass ? '审核通过：库存已更新，盘点记录已归档' : '盘点单已退回，反馈数据已解锁');
        await this.refreshDetail();
        if (!pass) this.showStep('feedback');
      } finally { this.saving = false; }
    },

    async onCancel(row) {
      await this.$confirm(`作废盘点单「${row.checkNo}」?`, '提示', { type: 'warning' });
      await stockCheckApi.cancel(row.id);
      this.$message.success('已作废');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.inventory-check { color: #303133; }
.text-muted { color: #909399; }
.text-small { font-size: 12px; }
.danger-text { color: #f56c6c; }

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
  display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px;
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
.section-heading h3 { margin: 0; font-size: 14px; }
.section-heading p { margin: 5px 0 0; font-size: 13px; }
.heading-actions { display: flex; align-items: center; gap: 14px; }
.compact-heading { margin-bottom: 8px; }

.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
.form-span { grid-column: 1 / -1; }
.form-grid >>> .el-form-item { margin-bottom: 16px; }
.form-grid >>> .el-form-item__label { padding-bottom: 2px; line-height: 22px; color: #606266; }

.scope-band, .notice-band {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-top: 18px; padding: 13px 14px; background: #ecf5ff; color: #4e5969;
  border: 1px solid #d3e3ff; border-left: 3px solid #409eff; border-radius: 6px;
}
.scope-band > div, .notice-band { align-items: center; }
.scope-band > div { display: flex; gap: 8px; font-weight: 500; }
.notice-band { justify-content: flex-start; gap: 10px; }
.notice-band i { font-size: 16px; color: #409eff; }

.action-bar { margin-top: 18px; }
.action-bar .btn-block { width: 100%; }
.split-actions { display: flex; justify-content: space-between; gap: 12px; }
.validation-message { margin-top: 10px; color: #f56c6c; font-size: 13px; }

.data-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 9px 8px; border-bottom: 1px solid #ebeef5; text-align: center; vertical-align: middle; word-break: break-all; }
.data-table th { background: #f5f7fa; color: #606266; font-weight: 500; }
.data-table tbody tr:hover { background: #f5faff; }
.empty-row { padding: 26px 0; color: #c0c4cc; }
.diff-negative { color: #f56c6c; font-weight: 600; }
.diff-positive { color: #67c23a; font-weight: 600; }

.print-sheet { padding: 26px; background: #fff; border: 1px solid #ebeef5; border-radius: 6px; }
.sheet-title { text-align: center; font-weight: 600; font-size: 15px; margin-bottom: 12px; }
.sheet-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 20px; margin-bottom: 16px; color: #909399; font-size: 12px; }
.print-table th, .print-table td { border: 1px solid #dcdfe6; }
.print-table th:nth-child(1) { width: 6%; }
.print-table th:nth-child(2), .print-table th:nth-child(3) { width: 10%; }
.print-table th:nth-child(4) { width: 13%; }
.print-table th:nth-child(5) { width: 10%; }
.print-table th:nth-child(6) { width: 7%; }
.print-table th:nth-child(7), .print-table th:nth-child(8) { width: 10%; }
.print-table th:nth-child(9) { width: 9%; }
.print-table th:nth-child(10) { width: 15%; }
.signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 38px; text-align: center; color: #909399; }
.signatures span { padding-top: 8px; border-top: 1px solid #303133; }

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

.review-layout { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.review-block { padding: 16px; background: #fafbfc; border: 1px solid #ebeef5; border-radius: 6px; }
.review-block h3 { margin: 0 0 12px; font-size: 14px; }
.exception-row { display: flex; justify-content: space-between; gap: 14px; padding: 9px 0; border-bottom: 1px dashed #ebeef5; font-size: 13px; }
.exception-row:last-child { border-bottom: 0; }
.detail-list { margin: 0; }
.detail-list > div { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; border-bottom: 1px dashed #ebeef5; font-size: 13px; }
.detail-list dt { color: #909399; }
.detail-list dd { margin: 0; text-align: right; }

.audit-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(220px, .85fr); gap: 30px; }
.timeline { margin: 0; padding: 0; list-style: none; }
.timeline-item { position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; padding-bottom: 26px; }
.timeline-item:not(:last-child)::after { position: absolute; left: 15px; top: 30px; bottom: 2px; width: 1px; background: #ebeef5; content: ''; }
.timeline-mark { position: relative; z-index: 1; display: grid; place-items: center; width: 30px; height: 30px; color: #909399; background: #f0f2f5; border-radius: 50%; }
.timeline-item.done .timeline-mark, .timeline-item.current .timeline-mark { color: #fff; background: #409eff; }
.timeline-item strong { margin-right: 8px; }
.timeline-item p { margin: 6px 0 0; font-size: 13px; }
.audit-comment { display: block; margin: 12px 0; }
.audit-actions { display: flex; gap: 10px; }
.audit-summary { padding: 16px; background: #fafbfc; border: 1px solid #ebeef5; border-radius: 6px; height: fit-content; }
.audit-summary h3 { margin: 0 0 12px; font-size: 14px; }
.audit-summary .btn-block { width: 100%; margin-top: 12px; }

.history-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; align-items: end; gap: 10px; margin-bottom: 16px; }
.history-filters label { display: block; }
.history-filters label span { display: block; margin-bottom: 4px; }
.filter-wide { grid-column: span 2; }
.history-table th:nth-child(1) { width: 16%; }
.history-table th:nth-child(2) { width: 22%; }
.history-table th:nth-child(8) { width: 16%; }
.row-actions >>> .el-button--text { padding: 0 4px; }
.history-pager { margin-top: 16px; text-align: right; }
.history-detail { margin-top: 20px; padding: 16px; background: #fafbfc; border: 1px solid #ebeef5; border-radius: 6px; }
.inventory-result > div { display: flex; align-items: center; gap: 8px; padding: 8px 0; font-size: 13px; }
.done-icon { color: #67c23a; }

@media (max-width: 1100px) {
  .workflow { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .audit-layout, .review-layout, .form-grid { grid-template-columns: 1fr; }
  .history-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
