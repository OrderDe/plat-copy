<template>
  <div class="app-container">
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="商品名称">
        <el-input v-model="query.name" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="平台">
        <el-select v-model="query.platformType" clearable placeholder="全部" style="width:120px">
          <el-option label="自研" :value="0" />
          <el-option label="怡亚通" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="商户ID">
        <el-input v-model="query.merId" placeholder="商户ID" clearable style="width:120px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="集成ID" width="150" show-overflow-tooltip />
      <el-table-column prop="originalId" label="原始ID" width="160" show-overflow-tooltip />
      <el-table-column label="平台" width="90">
        <template slot-scope="{row}">
          <el-tag size="mini" :type="row.platformType === 0 ? '' : 'success'">
            {{ row.platformType === 0 ? '自研' : '怡亚通' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="merId" label="商户ID" width="80" />
      <el-table-column prop="name" label="商品名称" min-width="180" show-overflow-tooltip />
      <el-table-column label="图片" width="80">
        <template slot-scope="{row}">
          <el-image v-if="row.image" :src="row.image" style="width:44px;height:44px" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column prop="price" label="售价" width="90" />
      <el-table-column prop="otPrice" label="市场价" width="90" />
      <el-table-column prop="stock" label="库存" width="80" />
      <el-table-column prop="sales" label="销量" width="80" />
      <el-table-column prop="unitName" label="单位" width="80" />
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
import { materialApi } from '@/api/warehouse';

export default {
  name: 'WarehouseMaterial',
  data() {
    return {
      loading: false, total: 0, tableData: [],
      query: { page: 1, limit: 20, name: '', platformType: null, merId: null },
    };
  },
  created() { this.loadPage(); },
  methods: {
    async loadPage() {
      this.loading = true;
      try {
        const res = await materialApi.page(this.query);
        this.tableData = res.data.list || [];
        this.total = res.data.total || 0;
      } finally { this.loading = false; }
    },
    onSearch() { this.query.page = 1; this.loadPage(); },
    onReset() { this.query = { page: 1, limit: 20, name: '', platformType: null, merId: null }; this.loadPage(); },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
</style>
