<template>
  <div v-if="checkPermi(['platform:product:library:list'])" class="divBox relative">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">商品库</span>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="queryForm" size="small" class="mb10">
        <el-form-item label="商品名称">
          <el-input v-model="queryForm.name" placeholder="请输入商品名称" clearable style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="tableData" border size="mini">
        <el-table-column prop="originalId" label="原始ID" width="100" />
        <el-table-column prop="platformType" label="平台类型" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini">{{ platformTypeText(row.platformType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="image" label="商品图片" width="100">
          <template slot-scope="{ row }">
            <el-image v-if="row.image" :src="row.image" style="width:60px;height:60px" fit="cover" :preview-src-list="[row.image]" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="商品售价" width="100" align="right">
          <template slot-scope="{ row }">
            <span class="price-text">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="otPrice" label="原价" width="100" align="right">
          <template slot-scope="{ row }">
            <span>¥{{ row.otPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="80" align="center" />
        <el-table-column prop="ficti" label="虚拟销量" width="80" align="center" />
        <el-table-column prop="stock" label="库存" width="80" align="center" />
        <el-table-column prop="unitName" label="单位" width="80" />
        <el-table-column prop="isSelf" label="自营" width="80" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.isSelf ? 'success' : 'info'" size="mini">{{ row.isSelf ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="positiveRatio" label="好评率" width="90" align="center" />
        <el-table-column prop="replyNum" label="评价数" width="90" align="center" />
      </el-table>

      <!-- 分页 -->
      <div class="mt15 acea-row row-right">
        <el-pagination
          background
          :current-page="queryForm.pageNum"
          :page-sizes="[20, 50, 100]"
          :page-size="queryForm.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { GetIntegrateProductPage } from '@/api/product';
import { checkPermi } from '@/utils/permission';

export default {
  name: 'ProductLibrary',
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      queryForm: {
        pageNum: 1,
        pageSize: 20,
        name: '',
        deleted: 0,
      },
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    checkPermi,
    getList() {
      this.loading = true;
      const { pageNum, pageSize, name, deleted } = this.queryForm;
      const params = { pageNum, pageSize, deleted };
      if (name) params.name = name;
      GetIntegrateProductPage(params)
        .then((res) => {
          this.tableData = (res && res.list) || [];
          this.total = (res && res.total) || 0;
        })
        .finally(() => { this.loading = false; });
    },
    onSearch() {
      this.queryForm.pageNum = 1;
      this.getList();
    },
    onReset() {
      this.queryForm = {
        pageNum: 1,
        pageSize: 20,
        name: '',
        deleted: 0,
      };
      this.getList();
    },
    handleSizeChange(size) {
      this.queryForm.pageSize = size;
      this.queryForm.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(page) {
      this.queryForm.pageNum = page;
      this.getList();
    },
    platformTypeText(type) {
      const map = { 0: '自研', 1: '怡亚通' };
      return map[type] || '-';
    },
  },
};
</script>

<style scoped>
.price-text { color: #f56c6c; font-weight: 600; }
</style>
