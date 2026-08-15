<template>
  <div class="app-container wave-page">
    <!-- 波次是仓内作业的调度单位，新人容易和出库单混淆，这里说明用途和边界 -->
    <el-alert class="wave-intro" type="info" :closable="false" show-icon>
      <div slot="title" class="wave-intro-title">波次 = 一批出库单的拣货任务</div>
      <div class="wave-intro-body">
        <div>
          把多张<b>草稿态</b>出库单合成一个波次，仓库按波次一趟把货拣完，再走复核、出库生效扣库存。
          作用是少走路、少漏单：10 张单一起拣，比一张张拣快得多。
        </div>
        <div class="wave-intro-flow">
          组波次 → 释放（组波时可一步到位） → 拣货（右侧面板）
          → <span class="wave-intro-link" @click="$router.push('/warehouse/review')">复核</span>
          → 出库生效（扣库存）
        </div>
        <div class="wave-intro-note">
          <b>商城订单发货不走波次</b>：订单发货时系统会自动建出库单并立即生效扣账，已生效的单不能组波（否则同一批货扣两遍）。
          所以这里能组波的只有仓库自己在「出库管理」新建的草稿单。
        </div>
        <div class="wave-intro-note">
          <b>策略</b>决定先出哪批货：FIFO 先入先出、FEFO 先到期先出（默认，与订单发货口径一致）、最少剩余优先用于清尾货。
          <b>状态</b>：草稿可改可作废 → 已释放表示已下发拣货 → 已完成即拣货复核结束。
        </div>
      </div>
    </el-alert>

    <div class="wave-layout">
      <!-- 左：波次列表 -->
      <div class="wave-master">
        <div class="wave-panel-head">
          <span class="wave-panel-title">波次</span>
          <div>
            <el-button type="primary" icon="el-icon-plus" size="mini" @click="openBuild">组波次</el-button>
            <!-- <el-button type="success" icon="el-icon-magic-stick" size="mini" @click="autoDialog=true">自动组波</el-button> -->
          </div>
        </div>

        <el-form :model="query" size="mini" class="wave-filter">
          <el-input v-model="query.code" placeholder="波次号" clearable @keyup.enter.native="onSearch" />
          <el-select v-model="query.warehouseId" filterable clearable placeholder="全部仓库" @change="onSearch">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
          <el-select v-model="query.status" clearable placeholder="全部状态" @change="onSearch">
            <el-option v-for="(v,k) in statusMap" :key="k" :label="v" :value="Number(k)" />
          </el-select>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form>

        <el-table
          ref="waveTable"
          v-loading="loading"
          :data="tableData"
          border
          size="mini"
          highlight-current-row
          height="440"
          @current-change="onSelectWave"
        >
          <el-table-column prop="code" label="波次号" min-width="140" show-overflow-tooltip />
          <el-table-column label="仓库" min-width="90" show-overflow-tooltip>
            <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
          </el-table-column>
          <el-table-column label="单数" width="55" align="center">
            <template slot-scope="{row}">{{ (row.outboundIds || '').split(',').filter(Boolean).length }}</template>
          </el-table-column>
          <el-table-column label="状态" width="72">
            <template slot-scope="{row}"><el-tag :type="statusType(row.status)" size="mini">{{ statusMap[row.status] }}</el-tag></template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="wave-pager"
          :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
          layout="total, prev, pager, next" @current-change="loadPage"
        />
      </div>

      <!-- 右：选中波次的拣货作业 -->
      <div class="wave-detail">
        <div v-if="!currentWave.id" class="wave-empty">
          <i class="el-icon-s-order" />
          <p>请在左侧选择一个波次</p>
        </div>

        <template v-else>
          <div class="wave-panel-head">
            <div class="wave-head-main">
              <span class="wave-panel-title">{{ currentWave.code }}</span>
              <el-tag :type="statusType(currentWave.status)" size="mini">{{ statusMap[currentWave.status] }}</el-tag>
              <el-tag :type="currentWave.pickMode === 1 ? 'warning' : 'info'" size="mini">
                {{ currentWave.pickMode === 1 ? '批量拣' : '按单拣' }}
              </el-tag>
              <span class="wave-head-meta">{{ groupByMap[currentWave.groupBy] || '按仓' }}</span>
              <span class="wave-head-meta">{{ strategyMap[currentWave.strategy] || 'FIFO' }}</span>
              <span class="wave-head-meta">{{ warehouseText(currentWave.warehouseId) }}</span>
              <span class="wave-head-meta">{{ currentWave.createUserName }} {{ shortTime(currentWave.createTime) }}</span>
            </div>
            <div class="wave-head-actions">
              <template v-if="currentWave.status===0">
                <el-button type="primary" size="mini" icon="el-icon-s-promotion" @click="onRelease(currentWave)">释放</el-button>
                <el-button type="danger" size="mini" plain @click="onCancel(currentWave)">作废</el-button>
              </template>
            </div>
          </div>

          <div class="wave-head-outbound">
            <span class="wave-summary-label">关联出库单</span>{{ currentWave.outboundIds || '-' }}
          </div>

          <el-tabs v-model="activeTab" @tab-click="onTabClick">
            <!-- 按单拣：逐张拣货单 -->
            <el-tab-pane name="pick">
              <span slot="label">拣货单 <el-badge v-if="pickOrders.length" :value="pickOrders.length" class="tab-badge" /></span>
              <!-- 草稿波次还没生成拣货单，直接给出下一步动作，避免误以为流程卡住 -->
              <el-alert v-if="currentWave.status===0" type="warning" :closable="false" style="margin-bottom:10px">
                波次为<b>草稿</b>状态，尚未生成拣货单。点右上角<b>「释放」</b>后系统会按
                <b>{{ strategyMap[currentWave.strategy] || 'FIFO' }}</b> 分配批次库位并生成拣货单。
              </el-alert>
              <el-table v-loading="pickLoading" :data="pickOrders" border stripe size="mini" max-height="46vh">
                <el-table-column prop="code" label="拣货单号" min-width="170" show-overflow-tooltip />
                <el-table-column prop="outboundCode" label="出库单" min-width="150" show-overflow-tooltip />
                <el-table-column label="状态" width="80">
                  <template slot-scope="{row}"><el-tag :type="pickStatusType(row.status)" size="mini">{{ pickStatusMap[row.status] }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="pickerName" label="拣货员" width="95">
                  <template slot-scope="{row}">{{ row.pickerName || '未指派' }}</template>
                </el-table-column>
                <!-- 开始/完成合成一列，右侧面板宽度有限，避免横向滚动条盖住操作列 -->
                <el-table-column label="拣货时间" width="155">
                  <template slot-scope="{row}">
                    <div class="cell-time">{{ formatDateTime(row.pickStartTime) || '-' }}</div>
                    <div class="cell-time cell-time--done">{{ formatDateTime(row.pickFinishTime) || '-' }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="205" fixed="right">
                  <template slot-scope="{row}">
                    <!-- 已拣完/已复核/已作废的单不能再拣，同一个弹窗降级为只读的明细查看 -->
                    <el-button type="text" @click="openPick(row)">{{ row.status < 2 ? '拣货' : '明细' }}</el-button>
                    <el-button type="text" @click="onPrint(row)">打印</el-button>
                    <el-button v-if="row.status===0" type="text" @click="openAssign(row)">指派</el-button>
                    <el-button v-if="row.status===2" type="text" @click="onCreateReview(row)">生成复核单</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 批量拣：同库位×批次×商品合并后的行走路径 -->
            <el-tab-pane label="合并拣货视图" name="batch" :disabled="currentWave.status===0">
              <el-alert type="info" :closable="false" style="margin-bottom:10px">
                同一库位 × 批次 × 商品的拣货需求已合并，按库位路径顺序排列。拣完后请回「拣货单」页签逐单确认。
              </el-alert>
              <el-table v-loading="batchLoading" :data="batchRows" border stripe size="mini" max-height="42vh">
                <el-table-column type="index" width="45" />
                <el-table-column prop="locationCode" label="库位" width="140">
                  <template slot-scope="{row}"><b class="loc">{{ row.locationCode || '通用池' }}</b></template>
                </el-table-column>
                <el-table-column prop="batchNo" label="批次" width="140" />
                <el-table-column prop="productId" label="商品ID" width="90" />
                <el-table-column prop="goodsName" label="商品名称" min-width="170" show-overflow-tooltip />
                <el-table-column label="合计应拣" width="90">
                  <template slot-scope="{row}"><b class="plan">{{ row.totalPlan }}</b></template>
                </el-table-column>
                <el-table-column label="已拣" width="80">
                  <template slot-scope="{row}">{{ row.totalPicked }}</template>
                </el-table-column>
                <el-table-column label="来源单数" width="95">
                  <template slot-scope="{row}">
                    <el-tooltip placement="top">
                      <div slot="content">
                        <div v-for="s in row.sources" :key="s.pickItemId">拣货单 {{ s.pickOrderId }} 应拣 {{ s.plan }}</div>
                      </div>
                      <el-tag size="mini">{{ (row.sources || []).length }} 单</el-tag>
                    </el-tooltip>
                  </template>
                </el-table-column>
              </el-table>
              <div class="wave-dialog-summary wave-dialog-summary--bottom">
                <span>拣货点位 <b>{{ batchRows.length }}</b> 个</span>
                <el-divider direction="vertical" />
                <span>计划拣货 <b class="plan">{{ batchTotal }}</b> 件</span>
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>
      </div>
    </div>

    <!-- 组波次 -->
    <el-dialog
      title="组波次"
      :visible.sync="buildVisible"
      width="820px"
      top="4vh"
      append-to-body
      custom-class="warehouse-wave-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="buildForm" label-width="90px" size="small">
        <el-form-item label="仓库">
          <el-select v-model="buildForm.warehouseId" filterable placeholder="请选择仓库" style="width:100%" @change="loadOutboundCandidates">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配策略">
          <el-radio-group v-model="buildForm.strategy">
            <el-radio :label="1">FEFO (先到期先出)</el-radio>
            <el-radio :label="0" disabled>FIFO (先入先出)</el-radio>
            <el-radio :label="2" disabled>最少剩余优先</el-radio>
          </el-radio-group>
          <p class="strategy-tip">
            默认 FEFO，与订单发货口径一致。「最少剩余优先」会绕过效期优先，仅用于清尾货、腾库位。
          </p>
        </el-form-item>
        <el-form-item label="选择出库单">
          <el-table ref="candidateTable" :data="candidates" border size="small" max-height="280" @selection-change="s => selectedOutbounds = s">
            <el-table-column type="selection" width="45" />
            <el-table-column prop="code" label="出库单号" width="200" />
            <el-table-column prop="applyUserName" label="申请人" width="120" />
            <el-table-column label="创建时间">
              <template slot-scope="{row}">{{ shortTime(row.createTime) }}</template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="buildForm.remark" /></el-form-item>
      </el-form>
      <div slot="footer" class="build-footer">
        <span class="build-footer-tip">「生成草稿」还能改能作废；「生成并释放」直接下发拣货并预留库存。</span>
        <div>
          <el-button size="small" @click="buildVisible=false">取消</el-button>
          <el-button size="small" :loading="saving" @click="onBuildSubmit(false)">生成草稿</el-button>
          <el-button type="primary" size="small" :loading="saving" @click="onBuildSubmit(true)">生成并释放</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 自动组波 -->
    <el-dialog
      title="自动组波"
      :visible.sync="autoDialog"
      width="560px"
      top="6vh"
      append-to-body
      custom-class="warehouse-wave-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="autoForm" label-width="110px" size="small">
        <el-form-item label="仓库">
          <el-select v-model="autoForm.warehouseId" filterable placeholder="请选择仓库" style="width:100%">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="组波依据">
          <el-radio-group v-model="autoForm.groupBy">
            <el-radio :label="0">全部一波</el-radio>
            <el-radio :label="1">按客户</el-radio>
            <el-radio :label="2">按承运商</el-radio>
            <el-radio :label="3">按优先级分批</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="autoForm.groupBy===3" label="每波单数">
          <el-input-number v-model="autoForm.batchSize" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="分配策略">
          <el-radio-group v-model="autoForm.strategy">
            <el-radio :label="1">FEFO (先到期先出)</el-radio>
            <el-radio :label="0">FIFO (先入先出)</el-radio>
            <el-radio :label="2">最少剩余优先</el-radio>
          </el-radio-group>
          <p class="strategy-tip">
            默认 FEFO，与订单发货口径一致。「最少剩余优先」会绕过效期优先，仅用于清尾货、腾库位。
          </p>
        </el-form-item>
        <el-form-item label="拣货模式">
          <el-radio-group v-model="autoForm.pickMode">
            <el-radio :label="0">按单拣</el-radio>
            <el-radio :label="1">批量合并拣</el-radio>
          </el-radio-group>
        </el-form-item>
        <div style="color:#909399;font-size:12px;padding-left:110px">
          将扫描该仓所有<b>草稿状态</b>的出库单，并按依据聚合成波次
        </div>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="autoDialog=false">取消</el-button>
        <el-button type="primary" size="small" :loading="autoLoading" @click="onAutoBuild">开始组波</el-button>
      </div>
    </el-dialog>

    <!-- 指派拣货员 -->
    <el-dialog title="指派拣货员" :visible.sync="assignVisible" width="440px" append-to-body>
      <el-form label-width="90px" size="small">
        <el-form-item label="拣货单">{{ currentPick.code }}</el-form-item>
        <el-form-item label="拣货员">
          <el-input v-model="assignForm.pickerName" readonly>
            <el-button slot="append" icon="el-icon-user" @click="pickUser">选择</el-button>
          </el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="assignVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onAssignSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 拣货执行 -->
    <el-dialog
      :title="`${pickDetail.status >= 2 ? '拣货明细' : '拣货'} ${pickDetail.code||''}`"
      :visible.sync="pickVisible"
      width="1080px"
      top="4vh"
      append-to-body
      custom-class="warehouse-wave-dialog warehouse-wave-dialog--wide"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom:12px">
        <b>出库单：</b>{{ pickDetail.outboundCode }} · <b>状态：</b>{{ pickStatusMap[pickDetail.status] }} · <b>拣货员：</b>{{ pickDetail.pickerName || '未指派' }}
      </div>
      <el-alert v-if="pickDetail.status < 2" type="success" :closable="false" style="margin-bottom:10px">
        明细已按<b>库位路径顺序</b>（层 → 行 → 列）排列，请依序拣货以减少行走距离。
      </el-alert>
      <el-alert v-else type="info" :closable="false" style="margin-bottom:10px">
        该拣货单已完成，以下为拣货结果，仅供查看。
      </el-alert>
      <el-table :data="pickDetail.items || []" border size="small" max-height="46vh">
        <el-table-column label="序" width="45">
          <template slot-scope="{$index}"><b class="step">{{ $index + 1 }}</b></template>
        </el-table-column>
        <el-table-column prop="goodsName" label="商品" min-width="160" />
        <el-table-column prop="productId" label="商品ID" width="80" />
        <!-- 货没上架时释放波次分配不出库位，只能显示「通用池」，
             拣货员不知道去哪儿取货，这里允许自己选实际取货的库位 -->
        <el-table-column label="库位" width="230">
          <template slot-scope="{row}">
            <b v-if="pickDetail.status >= 2" class="loc">{{ row.locationCode || '通用池' }}</b>
            <el-select
              v-else
              v-model="row.locationId"
              size="mini"
              clearable
              filterable
              placeholder="通用池（未指定库位）"
              style="width:100%"
              :loading="locLoading[locKey(row)]"
              @visible-change="v => v && loadLocationOptions(row)"
              @change="() => onLocationChange(row)"
            >
              <el-option
                v-for="l in (locOptions[locKey(row)] || [])"
                :key="l.locationId"
                :label="l.availableNum > 0 ? l.locationCode + '（可用 ' + l.availableNum + '）' : l.locationCode"
                :value="l.locationId"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" width="150" />
        <el-table-column label="应拣" width="80"><template slot-scope="{row}"><b>{{ row.planNum }}</b></template></el-table-column>
        <el-table-column label="实拣" width="140">
          <template slot-scope="{row}">
            <el-input-number v-model="row.pickedNum" :min="0" :max="row.planNum" size="mini" controls-position="right" :disabled="pickDetail.status >= 2" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{row}">{{ ({ 0: '待拣', 1: '已拣', 2: '跳过' })[row.status] }}</template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button size="small" @click="pickVisible=false">关闭</el-button>
        <!-- 整单拣不到货时的出口：作废本单并记原因，出库单可补货后重新组波 -->
        <el-button v-if="pickDetail.status < 2" type="danger" plain size="small" @click="onShortage">缺货终止</el-button>
        <el-button v-if="pickDetail.status < 2" type="primary" size="small" @click="onFillAll">按应拣填满</el-button>
        <el-button v-if="pickDetail.status < 2" type="primary" size="small" @click="onConfirmPick">确认拣货</el-button>
      </div>
    </el-dialog>

    <admin-picker-dialog ref="adminPicker" title="选择拣货员" />
  </div>
</template>

<script>
import { waveApi, warehouseApi, outboundApi, pickApi, reviewApi, stockApi, locationApi } from '@/api/warehouse';
import AdminPickerDialog from '../components/AdminPickerDialog.vue';
import { doPrint } from '../components/printUtil';
import { formatDateTime } from '../components/dateTime';

export default {
  name: 'WarehouseWave',
  components: { AdminPickerDialog },
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, code: '', warehouseId: null, status: null },
      buildVisible: false, buildForm: { warehouseId: null, strategy: 1, remark: '' },
      candidates: [], selectedOutbounds: [],
      autoDialog: false, autoLoading: false,
      autoForm: { warehouseId: null, groupBy: 0, strategy: 1, pickMode: 0, batchSize: 20 },
      // 右侧从表：选中波次 + 其拣货单 / 合并拣货视图
      currentWave: {}, activeTab: 'pick',
      pickLoading: false, pickOrders: [],
      batchLoading: false, batchRows: [],
      currentPick: {},
      assignVisible: false, assignForm: { pickerId: null, pickerName: '' },
      pickVisible: false, pickDetail: {},
      // 库位候选缓存 / 加载态，key 见 locKey()
      locOptions: {}, locLoading: {},
      statusMap: { 0: '草稿', 1: '已释放', 2: '已完成', 3: '已作废' },
      pickStatusMap: { 0: '待拣', 1: '拣货中', 2: '已拣完', 3: '已复核', 4: '已作废' },
      groupByMap: { 0: '按仓', 1: '按客户', 2: '按承运商', 3: '按优先级' },
      strategyMap: { 0: 'FIFO', 1: 'FEFO', 2: '最少剩余优先' },
    };
  },
  computed: {
    batchTotal() { return this.batchRows.reduce((s, r) => s + (r.totalPlan || 0), 0); },
  },
  created() { this.loadWarehouses(); this.loadPage(); },
  methods: {
    formatDateTime,
    shortTime(t) { return t ? t.replace('T', ' ').substring(0, 19) : ''; },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    statusType(s) { return ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' })[s] || ''; },
    pickStatusType(s) { return ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'primary', 4: 'danger' })[s] || 'info'; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) { /* ignore */ } },
    async loadPage() {
      this.loading = true;
      try {
        const r = await waveApi.page(this.query);
        this.tableData = (r && r.list) || [];
        this.total = (r && r.total) || 0;
        this.restoreSelection();
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, status: null }; this.loadPage(); },

    // ---- 主从联动 ----
    // 翻页/刷新后列表是新对象，靠 id 找回当前行，避免右侧面板被清空
    restoreSelection() {
      const keep = this.tableData.find(w => w.id === this.currentWave.id);
      this.$nextTick(() => {
        if (keep) this.$refs.waveTable.setCurrentRow(keep);
        else if (this.tableData.length) this.$refs.waveTable.setCurrentRow(this.tableData[0]);
        else this.currentWave = {};
      });
    },
    onSelectWave(row) {
      if (!row) return;
      const changed = row.id !== this.currentWave.id;
      this.currentWave = row;
      if (changed) { this.batchRows = []; this.activeTab = row.status === 0 ? 'pick' : this.activeTab; }
      this.loadPickOrders();
      if (this.activeTab === 'batch' && row.status !== 0) this.loadBatchRows();
    },
    onTabClick(tab) { if (tab.name === 'batch') this.loadBatchRows(); },
    async loadPickOrders() {
      if (!this.currentWave.id) return;
      this.pickLoading = true;
      try {
        const r = await pickApi.page({ page: 1, limit: 200, waveId: this.currentWave.id });
        this.pickOrders = (r && r.list) || [];
      } finally { this.pickLoading = false; }
    },
    async loadBatchRows() {
      if (!this.currentWave.id || this.currentWave.status === 0) return;
      this.batchLoading = true;
      try { this.batchRows = await waveApi.batchPick(this.currentWave.id) || []; } finally { this.batchLoading = false; }
    },

    // ---- 波次操作 ----
    openBuild() { this.buildForm = { warehouseId: null, strategy: 1, remark: '' }; this.candidates = []; this.selectedOutbounds = []; this.buildVisible = true; },
    async loadOutboundCandidates() {
      if (!this.buildForm.warehouseId) return;
      // notInWave：已进过波次的单不能再组，列出来只会让人白勾一次
      const r = await outboundApi.page({ page: 1, limit: 200, warehouseId: this.buildForm.warehouseId, status: 0, notInWave: true });
      this.candidates = (r && r.list) || [];
    },
    // release=true 时组完直接释放，省掉「建草稿 → 找到它 → 再点释放」三步
    async onBuildSubmit(release) {
      if (!this.buildForm.warehouseId) return this.$message.warning('请选择仓库');
      if (!this.selectedOutbounds.length) return this.$message.warning('请勾选出库单');
      this.saving = true;
      try {
        const wave = await waveApi.build({ ...this.buildForm, outboundIds: this.selectedOutbounds.map(x => x.id) });
        if (!release) {
          this.$message.success('已创建波次（草稿）');
        } else if (!wave || !wave.id) {
          // 波次已经建出来了，只是没拿到 id，别让用户以为整个操作失败了
          this.$message.warning('波次已创建，但未取到编号，请在列表中手动释放');
        } else {
          const n = await waveApi.release(wave.id);
          this.$message.success(`已创建波次并释放，生成 ${n} 张拣货单`);
        }
        this.buildVisible = false;
        this.loadPage();
      } finally { this.saving = false; }
    },
    async onRelease(row) {
      await this.$confirm(`释放波次将自动按 ${this.strategyMap[row.strategy] || 'FIFO'} 生成拣货单，可用库存会预留。继续?`, '确认', { type: 'warning' });
      const n = await waveApi.release(row.id);
      this.$message.success(`已生成 ${n} 张拣货单`);
      this.loadPage();
      this.loadPickOrders();
    },
    async onCancel(row) {
      await this.$confirm(`作废波次「${row.code}」?`, '提示', { type: 'warning' });
      await waveApi.cancel(row.id);
      this.$message.success('已作废');
      this.loadPage();
    },
    async onAutoBuild() {
      if (!this.autoForm.warehouseId) return this.$message.warning('请选择仓库');
      this.autoLoading = true;
      try {
        const list = await waveApi.autoBuild(this.autoForm);
        const n = (list || []).length;
        if (!n) this.$message.warning('该仓没有草稿状态的出库单');
        else this.$message.success(`已生成 ${n} 个波次`);
        this.autoDialog = false;
        this.loadPage();
      } finally { this.autoLoading = false; }
    },

    // ---- 拣货单操作 ----
    openAssign(row) { this.currentPick = row; this.assignForm = { pickerId: null, pickerName: '' }; this.assignVisible = true; },
    async pickUser() {
      const u = await this.$refs.adminPicker.open();
      if (!u) return;
      this.assignForm.pickerId = u.id;
      this.assignForm.pickerName = u.realName || u.account || '';
    },
    async onAssignSubmit() {
      if (!this.assignForm.pickerId) return this.$message.warning('请选择拣货员');
      await pickApi.assign(this.currentPick.id, this.assignForm.pickerId, this.assignForm.pickerName);
      this.$message.success('已指派');
      this.assignVisible = false;
      this.loadPickOrders();
    },
    async openPick(row) {
      this.pickDetail = await pickApi.detail(row.id) || {};
      if (!this.pickDetail.items) this.pickDetail.items = [];
      this.locOptions = {};
      this.locLoading = {};
      this.pickVisible = true;
    },
    onFillAll() { (this.pickDetail.items || []).forEach(i => { i.pickedNum = i.planNum; }); },

    /** 库位候选按 商品+SKU+商户+批次 隔离缓存，避免每次展开都请求 */
    locKey(row) {
      return [row.productId, row.attrValueId || 0, row.merId || '', row.batchId || ''].join('_');
    },
    /**
     * 拉该行商品在本仓有可用库存的库位。
     * 批次已定的行只列该批次所在的库位——拣别的批次会让批次账和库位账对不上。
     */
    async loadLocationOptions(row) {
      const key = this.locKey(row);
      if (this.locOptions[key]) return;
      this.$set(this.locLoading, key, true);
      try {
        const list = await stockApi.distribution({
          warehouseId: this.pickDetail.warehouseId || this.currentWave.warehouseId,
          productId: row.productId,
          attrValueId: row.attrValueId || 0,
          merId: row.merId || undefined,
        });
        const options = (list || [])
          .filter((s) => s.locationId && (s.availableNum || 0) > 0)
          .filter((s) => !row.batchId || String(s.batchId) === String(row.batchId))
          .map((s) => ({ locationId: s.locationId, locationCode: s.locationCode || `库位#${s.locationId}`, availableNum: s.availableNum }));
        // 货全在通用池（从没上架过）时上面一个候选都没有，拣货员依旧无处可选；
        // 兜底列出本仓所有启用库位，让他按实物所在货位登记
        if (!options.length) {
          const locs = await locationApi.listByWarehouse(
            this.pickDetail.warehouseId || this.currentWave.warehouseId,
          );
          (locs || []).forEach((l) => options.push({ locationId: l.id, locationCode: l.code, availableNum: 0 }));
        }
        this.$set(this.locOptions, key, options);
      } catch (e) {
        this.$set(this.locOptions, key, []);
      } finally { this.$set(this.locLoading, key, false); }
    },
    /** 选中后回填库位码，确认拣货时会连同实拣数一起保存 */
    onLocationChange(row) {
      const hit = (this.locOptions[this.locKey(row)] || []).find((l) => l.locationId === row.locationId);
      this.$set(row, 'locationCode', hit ? hit.locationCode : null);
    },
    async onConfirmPick() {
      const map = {};
      (this.pickDetail.items || []).forEach(i => { map[i.id] = i.pickedNum == null ? 0 : i.pickedNum; });
      // 一件都没拣到还提交，复核会拿到一张空单；后端同样会拦，这里先省一次往返
      const total = Object.values(map).reduce((sum, n) => sum + (Number(n) || 0), 0);
      if ((this.pickDetail.items || []).length && total <= 0) {
        return this.$message.warning('实拣数量全部为 0，不能提交；请确认是否漏填实拣数量');
      }
      // 没指派拣货员就直接拣的，把当前登录用户记为拣货员
      const u = this.$store.getters.userInfo || {};
      // 先落库位再确认：复核按库位扣减，库位没保存的话拣货员选了等于白选
      const locationMap = {};
      (this.pickDetail.items || []).forEach((i) => { locationMap[i.id] = i.locationId || null; });
      await pickApi.saveLocations(this.pickDetail.id, locationMap);
      await pickApi.confirm(this.pickDetail.id, map, {
        pickerId: u.id,
        pickerName: u.realName || u.account || this.$store.getters.name,
      });
      this.$message.success('拣货完成');
      this.pickVisible = false;
      this.loadPickOrders();
      if (this.activeTab === 'batch') this.loadBatchRows();
    },
    /**
     * 缺货终止：整单拣不到货。作废拣货单并记录原因，不进复核；
     * 关联出库单仍是草稿，补货后可以重新组波再拣。
     */
    async onShortage() {
      const { value } = await this.$prompt('请填写缺货原因（库存不足、货损、找不到货位等）', '缺货终止', {
        inputPlaceholder: '例如：A-02-1-01 库位实物为 0，账实不符待盘点',
        inputValidator: (v) => (v && v.trim() ? true : '缺货原因必填'),
        type: 'warning',
      });
      const u = this.$store.getters.userInfo || {};
      await pickApi.shortage(this.pickDetail.id, value.trim(), {
        operatorId: u.id,
        operatorName: u.realName || u.account || this.$store.getters.name,
      });
      this.$message.success('已按缺货终止，本单作废；出库单可补货后重新组波');
      this.pickVisible = false;
      this.loadPickOrders();
      if (this.activeTab === 'batch') this.loadBatchRows();
    },
    async onPrint(row) {
      try { await doPrint('PK', row.id); } catch (e) { this.$message.error(e.message || '打印失败'); }
    },
    async onCreateReview(row) {
      const u = this.$store.getters.userInfo || {};
      await reviewApi.createFromPick(row.id, {
        reviewerId: u.id,
        reviewerName: u.realName || u.account || this.$store.getters.name,
      });
      this.$message.success('已生成复核单，请到"复核管理"处理');
      this.loadPickOrders();
    },
  },
};
</script>

