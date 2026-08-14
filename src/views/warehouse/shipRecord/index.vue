<template>
  <div class="app-container">
    <!-- ============ 运单号反查 ============ -->
    <el-card shadow="never" class="trace-card">
      <div class="trace-head">
        <span class="trace-title">运单号反查</span>
        <span class="trace-tip">输入快递单号，查这单是哪个仓发的、发了什么货、谁操作的</span>
      </div>
      <div class="trace-input">
        <el-input
          v-model="waybill"
          placeholder="请输入完整快递单号"
          clearable
          style="width: 320px"
          @keyup.enter.native="doTrace"
        />
        <el-button type="primary" icon="el-icon-search" :loading="traceLoading" @click="doTrace">反查</el-button>
        <el-button v-if="traceResult" @click="traceResult = null">清空结果</el-button>
      </div>

      <div v-if="traceResult" class="trace-result">
        <el-alert
          v-if="!traceResult.found"
          type="warning"
          :closable="false"
          title="没有查到这个运单号"
          description="确认单号是否完整；若该单是「自己发货」，仓储侧不会有出库单。"
        />
        <template v-else>
          <div class="trace-section-title">发货记录</div>
          <el-table :data="traceResult.shipRecords || []" size="mini" border>
            <el-table-column prop="orderNo" label="订单号" width="190" />
            <el-table-column label="发货方式" width="100">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="row.shipSource === 'SELF' ? 'info' : 'success'">
                  {{ shipSourceText(row.shipSource) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发货仓库" width="160">
              <template slot-scope="{ row }">{{ warehouseName(row.warehouseId) }}</template>
            </el-table-column>
            <el-table-column label="快递" width="150">
              <template slot-scope="{ row }">{{ row.expressCode }} / {{ row.expressNumber }}</template>
            </el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="110" />
            <el-table-column label="发货明细" min-width="220">
              <template slot-scope="{ row }">
                <span class="items-text">{{ row.items || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="160">
              <template slot-scope="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
          </el-table>

          <div class="trace-section-title">关联订单</div>
          <el-table :data="traceResult.orders || []" size="mini" border>
            <el-table-column prop="orderNo" label="订单号" width="190" />
            <el-table-column prop="realName" label="收货人" width="110" />
            <el-table-column prop="userPhone" label="电话" width="130" />
            <el-table-column prop="userAddress" label="收货地址" min-width="240" show-overflow-tooltip />
            <el-table-column label="支付时间" width="160">
              <template slot-scope="{ row }">{{ formatDateTime(row.payTime) }}</template>
            </el-table-column>
          </el-table>

          <div class="trace-section-title">仓储出库单</div>
          <el-table :data="traceResult.outbounds || []" size="mini" border>
            <el-table-column prop="code" label="出库单号" width="190" />
            <el-table-column label="仓库" width="160">
              <template slot-scope="{ row }">{{ warehouseName(row.warehouseId) }}</template>
            </el-table-column>
            <el-table-column prop="relatedCode" label="关联单号" width="190" />
            <el-table-column prop="outboundUserName" label="出库人" width="110" />
            <el-table-column label="状态" width="90">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="row.status === 1 ? 'success' : 'info'">
                  {{ row.status === 1 ? '已出库' : '待出库' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template slot-scope="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
          </el-table>
          <div v-if="!(traceResult.outbounds || []).length" class="trace-empty">
            仓储侧没有对应出库单（自己发货的订单不经过仓储，属正常）
          </div>
        </template>
      </div>
    </el-card>

    <!-- ============ 发货记录列表 ============ -->
    <el-card shadow="never" style="margin-top: 14px">
      <el-form :inline="true" size="small" class="filter-form">
        <el-form-item label="订单号">
          <el-input v-model="query.orderNo" clearable style="width: 190px" @keyup.enter.native="onSearch" />
        </el-form-item>
        <el-form-item label="快递单号">
          <el-input v-model="query.expressNumber" clearable style="width: 190px" @keyup.enter.native="onSearch" />
        </el-form-item>
        <el-form-item label="发货方式">
          <el-select v-model="query.shipSource" clearable placeholder="全部" style="width: 130px">
            <el-option label="仓储发货" value="WAREHOUSE" />
            <el-option label="自己发货" value="SELF" />
          </el-select>
        </el-form-item>
        <el-form-item label="发货仓库">
          <el-select v-model="query.warehouseId" clearable filterable placeholder="全部" style="width: 180px">
            <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓储纳管">
          <el-select v-model="query.wmsManaged" clearable placeholder="全部" style="width: 110px">
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="发货时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="yyyy-MM-dd HH:mm:ss"
            :default-time="['00:00:00', '23:59:59']"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" size="small" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="orderNo" label="订单号" width="190" />
        <el-table-column label="动作" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.action === 'TRANSFER' ? 'warning' : 'primary'">
              {{ actionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发货方式" width="100">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.shipSource === 'SELF' ? 'info' : 'success'">
              {{ shipSourceText(row.shipSource) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发货仓库" width="160">
          <template slot-scope="{ row }">
            <span v-if="row.fromWarehouseId">
              {{ warehouseName(row.fromWarehouseId) }} → {{ warehouseName(row.warehouseId) }}
            </span>
            <span v-else>{{ warehouseName(row.warehouseId) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="快递单号" width="200">
          <template slot-scope="{ row }">
            <span v-if="row.expressNumber">
              {{ row.expressCode }} / {{ row.expressNumber }}
              <el-button type="text" size="mini" @click="traceFromRow(row)">反查</el-button>
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="拆单" width="70">
          <template slot-scope="{ row }">{{ row.isSplit ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="纳管" width="70">
          <template slot-scope="{ row }">{{ row.wmsManaged ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="110" />
        <el-table-column label="发货明细" min-width="200">
          <template slot-scope="{ row }">
            <span class="items-text">{{ row.items || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发货时间" width="160">
          <template slot-scope="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 14px; text-align: right"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="query.page"
        :page-size="query.limit"
        :page-sizes="[20, 50, 100]"
        :total="total"
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </el-card>
  </div>
</template>

<script>
import { orderShipRecordListApi, waybillTraceApi } from '@/api/order';
import { warehouseApi } from '@/api/warehouse';
import { formatDateTime } from '../components/dateTime';

export default {
  name: 'WarehouseShipRecord',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      dateRange: [],
      query: {
        page: 1,
        limit: 20,
        orderNo: '',
        expressNumber: '',
        shipSource: '',
        warehouseId: null,
        wmsManaged: '',
      },
      warehouseList: [],
      waybill: '',
      traceLoading: false,
      traceResult: null,
    };
  },
  created() {
    this.loadWarehouses();
    this.loadPage();
  },
  methods: {
    formatDateTime,
    async loadWarehouses() {
      try {
        const res = await warehouseApi.page({ page: 1, limit: 200 });
        const data = res && (res.data !== undefined ? res.data : res);
        this.warehouseList = (data && (data.list || data.records)) || [];
      } catch (e) {
        // 仓库列表只用于筛选和名称展示，拉不到不影响主流程
        this.warehouseList = [];
      }
    },
    warehouseName(id) {
      if (!id) return '—';
      const w = this.warehouseList.find((x) => String(x.id) === String(id));
      return w ? w.name : `仓库#${id}`;
    },
    shipSourceText(s) {
      return { WAREHOUSE: '仓储发货', SELF: '自己发货', NONE: '无需发货' }[s] || s || '—';
    },
    actionText(a) {
      return { SEND: '发货', TRANSFER: '改仓', SPLIT: '拆单' }[a] || a || '—';
    },
    async loadPage() {
      this.loading = true;
      try {
        const params = { ...this.query };
        if (params.wmsManaged === '') delete params.wmsManaged;
        if (this.dateRange && this.dateRange.length === 2) {
          params.dateLimit = `${this.dateRange[0]},${this.dateRange[1]}`;
        }
        const res = await orderShipRecordListApi(params);
        const data = res && (res.data !== undefined ? res.data : res);
        this.list = (data && (data.list || data.records)) || [];
        this.total = (data && data.total) || 0;
      } catch (e) {
        this.$message.error('加载失败: ' + (e.message || e));
      } finally {
        this.loading = false;
      }
    },
    async doTrace() {
      if (!this.waybill) return this.$message.warning('请输入快递单号');
      this.traceLoading = true;
      try {
        const res = await waybillTraceApi(this.waybill.trim());
        this.traceResult = res && (res.data !== undefined ? res.data : res);
      } catch (e) {
        this.$message.error('反查失败: ' + (e.message || e));
      } finally {
        this.traceLoading = false;
      }
    },
    traceFromRow(row) {
      this.waybill = row.expressNumber;
      this.doTrace();
    },
    onSearch() {
      this.query.page = 1;
      this.loadPage();
    },
    onReset() {
      this.query = { page: 1, limit: 20, orderNo: '', expressNumber: '', shipSource: '', warehouseId: null, wmsManaged: '' };
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
.trace-card >>> .el-card__body { padding: 16px 18px; }
.trace-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; }
.trace-title { font-size: 16px; font-weight: 500; }
.trace-tip { font-size: 12px; color: #86909c; }
.trace-input { display: flex; align-items: center; gap: 10px; }
.trace-result { margin-top: 16px; }
.trace-section-title { margin: 14px 0 8px; font-size: 13px; font-weight: 500; color: #4e5969; }
.trace-empty { margin-top: 6px; font-size: 12px; color: #a8abb2; }
.items-text { font-size: 12px; color: #606266; word-break: break-all; }
.filter-form { margin-bottom: 4px; }
</style>
