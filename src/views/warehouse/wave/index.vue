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
          → <b>复核</b>（拣完后在同一行点「复核」）
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

    <!-- 报损/领用取货：审批通过后货还在货架上，得有人去取出来。
         这类任务没有波次（不发给客户，不用组波），但拣货员的活儿都在这一页，
         所以并进来单列一块，而不是另开一个菜单 -->
    <div v-if="damagePicks.length" class="damage-pick-block">
      <div class="damage-pick-head">
        <span class="damage-pick-title">报损 / 领用取货任务</span>
        <el-badge :value="damagePicks.length" class="tab-badge" />
        <span class="damage-pick-tip">审批已通过、货已预占，需从货位取出实物后确认；确认即扣减库存，不再走复核。</span>
        <el-button size="mini" icon="el-icon-refresh" @click="loadDamagePicks">刷新</el-button>
      </div>
      <el-table :data="damagePicks" border stripe size="mini">
        <el-table-column label="类型" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.bizType === 2 ? 'primary' : 'danger'" size="mini">
              {{ row.bizType === 2 ? '领用' : '报损' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="拣货单号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="sourceDocCode" label="来源单号" min-width="160" show-overflow-tooltip />
        <el-table-column label="仓库" min-width="120">
          <template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{row}">
            <el-tag :type="pickStatusType(row.status)" size="mini">{{ pickStatusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pickerName" label="拣货员" width="100">
          <template slot-scope="{row}">{{ row.pickerName || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="{row}">
            <el-button type="text" @click="openPick(row)">{{ row.status < 2 ? '取货确认' : '明细' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div ref="waveLayout" class="wave-layout" :class="{ 'is-resizing': resizing }">
      <!-- 左：波次列表 -->
      <div class="wave-master" :style="{ flexBasis: `${masterWidth}px` }">
        <div class="wave-panel-head">
          <span class="wave-panel-title">波次</span>
          <div>
            <el-button type="primary" icon="el-icon-plus" size="mini" @click="openBuild">组波次</el-button>
            <!-- <el-button type="success" icon="el-icon-magic-stick" size="mini" @click="autoDialog=true">自动组波</el-button> -->
          </div>
        </div>

        <el-form :model="query" size="mini" class="wave-filter">
          <el-input v-model="query.code" placeholder="波次号" clearable @keyup.enter.native="onSearch" />
          <!-- 现场更常见的是「手上有张出库单，想知道它在哪个波次里」，
               波次号反而记不住，所以出库单号也要能查，且按片段模糊匹配 -->
          <el-input v-model="query.outboundCode" placeholder="出库单号" clearable @keyup.enter.native="onSearch" />
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
          <el-table-column label="出库单号" min-width="150" show-overflow-tooltip>
            <template slot-scope="{row}">{{ outboundCodesText(row) }}</template>
          </el-table-column>
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

      <div
        class="wave-resizer"
        :class="{ 'is-active': resizing }"
        role="separator"
        aria-orientation="vertical"
        tabindex="0"
        :aria-valuemin="masterMinWidth"
        :aria-valuemax="masterMaxWidth"
        :aria-valuenow="Math.round(masterWidth)"
        title="左右拖动调整列表宽度，双击恢复默认宽度"
        @mousedown.prevent="startResize"
        @keydown.left.prevent="resizeMasterBy(-20)"
        @keydown.right.prevent="resizeMasterBy(20)"
        @dblclick.prevent="resetMasterWidth"
      >
        <span class="wave-resizer-handle" />
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
              <el-table ref="pickTable" v-loading="pickLoading" :data="pickOrders" border stripe size="mini" max-height="46vh">
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
                <el-table-column label="操作" width="240" fixed="right">
                  <template slot-scope="{row}">
                    <!-- 已拣完/已复核/已作废的单不能再拣，同一个弹窗降级为只读的明细查看 -->
                    <el-button type="text" @click="openPick(row)">{{ row.status < 2 ? '拣货' : '明细' }}</el-button>
                    <el-button type="text" @click="onPrint(row)">打印</el-button>
                    <el-button v-if="row.status===0" type="text" @click="openAssign(row)">指派</el-button>
                    <!-- 复核并入本行：拣完(2)可复核，已复核(3)只能回看结果 -->
                    <el-button v-if="row.status===2" type="text" class="review-text" @click="openReview(row)">复核</el-button>
                    <el-button v-if="row.status===3" type="text" @click="openReview(row)">复核明细</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 批量拣：同库位×批次×商品合并后的行走路径 -->
            <el-tab-pane label="合并拣货视图" name="batch" :disabled="currentWave.status===0">
              <el-alert type="info" :closable="false" style="margin-bottom:10px">
                同一库位 × 批次 × 商品的拣货需求已合并，按库位路径顺序排列。拣完后请回「拣货单」页签逐单确认。
              </el-alert>
              <el-table ref="batchTable" v-loading="batchLoading" :data="batchRows" border stripe size="mini" max-height="42vh">
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

    <!-- 复核执行：原「复核管理」菜单已并入此处，拣完的单当场复核，不用再跳菜单 -->
    <el-dialog
      :title="`${reviewDetail.status === 0 ? '复核' : '复核明细'} ${reviewDetail.code||''}`"
      :visible.sync="reviewVisible"
      width="1080px"
      top="4vh"
      append-to-body
      custom-class="warehouse-wave-dialog warehouse-wave-dialog--wide"
      :close-on-click-modal="false"
    >
      <div v-loading="reviewLoading">
        <div style="margin-bottom:12px">
          <b>拣货单：</b>{{ reviewDetail.pickOrderCode }} · <b>状态：</b>{{ reviewStatusMap[reviewDetail.status] }} · <b>复核员：</b>{{ reviewDetail.reviewerName || '-' }}
        </div>
        <el-alert v-if="reviewDetail.status === 0" type="success" :closable="false" style="margin-bottom:10px">
          按实物点数填写<b>复核实测</b>，点「通过复核」即<b>扣减库存并让出库单生效</b>，该操作不可撤销。
        </el-alert>
        <el-alert v-else type="info" :closable="false" style="margin-bottom:10px">
          该复核单已{{ reviewStatusMap[reviewDetail.status] }}，以下为复核结果，仅供查看。
          <span v-if="reviewDetail.remark">驳回原因：{{ reviewDetail.remark }}</span>
        </el-alert>
        <el-table :data="reviewDetail.items || []" border size="small" max-height="46vh">
          <el-table-column type="index" width="45" />
          <el-table-column prop="goodsName" label="商品" min-width="160" show-overflow-tooltip />
          <el-table-column prop="productId" label="商品ID" width="90" />
          <el-table-column label="拣货" width="90"><template slot-scope="{row}">{{ row.pickedNum }}</template></el-table-column>
          <el-table-column label="复核实测" width="140">
            <template slot-scope="{row}">
              <el-input-number v-model="row.reviewedNum" :min="0" size="mini" controls-position="right" :disabled="reviewDetail.status !== 0" />
            </template>
          </el-table-column>
          <el-table-column label="差异" width="80">
            <template slot-scope="{row}">
              <span :class="reviewDiffClass(row)">{{ (row.reviewedNum||0) - (row.pickedNum||0) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90"><template slot-scope="{row}">{{ ({ 0: '未检', 1: '通过', 2: '差异' })[row.status] }}</template></el-table-column>
        </el-table>

        <!-- 驳回后原单不会消失，重新复核会另起一张。旧单在这里能查到，
             否则「这单为什么被驳回过」搬走复核菜单后就没地方看了 -->
        <div v-if="reviewHistory.length" class="review-history">
          <div class="review-history-title">历史复核记录（{{ reviewHistory.length }}）</div>
          <div v-for="h in reviewHistory" :key="h.id" class="review-history-row">
            <el-tag :type="reviewStatusType(h.status)" size="mini">{{ reviewStatusMap[h.status] }}</el-tag>
            <span class="review-history-code">{{ h.code }}</span>
            <span class="review-history-meta">{{ h.reviewerName || '-' }} · {{ shortTime(h.createTime) }}</span>
            <span v-if="h.remark" class="review-history-remark">{{ h.remark }}</span>
            <el-button type="text" size="mini" @click="loadReviewDetail(h.id)">查看</el-button>
          </div>
        </div>
      </div>
      <div slot="footer">
        <el-button size="small" @click="reviewVisible=false">关闭</el-button>
        <el-button v-if="reviewDetail.status===0" type="danger" plain size="small" @click="onRejectReview">驳回</el-button>
        <el-button v-if="reviewDetail.status===0" type="primary" size="small" @click="onReviewFillAll">按拣货数填满</el-button>
        <el-button v-if="reviewDetail.status===0" type="primary" size="small" :loading="reviewSaving" @click="onConfirmReview">通过复核 (扣库存)</el-button>
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

const WAVE_MASTER_DEFAULT_WIDTH = 400;
const WAVE_MASTER_STORAGE_KEY = 'warehouse-wave-master-width';

export default {
  name: 'WarehouseWave',
  components: { AdminPickerDialog },
  data() {
    return {
      loading: false, saving: false, total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, code: '', outboundCode: '', warehouseId: null, status: null },
      buildVisible: false, buildForm: { warehouseId: null, strategy: 1, remark: '' },
      candidates: [], selectedOutbounds: [],
      autoDialog: false, autoLoading: false,
      autoForm: { warehouseId: null, groupBy: 0, strategy: 1, pickMode: 0, batchSize: 20 },
      // 右侧从表：选中波次 + 其拣货单 / 合并拣货视图
      currentWave: {}, activeTab: 'pick',
      pickLoading: false, pickOrders: [],
      // 报损拣货任务：没有波次，独立于左侧波次列表加载
      damagePicks: [],
      batchLoading: false, batchRows: [],
      currentPick: {},
      assignVisible: false, assignForm: { pickerId: null, pickerName: '' },
      pickVisible: false, pickDetail: {},
      // 复核（原「复核管理」菜单）：跟着拣货单走，一行一张复核单
      reviewVisible: false, reviewLoading: false, reviewSaving: false,
      reviewDetail: {}, reviewHistory: [],
      // 库位候选缓存 / 加载态，key 见 locKey()
      locOptions: {}, locLoading: {},
      statusMap: { 0: '草稿', 1: '已释放', 2: '已完成', 3: '已作废' },
      pickStatusMap: { 0: '待拣', 1: '拣货中', 2: '已拣完', 3: '已复核', 4: '已作废' },
      reviewStatusMap: { 0: '待复核', 1: '已通过', 2: '差异/驳回', 3: '已作废' },
      groupByMap: { 0: '按仓', 1: '按客户', 2: '按承运商', 3: '按优先级' },
      strategyMap: { 0: 'FIFO', 1: 'FEFO', 2: '最少剩余优先' },
      // 主从面板可拖拽宽度；右侧至少保留 560px，避免作业表格和操作列被挤没
      masterWidth: WAVE_MASTER_DEFAULT_WIDTH,
      masterMinWidth: 320,
      masterMaxWidth: 900,
      detailMinWidth: 560,
      resizerWidth: 14,
      resizing: false,
      resizeStartX: 0,
      resizeStartWidth: WAVE_MASTER_DEFAULT_WIDTH,
    };
  },
  computed: {
    batchTotal() { return this.batchRows.reduce((s, r) => s + (r.totalPlan || 0), 0); },
  },
  created() {
    // 从仓储看板「待处理拣货单」下钻过来时带 warehouseId，跟看板上选的仓库保持一致
    const wid = Number(this.$route.query.warehouseId);
    if (Number.isFinite(wid) && wid > 0) this.query.warehouseId = wid;
    this.loadWarehouses();
    this.loadPage();
    this.loadDamagePicks();
  },
  mounted() {
    try {
      const saved = Number(window.localStorage.getItem(WAVE_MASTER_STORAGE_KEY));
      if (Number.isFinite(saved) && saved > 0) this.masterWidth = saved;
    } catch (e) { /* 浏览器禁用本地存储时沿用默认宽度 */ }
    window.addEventListener('resize', this.onWaveWindowResize);
    this.$nextTick(this.syncMasterBounds);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWaveWindowResize);
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.stopResize);
    document.body.classList.remove('wave-column-resizing');
  },
  methods: {
    formatDateTime,
    /** 桌面端主从面板拖拽；窄屏会切成上下布局，因此不启用分隔条 */
    startResize(event) {
      if (window.innerWidth <= 1500) return;
      this.syncMasterBounds();
      this.resizing = true;
      this.resizeStartX = event.clientX;
      this.resizeStartWidth = this.masterWidth;
      document.addEventListener('mousemove', this.onResizeMove);
      document.addEventListener('mouseup', this.stopResize);
      document.body.classList.add('wave-column-resizing');
    },
    onResizeMove(event) {
      if (!this.resizing) return;
      this.masterWidth = this.clampMasterWidth(this.resizeStartWidth + event.clientX - this.resizeStartX);
    },
    stopResize() {
      if (!this.resizing) return;
      this.resizing = false;
      document.removeEventListener('mousemove', this.onResizeMove);
      document.removeEventListener('mouseup', this.stopResize);
      document.body.classList.remove('wave-column-resizing');
      this.persistMasterWidth();
      this.relayoutWaveTables();
    },
    resizeMasterBy(delta) {
      this.syncMasterBounds();
      this.masterWidth = this.clampMasterWidth(this.masterWidth + delta);
      this.persistMasterWidth();
      this.relayoutWaveTables();
    },
    resetMasterWidth() {
      this.syncMasterBounds();
      this.masterWidth = this.clampMasterWidth(WAVE_MASTER_DEFAULT_WIDTH);
      this.persistMasterWidth();
      this.relayoutWaveTables();
    },
    clampMasterWidth(width) {
      return Math.min(this.masterMaxWidth, Math.max(this.masterMinWidth, Math.round(width)));
    },
    syncMasterBounds() {
      if (window.innerWidth <= 1500) return;
      const layout = this.$refs.waveLayout;
      if (!layout || !layout.clientWidth) return;
      this.masterMaxWidth = Math.max(
        this.masterMinWidth,
        Math.floor(layout.clientWidth - this.resizerWidth - this.detailMinWidth),
      );
      this.masterWidth = this.clampMasterWidth(this.masterWidth);
    },
    onWaveWindowResize() {
      if (window.innerWidth <= 1500 && this.resizing) this.stopResize();
      this.syncMasterBounds();
      this.relayoutWaveTables();
    },
    persistMasterWidth() {
      try { window.localStorage.setItem(WAVE_MASTER_STORAGE_KEY, String(this.masterWidth)); } catch (e) { /* ignore */ }
    },
    relayoutWaveTables() {
      this.$nextTick(() => {
        ['waveTable', 'pickTable', 'batchTable'].forEach((ref) => {
          const table = this.$refs[ref];
          if (table && table.doLayout) table.doLayout();
        });
      });
    },
    shortTime(t) { return t ? t.replace('T', ' ').substring(0, 19) : ''; },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    /** 列表接口补充出库单号；兼容旧接口只有 outboundCode 的情况 */
    outboundCodesText(row) {
      return (row && (row.outboundCodes || row.outboundCode)) || '-';
    },
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
    onReset() { this.query = { page: 1, limit: 20, code: '', outboundCode: '', warehouseId: null, status: null }; this.loadPage(); },

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
    /** 报损/领用取货任务：只列未完成的，拣完的进历史不占版面 */
    async loadDamagePicks() {
      try {
        // 后端 bizType 1=报损 2=领用，这里两类一起取，用类型标签区分
        const [damage, receive] = await Promise.all([
          pickApi.page({ page: 1, limit: 200, bizType: 1 }),
          pickApi.page({ page: 1, limit: 200, bizType: 2 }),
        ]);
        const merged = [...((damage && damage.list) || []), ...((receive && receive.list) || [])];
        this.damagePicks = merged.filter((p) => p.status < 2).sort((a, b) => b.id - a.id);
      } catch (e) {
        this.damagePicks = [];
      }
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
      // 报损/领用取货到此为止；销售拣货还差复核才扣账，得把下一步指出来
      this.$message.success(this.pickDetail.bizType
        ? '取货完成，库存已扣减'
        : '拣货完成，请点本行「复核」核对实物后出库生效');
      this.pickVisible = false;
      this.loadPickOrders();
      this.loadDamagePicks();
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
      this.$message.success(this.pickDetail.bizType
        ? '已按缺货终止，预占已释放；来源单据需人工跟进'
        : '已按缺货终止，本单作废；出库单可补货后重新组波');
      this.pickVisible = false;
      this.loadPickOrders();
      this.loadDamagePicks();
      if (this.activeTab === 'batch') this.loadBatchRows();
    },
    async onPrint(row) {
      try { await doPrint('PK', row.id); } catch (e) { this.$message.error(e.message || '打印失败'); }
    },
    /* ---------------- 复核（原「复核管理」菜单，已并入拣货单行） ---------------- */

    reviewStatusType(s) { return ({ 0: 'info', 1: 'success', 2: 'danger', 3: 'info' })[s] || ''; },
    reviewDiffClass(r) { const d = (r.reviewedNum || 0) - (r.pickedNum || 0); return d === 0 ? '' : (d > 0 ? 'plus' : 'minus'); },

    /**
     * 打开复核弹窗。复核单与拣货单 1:1，但驳回不会作废旧单（后端 reject 只置状态 2），
     * 所以同一张拣货单可能挂着多张复核单：取最新的那张作业，其余进历史记录。
     *
     * 拣完(2) 且没有在办的复核单时，这里顺带把复核单建出来——对操作员来说
     * 「生成复核单」不是一个需要单独决策的动作，点「复核」就该直接进得去。
     */
    async openReview(row) {
      this.currentPick = row;
      this.reviewDetail = {};
      this.reviewHistory = [];
      this.reviewVisible = true;
      this.reviewLoading = true;
      try {
        const res = await reviewApi.page({ page: 1, limit: 50, pickOrderId: row.id });
        const list = (res && res.list) || [];
        let target = list[0];

        if (row.status === 2 && (!target || target.status === 2 || target.status === 3)) {
          // 没有复核单，或仅剩被驳回/作废的旧单：另起一张
          const u = this.$store.getters.userInfo || {};
          target = await reviewApi.createFromPick(row.id, {
            reviewerId: u.id,
            reviewerName: u.realName || u.account || this.$store.getters.name,
          });
          list.unshift(target);
        }
        if (!target) {
          this.reviewVisible = false;
          this.$message.warning('该拣货单没有复核记录');
          return;
        }
        this.reviewHistory = list.filter((r) => r.id !== target.id);
        await this.loadReviewDetail(target.id);
      } catch (e) {
        this.reviewVisible = false;
        this.$message.error((e && e.message) || '打开复核失败');
      } finally {
        this.reviewLoading = false;
      }
    },

    async loadReviewDetail(id) {
      this.reviewLoading = true;
      try {
        this.reviewDetail = (await reviewApi.detail(id)) || {};
        if (!this.reviewDetail.items) this.reviewDetail.items = [];
      } finally {
        this.reviewLoading = false;
      }
    },

    onReviewFillAll() {
      (this.reviewDetail.items || []).forEach((i) => { i.reviewedNum = i.pickedNum || 0; });
    },

    async onConfirmReview() {
      const hasDiff = (this.reviewDetail.items || []).some((i) => (i.reviewedNum || 0) !== (i.pickedNum || 0));
      if (hasDiff) {
        await this.$confirm('存在数量差异，仍确认通过?', '提示', { type: 'warning' });
      }
      const map = {};
      (this.reviewDetail.items || []).forEach((i) => { map[i.id] = i.reviewedNum == null ? 0 : i.reviewedNum; });
      const u = this.$store.getters.userInfo || {};
      this.reviewSaving = true;
      try {
        await reviewApi.confirm(this.reviewDetail.id, map, {
          reviewerId: u.id,
          reviewerName: u.realName || u.account || this.$store.getters.name,
        });
      } finally {
        this.reviewSaving = false;
      }
      const reviewId = this.reviewDetail.id;
      this.reviewVisible = false;
      this.loadPickOrders();
      this.loadPage();
      this.notifyShipInfo(reviewId);
    },

    async onRejectReview() {
      const { value } = await this.$prompt('请输入驳回原因', '驳回', { inputPattern: /.+/, inputErrorMessage: '不能为空' });
      await reviewApi.reject(this.reviewDetail.id, value);
      this.$message.success('已驳回，可在本行重新发起复核');
      this.reviewVisible = false;
      this.loadPickOrders();
    },

    /**
     * 复核通过后把取号结果亮出来。
     *
     * 向承运商下单就发生在这一步，但整个过程是静默的——界面上只是出库单悄悄多了个
     * 运单号。不给回执的话，操作员没法判断快递到底通知没通知，只能去出库单列表翻，
     * 或者干脆以为「交接单」才是通知快递的动作。
     *
     * 查不到承运信息不当异常处理：非京东承运商、仓库没配发货地址、取号接口超时
     * 都会走到这里，复核本身是成功的，退回一句普通提示即可。
     */
    async notifyShipInfo(reviewId) {
      let info = null;
      try {
        info = await reviewApi.shipInfo(reviewId);
      } catch (e) {
        info = null;
      }
      if (!info || !info.expressNo) {
        this.$notify({
          title: '复核通过，出库单已生效',
          message: '未取到运单号，可在「交接管理」新建交接单时手工补录',
          type: 'warning',
          duration: 8000,
        });
        return;
      }
      this.$notify({
        title: '复核通过，已向承运商下单',
        dangerouslyUseHTMLString: true,
        message:
          `出库单 <b>${info.outboundCode || '-'}</b><br/>` +
          `承运商 <b>${info.expressCompany || '-'}</b>　运单号 <b>${info.expressNo}</b><br/>` +
          '承运商已收到揽收通知，等待司机上门取件。<br/>' +
          '司机取货后请到「交接管理」登记交接，订单才会转为已发货。',
        type: 'success',
        duration: 12000,
      });
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

.damage-pick-block {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid #f0d9b5;
  border-radius: 8px;
  background: #fffaf3;
}
.damage-pick-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.damage-pick-title { font-weight: 600; color: #7a5b1f; }
.damage-pick-tip { flex: 1; font-size: 12px; color: #a17c3a; }
.wave-layout { display: flex; align-items: flex-start; gap: 0; }
/* 左侧只是选单，右侧才是作业区；左侧宽度由拖拽分隔条控制 */
.wave-master { flex: 0 0 400px; min-width: 0; padding: 12px; border: 1px solid #ebeef5; border-radius: 6px; background: #fff; }
.wave-resizer { position: relative; align-self: stretch; flex: 0 0 14px; min-height: 560px; cursor: col-resize; outline: none; touch-action: none; }
.wave-resizer::before { content: ''; position: absolute; top: 6px; bottom: 6px; left: 50%; width: 1px; transform: translateX(-50%); background: #ebeef5; transition: background-color .15s, width .15s; }
.wave-resizer-handle { position: absolute; top: 50%; left: 50%; width: 6px; height: 48px; transform: translate(-50%, -50%); border-radius: 4px; background: #dcdfe6; box-shadow: 0 0 0 1px #fff; transition: background-color .15s, height .15s; }
.wave-resizer:hover::before,
.wave-resizer:focus::before,
.wave-resizer.is-active::before { width: 3px; background: #409eff; }
.wave-resizer:hover .wave-resizer-handle,
.wave-resizer:focus .wave-resizer-handle,
.wave-resizer.is-active .wave-resizer-handle { height: 64px; background: #409eff; }
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
.plus { color: #67c23a; font-weight: bold; }
.minus { color: #f56c6c; font-weight: bold; }

/* 复核是拣货后的关键动作（扣库存），在一排文字按钮里需要能被一眼找到 */
.review-text { color: #e6a23c; }
.review-history { margin-top: 12px; padding: 10px 12px; border: 1px solid #ebeef5; border-radius: 6px; background: #fafafa; }
.review-history-title { font-size: 12px; font-weight: 600; color: #606266; margin-bottom: 6px; }
.review-history-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #606266; line-height: 24px; }
.review-history-code { font-weight: 600; }
.review-history-meta { color: #909399; }
.review-history-remark { flex: 1; color: #f56c6c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wave-dialog-summary--bottom { display: flex; justify-content: flex-end; margin: 12px 2px 0; color: #606266; font-size: 12px; }

@media (max-width: 1500px) {
  .wave-layout { flex-direction: column; gap: 12px; }
  .wave-master { flex: none !important; width: 100%; }
  .wave-resizer { display: none; }
  .wave-detail { width: 100%; }
}
</style>

<style>
body.wave-column-resizing { cursor: col-resize !important; user-select: none; }

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