<style scoped>
.strategy-tip { margin: 4px 0 0; font-size: 12px; color: #909399; line-height: 1.5; }
.build-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.build-footer-tip { font-size: 12px; color: #909399; text-align: left; line-height: 1.5; }
.wave-intro { margin-bottom: 12px; }
.wave-intro-title { font-size: 13px; font-weight: 600; }
.wave-intro-body { font-size: 12px; line-height: 20px; color: #5c6b75; }
.wave-intro-body > div + div { margin-top: 4px; }
.wave-intro-flow { color: #409eff; }
.wave-intro-link { cursor: pointer; text-decoration: underline; }
.wave-intro-note { color: #86909c; }

.wave-layout { display: flex; align-items: flex-start; gap: 12px; }
/* 左侧只是选单，右侧才是作业区，宽度按 4:6 给，且右侧不允许被表格撑破 */
.wave-master { flex: 0 0 400px; min-width: 0; padding: 12px; border: 1px solid #ebeef5; border-radius: 6px; background: #fff; }
.wave-detail { flex: 1 1 auto; width: 0; min-width: 0; min-height: 560px; padding: 12px; border: 1px solid #ebeef5; border-radius: 6px; background: #fff; overflow: hidden; }

/* 操作按钮不参与收缩，元信息再挤也不能把「释放/作废」推出可视区 */
.wave-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.wave-panel-title { font-size: 14px; font-weight: 600; color: #303133; }
.wave-head-main { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; flex: 1 1 auto; min-width: 0; }
.wave-head-actions { flex: 0 0 auto; white-space: nowrap; }
.wave-head-meta { font-size: 12px; color: #909399; }
.wave-head-outbound { margin-bottom: 10px; padding: 8px 12px; border-radius: 4px; background: #f7faff; font-size: 12px; color: #303133; word-break: break-all; }
.wave-summary-label { margin-right: 10px; color: #909399; }

.wave-filter { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; }
.wave-filter .el-input { flex: 1 1 100%; width: auto; }
.wave-filter .el-select { flex: 1 1 0; min-width: 110px; width: auto; }
.wave-filter .el-button { flex: 0 0 auto; margin-left: 0; }
.wave-pager { margin-top: 10px; text-align: right; }

.wave-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 520px; color: #c0c4cc; }
.wave-empty i { font-size: 48px; }
.wave-empty p { margin-top: 12px; font-size: 13px; }

.tab-badge { margin-left: 2px; }
.cell-time { font-size: 12px; line-height: 17px; color: #909399; }
.cell-time--done { color: #67c23a; }
.step { display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; background: #409eff; color: #fff; font-size: 11px; }
.loc { color: #e6a23c; }
.plan { color: #409eff; }
.wave-dialog-summary--bottom { display: flex; justify-content: flex-end; margin: 12px 2px 0; color: #606266; font-size: 12px; }

@media (max-width: 1500px) {
  .wave-layout { flex-direction: column; }
  .wave-master { flex: none; width: 100%; }
  .wave-detail { width: 100%; }
}
</style>

<style>
.warehouse-wave-dialog {
  display: flex;
  flex-direction: column;
  width: 900px;
  max-width: calc(100vw - 48px);
  max-height: 88vh;
  margin-bottom: 0 !important;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 12px 36px rgba(31, 45, 61, 0.2);
}

.warehouse-wave-dialog--wide {
  width: 1080px;
}

.warehouse-wave-dialog .el-dialog__header {
  flex: 0 0 auto;
  padding: 18px 24px 16px;
  border-bottom: 1px solid #ebeef5;
}

.warehouse-wave-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

.warehouse-wave-dialog .el-dialog__footer {
  flex: 0 0 auto;
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

@media (max-width: 768px) {
  .warehouse-wave-dialog {
    max-width: calc(100vw - 24px);
    max-height: 94vh;
  }

  .warehouse-wave-dialog .el-dialog__body {
    padding: 16px;
  }
}
</style>
