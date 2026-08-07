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
      <el-table-column prop="code" label="拣货单号" width="240" />
      <el-table-column prop="waveCode" label="波次" width="180" />
      <el-table-column prop="outboundCode" label="出库单" width="180" />
      <el-table-column label="状态" width="100">
        <template slot-scope="{row}"><el-tag :type="statusType(row.status)" size="mini">{{ statusMap[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="pickerName" label="拣货员" width="120" />
      <el-table-column prop="pickStartTime" label="开始时间" width="160" />
      <el-table-column prop="pickFinishTime" label="完成时间" width="160" />
      <el-table-column label="操作" width="260" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openPick(row)">拣货</el-button>
          <el-button type="text" @click="onPrint(row)">打印</el-button>
          <el-button v-if="row.status===0" type="text" @click="openAssign(row)">指派</el-button>
          <el-button v-if="row.status===2" type="text" @click="onCreateReview(row)">生成复核单</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="loadPage"
    />

    <!-- 指派 -->
    <el-dialog title="指派拣货员" :visible.sync="assignVisible" width="440px">
      <el-form label-width="90px" size="small">
        <el-form-item label="拣货单">{{ current.code }}</el-form-item>
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
    <el-dialog :title="`拣货 ${detail.code||''}`" :visible.sync="pickVisible" width="1080px">
      <div style="margin-bottom:12px">
        <b>出库单：</b>{{ detail.outboundCode }} · <b>状态：</b>{{ statusMap[detail.status] }} · <b>拣货员：</b>{{ detail.pickerName || '未指派' }}
      </div>
      <el-alert type="success" :closable="false" style="margin-bottom:10px">
        明细已按<b>库位路径顺序</b>（层 → 行 → 列）排列，请依序拣货以减少行走距离。
      </el-alert>
      <el-table :data="detail.items || []" border size="small" max-height="500">
        <el-table-column label="序" width="45">
          <template slot-scope="{$index}"><b class="step">{{ $index + 1 }}</b></template>
        </el-table-column>
        <el-table-column prop="goodsName" label="商品" min-width="160" />
        <el-table-column prop="productId" label="商品ID" width="80" />
        <el-table-column prop="locationCode" label="库位" width="130">
          <template slot-scope="{row}"><b class="loc">{{ row.locationCode || '通用池' }}</b></template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" width="150" />
        <el-table-column label="应拣" width="80"><template slot-scope="{row}"><b>{{ row.planNum }}</b></template></el-table-column>
        <el-table-column label="实拣" width="140">
          <template slot-scope="{row}">
            <el-input-number v-model="row.pickedNum" :min="0" :max="row.planNum" size="mini" controls-position="right" :disabled="detail.status >= 2" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{row}">{{ ({ 0: '待拣', 1: '已拣', 2: '跳过' })[row.status] }}</template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button size="small" @click="pickVisible=false">关闭</el-button>
        <el-button v-if="detail.status < 2" type="primary" size="small" @click="onFillAll">按应拣填满</el-button>
        <el-button v-if="detail.status < 2" type="primary" size="small" @click="onConfirmPick">确认拣货</el-button>
      </div>
    </el-dialog>

    <user-picker-dialog ref="userPicker" />
  </div>
</template>

<script>
import { pickApi, reviewApi, warehouseApi } from '@/api/warehouse';
import UserPickerDialog from '../components/UserPickerDialog.vue';
import { doPrint } from '../components/printUtil';

export default {
  name: 'WarehousePick',
  components: { UserPickerDialog },
  data() {
    return {
      loading: false, total: 0, tableData: [], warehouseList: [],
      query: { page: 1, limit: 20, code: '', warehouseId: null, status: null },
      statusMap: { 0: '待拣', 1: '拣货中', 2: '已拣完', 3: '已复核', 4: '已作废' },
      current: {},
      assignVisible: false, assignForm: { pickerId: null, pickerName: '' },
      pickVisible: false, detail: {},
    };
  },
  created() { this.loadWarehouses(); this.loadPage(); },
  methods: {
    statusType(s) { return ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'success', 4: 'danger' })[s] || ''; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async loadPage() { this.loading = true; try { const r = await pickApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; } finally { this.loading = false; } },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, code: '', warehouseId: null, status: null }; this.loadPage(); },
    openAssign(row) { this.current = row; this.assignForm = { pickerId: null, pickerName: '' }; this.assignVisible = true; },
    async pickUser() {
      const u = await this.$refs.userPicker.open();
      if (!u) return;
      this.assignForm.pickerId = u.uid != null ? u.uid : u.id;
      this.assignForm.pickerName = u.nickname || u.username || u.phone || '';
    },
    async onAssignSubmit() {
      if (!this.assignForm.pickerId) return this.$message.warning('请选择拣货员');
      await pickApi.assign(this.current.id, this.assignForm.pickerId, this.assignForm.pickerName);
      this.$message.success('已指派'); this.assignVisible = false; this.loadPage();
    },
    async openPick(row) {
      this.detail = await pickApi.detail(row.id) || {};
      if (!this.detail.items) this.detail.items = [];
      this.pickVisible = true;
    },
    onFillAll() { (this.detail.items || []).forEach(i => { i.pickedNum = i.planNum; }); },
    async onConfirmPick() {
      const map = {};
      (this.detail.items || []).forEach(i => { map[i.id] = i.pickedNum == null ? 0 : i.pickedNum; });
      await pickApi.confirm(this.detail.id, map);
      this.$message.success('拣货完成');
      this.pickVisible = false;
      this.loadPage();
    },
    async onPrint(row) {
      try { await doPrint('PK', row.id); } catch (e) { this.$message.error(e.message || '打印失败'); }
    },
    async onCreateReview(row) {
      await reviewApi.createFromPick(row.id, {});
      this.$message.success('已生成复核单，请到"复核管理"处理');
      this.loadPage();
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.step { display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; background: #409eff; color: #fff; font-size: 11px; }
.loc { color: #e6a23c; }
</style>
