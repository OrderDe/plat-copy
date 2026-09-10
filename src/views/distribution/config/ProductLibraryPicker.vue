<template>
  <div class="library-picker" v-loading="loading">
    <el-form :inline="true" :model="query" size="small" @submit.native.prevent>
      <el-form-item label="商品名称"><el-input v-model.trim="query.name" clearable placeholder="请输入商品名称" style="width:180px" @keyup.enter.native="load(1)" /></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-search" @click="load(1)">查询</el-button><el-button icon="el-icon-refresh" @click="reset">重置</el-button></el-form-item>
    </el-form>
    <el-table ref="table" :data="list" border size="mini" row-key="_key" @selection-change="selectionChange">
      <el-table-column type="selection" width="48" /><el-table-column prop="originalId" label="原始ID" width="100" />
      <el-table-column prop="platformType" label="平台类型" width="100" align="center"><template slot-scope="scope"><el-tag size="mini">{{ platformText(scope.row.platformType) }}</el-tag></template></el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="220" show-overflow-tooltip /><el-table-column label="商品图片" width="90"><template slot-scope="scope"><el-image v-if="scope.row.image" :src="scope.row.image" style="width:45px;height:45px" fit="cover" :preview-src-list="[scope.row.image]" /></template></el-table-column>
      <el-table-column prop="price" label="商品售价" width="100" align="right" /><el-table-column prop="otPrice" label="原价" width="100" align="right" /><el-table-column prop="sales" label="销量" width="75" align="center" /><el-table-column prop="stock" label="库存" width="75" align="center" /><el-table-column prop="unitName" label="单位" width="70" />
    </el-table>
    <div class="pagination-row"><span class="selected-count">已选择 {{ selectedRows.length }} 件</span><el-pagination background :current-page="query.pageNum" :page-sizes="[10,20,50]" :page-size="query.pageSize" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="sizeChange" @current-change="pageChange" /></div>
    <div class="picker-footer"><el-button size="small" @click="$emit('cancel')">取消</el-button><el-button size="small" type="primary" @click="$emit('confirm', selectedRows)">确定</el-button></div>
  </div>
</template>
<script>
import { GetIntegrateProductPage } from '@/api/product';
export default {
  name: 'ProductLibraryPicker', props: { checked: { type: Array, default: () => [] } },
  data() { return { loading: false, list: [], total: 0, query: { pageNum: 1, pageSize: 10, name: '', deleted: 0 }, selectedMap: {} }; },
  computed: { selectedRows() { return Object.keys(this.selectedMap).map((key) => this.selectedMap[key]); } },
  mounted() { (this.checked || []).forEach((row) => this.$set(this.selectedMap, this.keyOf(row), row)); this.load(); },
  methods: {
    keyOf(row) { return String(row._key || row.id || row.originalId); },
    load(page) { if (page) this.query.pageNum = page; this.loading = true; const params = { pageNum: this.query.pageNum, pageSize: this.query.pageSize, deleted: 0 }; if (this.query.name) params.name = this.query.name; GetIntegrateProductPage(params).then((res) => { this.list = (res && res.list || []).map((row) => Object.assign({}, row, { _key: this.keyOf(row) })); this.total = Number(res && res.total) || 0; this.$nextTick(() => this.list.forEach((row) => { if (this.selectedMap[row._key]) this.$refs.table.toggleRowSelection(row, true); })); }).finally(() => { this.loading = false; }); },
    selectionChange(rows) { const keys = this.list.map((row) => row._key); keys.forEach((key) => { if (!rows.some((row) => row._key === key)) this.$delete(this.selectedMap, key); }); rows.forEach((row) => this.$set(this.selectedMap, row._key, row)); },
    reset() { this.query = { pageNum: 1, pageSize: 10, name: '', deleted: 0 }; this.load(); }, sizeChange(size) { this.query.pageSize = size; this.load(1); }, pageChange(page) { this.load(page); }, platformText(type) { return { 0: '自研', 1: '怡亚通' }[type] || '-'; },
  },
};
</script>
<style scoped>.pagination-row{display:flex;align-items:center;justify-content:flex-end;margin-top:14px}.selected-count{margin-right:auto;color:#909399;font-size:12px}.picker-footer{border-top:1px solid #ebeef5;margin-top:14px;padding-top:14px;text-align:right}</style>
