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

    <el-table v-loading="loading" :data="tableData" border stripe size="small">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="复核单号" min-width="200" show-overflow-tooltip />
      <el-table-column prop="pickOrderCode" label="拣货单" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}"><el-tag :type="statusType(row.status)" size="mini">{{ statusMap[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="reviewerName" label="复核员" min-width="120" show-overflow-tooltip />
      <el-table-column label="创建时间" min-width="170">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right" align="center">
        <template slot-scope="{row}">
          <!-- 只有待复核能操作，其余状态弹窗是只读的，按钮改叫「明细」避免误以为还能改 -->
          <el-button type="text" @click="openReview(row)">{{ row.status === 0 ? '复核' : '明细' }}</el-button>
          <el-button v-if="row.status===0" type="text" class="danger-text" @click="onReject(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="loadPage"
    />

    <!-- 复核执行 -->
    <el-dialog :title="`${detail.status === 0 ? '复核' : '复核明细'} ${detail.code||''}`" :visible.sync="reviewVisible" width="1080px">
      <div style="margin-bottom:12px">
        <b>拣货单：</b>{{ detail.pickOrderCode }} · <b>状态：</b>{{ statusMap[detail.status] }} · <b>复核员：</b>{{ detail.reviewerName || '-' }}
      </div>
      <el-alert v-if="detail.status !== 0" type="info" :closable="false" style="margin-bottom:10px">
        该复核单已{{ statusMap[detail.status] }}，以下为复核结果，仅供查看。
      </el-alert>
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
import { reviewApi, warehouseApi } from '@/api/warehouse';

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
      const u = this.$store.getters.userInfo || {};
      await reviewApi.confirm(this.detail.id, map, {
        reviewerId: u.id,
        reviewerName: u.realName || u.account || this.$store.getters.name,
      });
      this.reviewVisible = false;
      this.loadPage();
      this.notifyShipInfo(this.detail.id);
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
