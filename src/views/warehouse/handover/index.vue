<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-form :inline="true" size="small" class="filter-form">
        <el-form-item label="交接单号">
          <el-input v-model="query.code" clearable style="width: 170px" @keyup.enter.native="onSearch" />
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="query.warehouseId" clearable filterable placeholder="全部" style="width: 170px">
            <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递员">
          <el-input v-model="query.courierName" clearable placeholder="姓名，模糊匹配" style="width: 150px" @keyup.enter.native="onSearch" />
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="query.expressNo" clearable placeholder="反查是哪次交接带走的" style="width: 190px" @keyup.enter.native="onSearch" />
        </el-form-item>
        <el-form-item label="交接时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="yyyy-MM-dd HH:mm:ss"
            :default-time="['00:00:00', '23:59:59']"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" icon="el-icon-plus" size="small" @click="openCreate">确认交货给司机</el-button>
        <el-button icon="el-icon-warning-outline" size="small" @click="goException">
          交接异常
          <el-badge v-if="pendingExceptionCount > 0" :value="pendingExceptionCount" class="badge" />
        </el-button>
        <span class="toolbar-tip">
          货交给快递员后在这里登记，提交即把关联订单转为已发货并回写运单号；随后与承运商揽收状态自动比对，对不上会进「交接异常」。
        </span>
      </div>

      <el-table v-loading="loading" :data="list" size="small" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="交接单号" width="180" />
        <el-table-column label="仓库" width="150">
          <template slot-scope="{ row }">{{ warehouseName(row.warehouseId) }}</template>
        </el-table-column>
        <el-table-column prop="expressCompany" label="承运商" width="90">
          <template slot-scope="{ row }">{{ row.expressCompany || '—' }}</template>
        </el-table-column>
        <el-table-column label="快递员" min-width="180">
          <template slot-scope="{ row }">
            <span>{{ row.courierName || '—' }}</span>
            <span v-if="row.courierNo" class="sub-text">工号 {{ row.courierNo }}</span>
            <span v-if="row.courierPhone" class="sub-text">{{ row.courierPhone }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalOutboundNum" label="出库单数" width="90" align="center" />
        <el-table-column prop="totalPackageNum" label="总件数" width="80" align="center" />
        <el-table-column label="交接时间" width="170">
          <template slot-scope="{ row }">{{ formatDateTime(row.handoverTime) }}</template>
        </el-table-column>
        <el-table-column prop="operatorName" label="登记人" width="110">
          <template slot-scope="{ row }">{{ row.operatorName || '—' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        background
        :current-page="query.page"
        :page-size="query.limit"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </el-card>

    <!-- 详情 -->
    <el-dialog :title="`交接单详情 ${detail.code || ''}`" :visible.sync="detailVisible" width="820px">
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="仓库">{{ warehouseName(detail.warehouseId) }}</el-descriptions-item>
        <el-descriptions-item label="承运商">{{ detail.expressCompany || '—' }}</el-descriptions-item>
        <el-descriptions-item label="交接时间">{{ formatDateTime(detail.handoverTime) }}</el-descriptions-item>
        <el-descriptions-item label="快递员">{{ detail.courierName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ detail.courierNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="联系方式">{{ detail.courierPhone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="出库单数">{{ detail.totalOutboundNum || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总件数">{{ detail.totalPackageNum || 0 }}</el-descriptions-item>
        <el-descriptions-item label="登记人">{{ detail.operatorName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detail.remark || '—' }}</el-descriptions-item>
      </el-descriptions>

      <div class="section-title">交接明细</div>
      <el-table :data="detail.items || []" size="mini" border>
        <el-table-column prop="outboundCode" label="出库单号" width="200" />
        <el-table-column prop="relatedCode" label="关联订单号" width="190">
          <template slot-scope="{ row }">{{ row.relatedCode || '—' }}</template>
        </el-table-column>
        <el-table-column prop="expressNo" label="运单号" width="190">
          <template slot-scope="{ row }">{{ row.expressNo || '无运单号' }}</template>
        </el-table-column>
        <!-- 回写失败的单货已经出了、订单还挂在待发货，得在这里看得见 -->
        <el-table-column label="订单发货" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag v-if="row.deliverStatus === 1" type="success" size="mini">已发货</el-tag>
            <el-tag v-else-if="row.deliverStatus === 2" type="danger" size="mini">回写失败</el-tag>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="packageNum" label="交接件数" width="100" align="center" />
        <el-table-column label="登记时间" min-width="170">
          <template slot-scope="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <HandoverCreateDialog ref="createDialog" @success="onCreated" />
  </div>
</template>

<script>
import { handoverApi, warehouseApi } from '@/api/warehouse';
import { formatDateTime } from '../components/dateTime';
import HandoverCreateDialog from './components/HandoverCreateDialog';

export default {
  name: 'WarehouseHandover',
  components: { HandoverCreateDialog },
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      dateRange: [],
      query: {
        page: 1,
        limit: 20,
        code: '',
        warehouseId: null,
        courierName: '',
        expressNo: '',
      },
      warehouseList: [],
      detail: {},
      detailVisible: false,
      pendingExceptionCount: 0,
    };
  },
  created() {
    this.loadWarehouses();
    this.loadPage();
    this.loadExceptionCount();
  },
  methods: {
    formatDateTime,
    unwrap(res) {
      return res && (res.data !== undefined ? res.data : res);
    },
    async loadWarehouses() {
      try {
        const data = this.unwrap(await warehouseApi.page({ page: 1, limit: 200 }));
        this.warehouseList = (data && (data.list || data.records)) || [];
      } catch (e) {
        // 仅用于名称展示，拉不到不影响主流程
        this.warehouseList = [];
      }
    },
    warehouseName(id) {
      if (!id) return '—';
      const w = this.warehouseList.find((x) => String(x.id) === String(id));
      return w ? w.name : `仓库#${id}`;
    },
    async loadPage() {
      this.loading = true;
      try {
        const params = { ...this.query };
        if (this.dateRange && this.dateRange.length === 2) {
          params.handoverTimeStart = this.dateRange[0];
          params.handoverTimeEnd = this.dateRange[1];
        }
        const data = this.unwrap(await handoverApi.page(params));
        this.list = (data && (data.list || data.records)) || [];
        this.total = (data && data.total) || 0;
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    async loadExceptionCount() {
      try {
        const data = this.unwrap(await handoverApi.exceptionPendingCount({}));
        this.pendingExceptionCount = Number(data) || 0;
      } catch (e) {
        this.pendingExceptionCount = 0;
      }
    },
    openCreate() {
      this.$refs.createDialog.open(this.query.warehouseId);
    },
    onCreated() {
      this.query.page = 1;
      this.loadPage();
    },
    async openDetail(row) {
      try {
        this.detail = this.unwrap(await handoverApi.detail(row.id)) || {};
        this.detailVisible = true;
      } catch (e) {
        this.$message.error('加载详情失败: ' + (e.message || e));
      }
    },
    goException() {
      this.$router.push('/warehouse/handover-exception');
    },
    onSearch() {
      this.query.page = 1;
      this.loadPage();
    },
    onReset() {
      this.query = { page: 1, limit: 20, code: '', warehouseId: null, courierName: '', expressNo: '' };
      this.dateRange = [];
      this.loadPage();
    },
    onPageChange(p) {
      this.query.page = p;
      this.loadPage();
    },
    onSizeChange(l) {
      this.query.limit = l;
      this.query.page = 1;
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-form { margin-bottom: 4px; }
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.toolbar-tip { font-size: 12px; color: #86909c; }
.badge { margin-left: 4px; }
.sub-text { margin-left: 8px; font-size: 12px; color: #86909c; }
.section-title { margin: 16px 0 8px; font-size: 13px; font-weight: 500; color: #4e5969; }
.pager { margin-top: 14px; text-align: right; }
</style>
