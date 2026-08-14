<template>
  <div class="app-container">
    <el-card class="sync-card" shadow="never">
      <el-alert class="sync-alert" type="warning" :closable="false" show-icon
                title="仓储同步异常：商城和仓储两个服务之间没对上账" style="margin-bottom:14px">
        <div class="alert-body">
          <div>· <b>售后退货入库</b>：商家确认收货、钱已经退了，但退回的货没同步进仓储库存 —— 可一键重试</div>
          <div>· <b>订单发货出库</b>：商城已发货、物流单已下，但仓储库存没扣 —— 只能人工核对</div>
          <div class="alert-note">
            主流程（发货、退款）不会因为同步失败而回滚：钱和物流已经动了，回滚代价更大。
            这里的每一条都代表<b>一笔账实不符</b>，不处理会一直存在，只能靠盘点冲掉。
          </div>
        </div>
      </el-alert>

      <el-form :inline="true" size="small" class="filter-form">
        <el-form-item label="业务单号">
          <el-input v-model="query.bizNo" clearable placeholder="售后单号/订单号" style="width:200px" @keyup.enter.native="onSearch" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.bizType" clearable placeholder="全部" style="width:170px" @change="onSearch">
            <el-option label="售后退货入库" value="REFUND_INBOUND" />
            <el-option label="订单发货出库" value="ORDER_SHIP" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width:120px" @change="onSearch">
            <el-option label="待处理" :value="0" />
            <el-option label="已处理" :value="1" />
            <el-option label="已忽略" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button type="success" icon="el-icon-refresh" :loading="batchRetrying" @click="onBatchRetry">
            批量重试退货入库
          </el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list" size="small" border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="类型" width="130">
          <template slot-scope="{row}">
            <el-tag size="mini" :type="row.bizType === 'REFUND_INBOUND' ? 'warning' : 'danger'">
              {{ bizTypeMap[row.bizType] || row.bizType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bizNo" label="业务单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="merId" label="商户" width="80" align="center">
          <template slot-scope="{row}">{{ row.merId || '-' }}</template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="失败原因" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template slot-scope="{row}">
            <el-tag size="mini" :type="statusTagType(row.status)">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理" min-width="170" show-overflow-tooltip>
          <template slot-scope="{row}">
            <span v-if="row.handleUser">{{ row.handleUser }} · {{ row.handleRemark || '-' }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="160">
          <template slot-scope="{row}">{{ shortTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template slot-scope="{row}">
            <el-button type="text" @click="openDetail(row)">详情</el-button>
            <!-- 只有退货入库能一键重试：发货出库在仓储侧没有幂等键，重放会二次扣库存 -->
            <el-button
              v-if="row.status === 0 && row.bizType === 'REFUND_INBOUND'"
              type="text" :loading="retryingId === row.id" @click="onRetry(row)"
            >重试</el-button>
            <el-button v-if="row.status === 0" type="text" @click="onHandle(row, 1)">标记已处理</el-button>
            <el-button v-if="row.status === 0" type="text" class="danger-text" @click="onHandle(row, 2)">忽略</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top:16px;text-align:right"
        :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
        layout="total, prev, pager, next" @current-change="load"
      />
    </el-card>

    <!-- 详情：主要是看 payload，人工补录时要照着它建单 -->
    <el-dialog :title="`同步异常 #${current.id || ''}`" :visible.sync="detailVisible" width="760px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="类型">{{ bizTypeMap[current.bizType] || current.bizType }}</el-descriptions-item>
        <el-descriptions-item label="业务单号">{{ current.bizNo }}</el-descriptions-item>
        <el-descriptions-item label="商户ID">{{ current.merId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusMap[current.status] }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ shortTime(current.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ shortTime(current.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="失败原因" :span="2">
          <div class="err-box">{{ current.errorMsg || '-' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="请求内容" :span="2">
          <pre class="payload-box">{{ prettyPayload }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer">
        <el-button size="small" @click="detailVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { syncFailApi } from '@/api/warehouse';

export default {
  name: 'WarehouseSyncFail',
  data() {
    return {
      loading: false, batchRetrying: false, retryingId: null,
      list: [], total: 0,
      query: { page: 1, limit: 20, bizNo: '', bizType: null, status: 0 },
      bizTypeMap: { REFUND_INBOUND: '售后退货入库', ORDER_SHIP: '订单发货出库' },
      statusMap: { 0: '待处理', 1: '已处理', 2: '已忽略' },
      detailVisible: false, current: {},
    };
  },
  computed: {
    prettyPayload() {
      if (!this.current.payload) return '-';
      try { return JSON.stringify(JSON.parse(this.current.payload), null, 2); }
      catch (e) { return this.current.payload; }
    },
  },
  created() { this.load(); },
  methods: {
    shortTime(t) { return t ? String(t).replace('T', ' ').substring(0, 19) : '-'; },
    statusTagType(s) { return ({ 0: 'danger', 1: 'success', 2: 'info' })[s] || 'info'; },
    async load() {
      this.loading = true;
      try {
        const r = await syncFailApi.page(this.query);
        this.list = (r && r.records) || (r && r.list) || [];
        // 后端为避免 Long 精度丢失会把分页总数序列化成字符串，分页组件要求 Number。
        const total = Number(r && r.total);
        this.total = Number.isFinite(total) ? total : 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.load(); },
    onReset() { this.query = { page: 1, limit: 20, bizNo: '', bizType: null, status: 0 }; this.load(); },
    openDetail(row) { this.current = row; this.detailVisible = true; },
    async onRetry(row) {
      this.retryingId = row.id;
      try {
        const code = await syncFailApi.retry(row.id, this.operator());
        this.$message.success(`重试成功，入库单 ${code}`);
        this.load();
      } finally { this.retryingId = null; }
    },
    async onBatchRetry() {
      await this.$confirm('将重试全部待处理的「售后退货入库」记录。仓储侧按售后单号幂等，不会重复入库。继续?', '确认', { type: 'warning' });
      this.batchRetrying = true;
      try {
        const r = await syncFailApi.retryAll();
        this.$message.success(r || '已触发批量重试');
        this.load();
      } finally { this.batchRetrying = false; }
    },
    async onHandle(row, status) {
      const title = status === 1 ? '标记已处理' : '忽略';
      const { value } = await this.$prompt(`请输入${title}备注`, title, { inputPattern: /.+/, inputErrorMessage: '不能为空' });
      await syncFailApi.handle(row.id, status, value, this.operator());
      this.$message.success('已更新');
      this.load();
    },
    operator() {
      const u = this.$store.getters.userInfo || {};
      return u.realName || u.account || this.$store.getters.name || 'admin';
    },
  },
};
</script>

<style scoped>
.sync-card { border: none; }
.alert-body { font-size: 12px; line-height: 20px; }
.alert-note { margin-top: 4px; color: #86909c; }
.filter-form { margin-bottom: 4px; }
.danger-text { color: #f56c6c; }
.err-box { max-height: 90px; overflow-y: auto; color: #f56c6c; word-break: break-all; }
.payload-box {
  max-height: 240px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
