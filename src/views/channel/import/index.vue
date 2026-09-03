<template>
  <div class="divBox">
    <el-card shadow="never" :bordered="false">
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="渠道"><el-select v-model="channelId" clearable placeholder="全部渠道" @change="loadList(1)"><el-option v-for="item in channels" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-button type="primary" @click="loadList(1)">查询</el-button>
      </el-form>
    </el-card>
    <el-card shadow="never" :bordered="false" class="mt14">
      <el-table v-loading="loading" :data="list" border size="small">
        <el-table-column prop="batchNo" label="批次号" min-width="180" />
        <el-table-column prop="channelId" label="渠道 ID" width="90" />
        <el-table-column prop="fileName" label="文件名" min-width="180" />
        <el-table-column prop="totalRow" label="总行数" width="90" />
        <el-table-column prop="successOrder" label="成功订单" width="100" />
        <el-table-column prop="failRow" label="失败行数" width="100" />
        <el-table-column prop="operatorName" label="操作人" width="110" />
        <el-table-column prop="createTime" label="导入时间" min-width="160" />
        <el-table-column label="失败明细" width="100"><template slot-scope="scope"><el-button type="text" size="small" :disabled="!scope.row.failDetail" @click="showFail(scope.row)">查看</el-button></template></el-table-column>
      </el-table>
      <div class="pagination"><el-pagination background layout="total, sizes, prev, pager, next, jumper" :current-page="query.page" :page-size="query.limit" :page-sizes="[10,20,50]" :total="total" @size-change="changeSize" @current-change="loadList" /></div>
    </el-card>
    <el-dialog title="导入失败明细" :visible.sync="failVisible" width="650px"><el-table :data="failList" border size="small"><el-table-column prop="row" label="Excel 行号" width="100" /><el-table-column prop="outOrderNo" label="第三方订单号" width="170" /><el-table-column prop="message" label="失败原因" /></el-table></el-dialog>
  </div>
</template>

<script>
import { channelListApi, channelImportRecordApi } from '@/api/channel';
export default {
  name: 'ChannelImportRecord',
  data() { return { loading: false, list: [], total: 0, channels: [], channelId: null, query: { page: 1, limit: 20 }, failVisible: false, failList: [] }; },
  created() { channelListApi({ page: 1, limit: 200 }).then((res) => { this.channels = (res && (res.list || res.records)) || []; }); this.loadList(1); },
  methods: {
    loadList(page) { if (page) this.query.page = page; this.loading = true; channelImportRecordApi({ ...this.query, channelId: this.channelId || undefined }).then((res) => { this.list = (res && (res.list || res.records)) || []; this.total = Number((res && res.total) || 0); }).finally(() => { this.loading = false; }); },
    changeSize(size) { this.query.limit = size; this.loadList(1); },
    showFail(row) { try { this.failList = JSON.parse(row.failDetail) || []; } catch (e) { this.failList = [{ row: '-', message: row.failDetail }]; } this.failVisible = true; },
  },
};
</script>

<style scoped>
.pagination { text-align: right; margin-top: 20px; }
</style>
