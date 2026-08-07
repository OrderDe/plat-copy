<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="单号"><el-input v-model="query.code" clearable @keyup.enter.native="onSearch" /></el-form-item>
      <el-form-item label="仓库">
        <el-select v-model="query.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="onSearch">
          <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option v-for="(v,k) in statusMap" :key="k" :label="v" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="复核单号" width="200" />
      <el-table-column prop="pickOrderCode" label="拣货单" width="240" />
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}"><el-tag :type="statusType(row.status)" size="mini">{{ statusMap[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="reviewerName" label="复核员" width="120" />
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openReview(row)">复核</el-button>
          <el-button v-if="row.status===1" type="text" style="color:#67c23a" @click="onCreatePackage(row)">一键装箱</el-button>
          <el-button v-if="row.status===0" type="text" class="danger-text" @click="onReject(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="loadPage"
    />

    <!-- 复核鎵ц -->
    <el-dialog :title="`复核 ${detail.code||''}`" :visible.sync="reviewVisible" width="1080px">
      <div style="margin-bottom:12px">
        <b>拣货单：</b>{{ detail.pickOrderCode }} · <b>状态：</b>{{ statusMap[detail.status] }} · <b>复核员：</b>{{ detail.reviewerName || '-' }}
      </div>
      <el-table :data="detail.items || []" border size="small" max-height="500">
        <el-table-column type="index" width="40" />
        <el-table-column prop="goodsName" label="商品" min-width="160" />
        <el-table-column prop="productId" label="商品ID" width="90" />
        <el-table-column label="拣货" width="90"><template slot-scope="{row}">{{ row.pickedNum }}</template></el-table-column>
        <el-table-column label="复核实测" width="140">
          <template slot-scope="{row}">
            <el-input-number v-model="row.reviewedNum" :min="0" size="mini" controls-position="right" :disabled="detail.status !== 0" />
          </template>
        </el-table-column>
        <el-table-column label="差异" width="80">
          <template slot-scope="{row}">
            <span :class="diffClass(row)">{{ (row.reviewedNum||0) - (row.pickedNum||0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80"><template slot-scope="{row}">{{ ({ 0: '未检', 1: '通过', 2: '差异' })[row.status] }}</template></el-table-column>
      </el-table>
      <div slot="footer">
        <el-button size="small" @click="reviewVisible=false">关闭</el-button>
        <el-button v-if="detail.status===0" type="primary" size="small" @click="onFillAll">按拣货数填满</el-button>
        <el-button v-if="detail.status===0" type="primary" size="small" @click="onConfirmReview">通过复核 (扣库存)</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { reviewApi, warehouseApi, packageApi } from '@/api/warehouse';

export default {
  name: 'WarehouseReview',
  data() {
    return {
      loading: false, total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, code: '', warehouseId: null, status: null },
      statusMap: { 0: '待复核', 1: '已通过', 2: '差异/驳回', 3: '已作废' },
      reviewVisible: false, detail: {},
    };
  },
  created() { this.loadWarehouses(); this.loadPage(); },
  methods: {
    statusType(s) { return ({ 0: 'info', 1: 'success', 2: 'danger', 3: 'info' })[s] || ''; },
    diffClass(r) { const d = (r.reviewedNum||0)-(r.pickedNum||0); return d===0?'':(d>0?'plus':'minus'); },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async loadPage() { this.loading = true; try { const r = await reviewApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; } finally { this.loading = false; } },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, status: null }; this.loadPage(); },
    async openReview(row) { this.detail = await reviewApi.detail(row.id) || {}; if (!this.detail.items) this.detail.items = []; this.reviewVisible = true; },
    onFillAll() { (this.detail.items || []).forEach(i => { i.reviewedNum = i.pickedNum || 0; }); },
    async onConfirmReview() {
      const hasDiff = (this.detail.items || []).some(i => (i.reviewedNum || 0) !== (i.pickedNum || 0));
      if (hasDiff) {
        await this.$confirm('存在数量差异，仍确认通过?', '提示', { type: 'warning' });
      }
      const map = {};
      (this.detail.items || []).forEach(i => { map[i.id] = i.reviewedNum == null ? 0 : i.reviewedNum; });
      await reviewApi.confirm(this.detail.id, map);
      this.$message.success('复核通过锛屽嚭搴撳崟已生效');
      this.reviewVisible = false;
      this.loadPage();
    },
    async onCreatePackage(row) {
      await this.$confirm(`按复核实测数量为「?{row.code}」生成待封箱包裹，继续?`, '确认', { type: 'warning' });
      const id = await packageApi.createFromReview(row.id, {});
      this.$message.success(`已生成包裹 ID=${id}，请到"装箱管理"填写尺寸重量并封箱`);
      this.$router.push({ path: '/warehouse/package', query: { packageId: id } });
    },
    async onReject(row) {
      const { value } = await this.$prompt('请输入驳回原因', '驳回', { inputPattern: /.+/, inputErrorMessage: '不能为空' });
      await reviewApi.reject(row.id, value);
      this.$message.success('已驳回');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.plus { color: #67c23a; font-weight: bold; }
.minus { color: #f56c6c; font-weight: bold; }
</style>
