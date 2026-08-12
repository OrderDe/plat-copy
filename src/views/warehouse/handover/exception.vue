<template>
  <div class="app-container">
    <el-card class="exception-card" shadow="never">
      <el-alert class="exception-alert" type="warning" :closable="false" show-icon title="交接异常：人工交接记录与承运商揽收状态对不上" style="margin-bottom: 14px">
        <div class="alert-body">
          <div>· <b>已交接但未揽收</b>：登记了交接，但承运商迟迟没有揽收记录 —— 货可能没被真正带走</div>
          <div>· <b>已揽收但无交接记录</b>：承运商说取走了，系统里没人登记 —— 疑似漏登记</div>
          <div>· <b>出库超时未交接</b>：出库已生效（库存已扣）但既无交接也无揽收 —— 货可能仍压在仓内</div>
          <div class="alert-note">系统只提醒、不自动改数据：两侧谁对谁错需要人工判断后处置。</div>
        </div>
      </el-alert>

      <el-form :inline="true" size="small" class="filter-form">
        <el-form-item label="出库单号">
          <el-input v-model="query.outboundCode" clearable style="width: 180px" @keyup.enter.native="onSearch" />
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="query.expressNo" clearable style="width: 180px" @keyup.enter.native="onSearch" />
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="query.warehouseId" clearable filterable placeholder="全部" style="width: 170px">
            <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="query.type" clearable placeholder="全部" style="width: 190px">
            <el-option label="已交接但承运商未揽收" :value="1" />
            <el-option label="已揽收但无交接记录" :value="2" />
            <el-option label="出库超时未交接" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="待处理" :value="0" />
            <el-option label="已处理" :value="1" />
            <el-option label="已忽略" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button icon="el-icon-refresh" :loading="scanning" @click="doScan">立即比对</el-button>
        </el-form-item>
      </el-form>

      <el-table class="exception-table" v-loading="loading" :data="list" size="small" border>
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column label="异常类型" width="180">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="typeTagType(row.type)">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="outboundCode" label="出库单号" width="180" />
        <el-table-column prop="expressNo" label="运单号" width="180">
          <template slot-scope="{ row }">{{ row.expressNo || '—' }}</template>
        </el-table-column>
        <el-table-column prop="relatedCode" label="关联订单号" width="180">
          <template slot-scope="{ row }">{{ row.relatedCode || '—' }}</template>
        </el-table-column>
        <el-table-column label="仓库" width="140">
          <template slot-scope="{ row }">{{ warehouseName(row.warehouseId) }}</template>
        </el-table-column>
        <el-table-column label="异常说明" min-width="360" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span class="exception-detail">{{ formatExceptionDetail(row.detail) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理信息" min-width="220" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="row.status === 0" class="text-muted">—</span>
            <span v-else class="handle-summary">{{ row.handlerName || '—' }}：{{ row.handleRemark || '无说明' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发现时间" width="170">
          <template slot-scope="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right" align="center">
          <template slot-scope="{ row }">
            <template v-if="row.status === 0">
              <div class="exception-actions">
                <el-button class="exception-action exception-action--handle" type="primary" plain size="mini" icon="el-icon-edit-outline" @click="openHandle(row, 1)">处理</el-button>
                <el-button class="exception-action exception-action--ignore" type="warning" plain size="mini" icon="el-icon-warning-outline" @click="openHandle(row, 2)">忽略</el-button>
              </div>
            </template>
            <el-tag v-else size="mini" type="info">已处置</el-tag>
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

    <el-dialog custom-class="handover-exception-dialog" :title="handleForm.status === 2 ? '忽略该异常' : '处理该异常'" :visible.sync="handleVisible" width="600px">
      <el-form class="handle-form" size="small" label-width="90px">
        <el-form-item label="出库单号">
          <span class="dialog-code">{{ handleForm.outboundCode }}</span>
        </el-form-item>
        <el-form-item class="detail-form-item" label="异常说明">
          <div class="detail-text">{{ formatExceptionDetail(handleForm.detail) }}</div>
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="handleForm.handlerName" placeholder="选填，默认当前账号" />
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="handleForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="handleForm.status === 2 ? '为什么可以忽略，如「已确认为承运商轨迹延迟」' : '如何处置的，如「已联系快递员补揽收」'"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="handleVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="submitting" @click="submitHandle">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { handoverApi, warehouseApi } from '@/api/warehouse';
import { formatDateTime } from '../components/dateTime';

export default {
  name: 'WarehouseHandoverException',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      scanning: false,
      submitting: false,
      query: {
        page: 1,
        limit: 20,
        outboundCode: '',
        expressNo: '',
        warehouseId: null,
        type: null,
        status: null,
      },
      warehouseList: [],
      handleVisible: false,
      handleForm: { id: null, status: 1, outboundCode: '', detail: '', handlerName: '', remark: '' },
    };
  },
  created() {
    this.loadWarehouses();
    this.loadPage();
  },
  methods: {
    formatDateTime,
    formatExceptionDetail(value) {
      if (!value) return '—';
      return String(value)
        .replace(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
    },
    unwrap(res) {
      return res && (res.data !== undefined ? res.data : res);
    },
    async loadWarehouses() {
      try {
        const data = this.unwrap(await warehouseApi.page({ page: 1, limit: 200 }));
        this.warehouseList = (data && (data.list || data.records)) || [];
      } catch (e) {
        this.warehouseList = [];
      }
    },
    warehouseName(id) {
      if (!id) return '—';
      const w = this.warehouseList.find((x) => String(x.id) === String(id));
      return w ? w.name : `仓库#${id}`;
    },
    typeText(t) {
      return { 1: '已交接但未揽收', 2: '已揽收但无交接记录', 3: '出库超时未交接' }[t] || `未知(${t})`;
    },
    typeTagType(t) {
      return { 1: 'danger', 2: 'warning', 3: 'warning' }[t] || 'info';
    },
    statusText(s) {
      return { 0: '待处理', 1: '已处理', 2: '已忽略' }[s] || '—';
    },
    statusTagType(s) {
      return { 0: 'danger', 1: 'success', 2: 'info' }[s] || 'info';
    },
    async loadPage() {
      this.loading = true;
      try {
        const params = { ...this.query };
        if (params.type === null || params.type === '') delete params.type;
        if (params.status === null || params.status === '') delete params.status;
        const data = this.unwrap(await handoverApi.exceptionPage(params));
        this.list = (data && (data.list || data.records)) || [];
        this.total = (data && data.total) || 0;
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    async doScan() {
      this.scanning = true;
      try {
        const data = this.unwrap(await handoverApi.exceptionScan());
        const n = Number(data) || 0;
        this.$message.success(n > 0 ? `比对完成，新增 ${n} 条异常` : '比对完成，没有新的异常');
        this.loadPage();
      } catch (e) {
        this.$message.error('比对失败: ' + (e.message || e));
      } finally {
        this.scanning = false;
      }
    },
    openHandle(row, status) {
      const name = (this.$store && this.$store.getters && this.$store.getters.name) || '';
      this.handleForm = {
        id: row.id,
        status,
        outboundCode: row.outboundCode,
        detail: row.detail,
        handlerName: name,
        remark: '',
      };
      this.handleVisible = true;
    },
    async submitHandle() {
      this.submitting = true;
      try {
        await handoverApi.exceptionHandle({
          id: this.handleForm.id,
          status: this.handleForm.status,
          remark: this.handleForm.remark,
          handlerName: this.handleForm.handlerName,
        });
        this.$message.success('处置成功');
        this.handleVisible = false;
        this.loadPage();
      } catch (e) {
        this.$message.error('处置失败: ' + (e.message || e));
      } finally {
        this.submitting = false;
      }
    },
    onSearch() {
      this.query.page = 1;
      this.loadPage();
    },
    onReset() {
      this.query = { page: 1, limit: 20, outboundCode: '', expressNo: '', warehouseId: null, type: null, status: null };
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
.exception-card { border-radius: 8px; }
.exception-alert { border-radius: 6px; }
.filter-form { margin-bottom: 4px; }
.alert-body { font-size: 12px; line-height: 21px; }
.alert-note { margin-top: 5px; color: #86909c; }
.exception-detail,
.handle-summary { color: #4e5969; line-height: 1.6; word-break: break-word; }
.detail-text { max-height: 150px; overflow-y: auto; padding: 10px 12px; color: #4e5969; line-height: 1.8; white-space: pre-wrap; word-break: break-word; background: #f7f8fa; border: 1px solid #e5e6eb; border-radius: 4px; }
.dialog-code { color: #1d2129; font-weight: 600; font-family: Consolas, 'SFMono-Regular', monospace; }
.text-muted { color: #a8abb2; }
.pager { margin-top: 14px; text-align: right; }
.exception-actions { display: flex; justify-content: center; gap: 8px; }
.exception-action { min-width: 66px; margin: 0 !important; padding: 6px 9px; border-radius: 5px; transition: transform 0.18s ease, box-shadow 0.18s ease; }
.exception-action:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(31, 45, 61, 0.12); }
.exception-action:active { transform: translateY(0); }
</style>

<style>
.handover-exception-dialog .el-dialog__body { padding: 18px 28px 8px; }
.handover-exception-dialog .el-form-item { margin-bottom: 18px; }
.handover-exception-dialog .detail-form-item .el-form-item__content { line-height: 1.8; }
</style>
