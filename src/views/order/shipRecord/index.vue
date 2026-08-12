<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="订单号">
        <el-input v-model="query.orderNo" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="动作">
        <el-select v-model="query.action" clearable placeholder="全部" style="width:120px" @change="onSearch">
          <el-option label="发货" value="SHIP" />
          <el-option label="改仓" value="TRANSFER" />
        </el-select>
      </el-form-item>
      <el-form-item label="发货来源">
        <el-select v-model="query.shipSource" clearable placeholder="全部" style="width:140px" @change="onSearch">
          <el-option label="仓储发货" value="warehouse" />
          <el-option label="自己发货" value="self" />
        </el-select>
      </el-form-item>
      <el-form-item label="纳管商品">
        <el-select v-model="query.wmsManaged" clearable placeholder="全部" style="width:120px" @change="onSearch">
          <el-option label="含纳管" :value="true" />
          <el-option label="不含" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          value-format="yyyy-MM-dd HH:mm:ss"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width:340px"
          @change="onSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert type="info" :closable="false" style="margin-bottom:12px">
      「自己发货」表示商户未走仓储履约，该笔发货不会扣减仓库库存。排查库存差异时优先看这类记录。
    </el-alert>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="orderNo" label="订单号" width="190" show-overflow-tooltip />
      <el-table-column label="动作" width="90">
        <template slot-scope="{ row }">
          <el-tag :type="row.action === 'TRANSFER' ? 'warning' : 'info'" size="mini">
            {{ row.action === 'TRANSFER' ? '改仓' : '发货' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发货来源" width="110">
        <template slot-scope="{ row }">
          <el-tag :type="row.shipSource === 'self' ? 'danger' : 'success'" size="mini">
            {{ row.shipSource === 'self' ? '自己发货' : '仓储发货' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="仓库" width="200">
        <template slot-scope="{ row }">
          <span v-if="row.action === 'TRANSFER'">
            {{ warehouseText(row.fromWarehouseId) }} → <b>{{ warehouseText(row.warehouseId) }}</b>
          </span>
          <span v-else>{{ row.warehouseId ? warehouseText(row.warehouseId) : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="纳管" width="80">
        <template slot-scope="{ row }">
          <el-tag v-if="row.wmsManaged" type="warning" size="mini">含</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="发货明细" min-width="240">
        <template slot-scope="{ row }">
          <div v-if="parseItems(row.items).length">
            <div v-for="(it, i) in parseItems(row.items)" :key="i" class="item-line">
              {{ it.goodsName || it.productId }} × {{ it.num }}
            </div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="快递" width="160">
        <template slot-scope="{ row }">
          <span v-if="row.expressNumber">{{ row.expressCode }} / {{ row.expressNumber }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="拆单" width="70">
        <template slot-scope="{ row }">{{ row.isSplit ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="operatorName" label="操作人" width="110" />
      <el-table-column prop="remark" label="备注/原因" min-width="150" show-overflow-tooltip />
      <el-table-column label="时间" width="160">
        <template slot-scope="{ row }">
          {{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}
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
  </div>
</template>

<script>
import { orderShipRecordListApi } from '@/api/order';
import { warehouseApi } from '@/api/warehouse';

export default {
  name: 'OrderShipRecord',
  data() {
    return {
      loading: false,
      total: 0,
      tableData: [],
      warehouseList: [],
      dateRange: null,
      query: { page: 1, limit: 20, orderNo: '', action: null, shipSource: null, wmsManaged: null },
    };
  },
  created() {
    this.loadWarehouses();
    this.loadPage();
  },
  methods: {
    warehouseText(id) {
      if (!id) return '-';
      const w = this.warehouseList.find((x) => x.id === id);
      return w ? `${w.code} / ${w.name}` : id;
    },
    // items 是后端存的 JSON 字符串，解析失败不该让整行渲染崩掉
    parseItems(items) {
      if (!items) return [];
      try {
        const arr = JSON.parse(items);
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        return [];
      }
    },
    async loadWarehouses() {
      try {
        const r = await warehouseApi.page({ page: 1, limit: 999 });
        this.warehouseList = (r && r.list) || [];
      } catch (e) {
        /* 仓库名拿不到就显示 ID，不阻断列表 */
      }
    },
    async loadPage() {
      this.loading = true;
      try {
        const params = { ...this.query };
        if (this.dateRange && this.dateRange.length === 2) {
          params.dateLimit = `${this.dateRange[0]},${this.dateRange[1]}`;
        }
        const res = await orderShipRecordListApi(params);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally {
        this.loading = false;
      }
    },
    onSearch() {
      this.query.page = 1;
      this.loadPage();
    },
    onReset() {
      this.query = { page: 1, limit: 20, orderNo: '', action: null, shipSource: null, wmsManaged: null };
      this.dateRange = null;
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.item-line {
  color: #606266;
  font-size: 12px;
  line-height: 1.6;
}
</style>
