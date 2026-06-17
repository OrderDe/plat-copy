<template>
  <div class="divBox">
    <pageHeader title="运费模板" backUrl="/yyt/goods/list" />
    <el-card class="box-card" shadow="never" :body-style="{ padding: '20px' }">
      <!-- 搜索 -->
      <el-row :gutter="20" class="search-top">
        <el-col :span="8">
          <div class="flex">
            <div>SPUID：</div>
            <el-input
              v-model="searchForm.spuId"
              placeholder="SPU ID"
              size="small"
              clearable
              style="width: 300px"
              @keyup.enter.native="handleSearch"
            />
          </div>
        </el-col>
        <!-- <el-col :span="6">
          <el-input
            v-model="searchForm.templateName"
            placeholder="模板名称"
            size="small"
            clearable
            @keyup.enter.native="handleSearch"
          >
            <i slot="prefix" class="el-input__icon el-icon-search" />
          </el-input>
        </el-col> -->
        <el-col :span="4">
          <div class="flex">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">搜索</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </div>
        </el-col>
      </el-row>

      <!-- 表格 -->
      <el-table :data="tableData" border class="mt20" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="spuId" label="SPU ID" />
        <el-table-column prop="chargeTypeName" label="计费方式" width="120" />

        <el-table-column label="是否包邮" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="row.isFree === 1 ? 'success' : 'info'" size="small">
              {{ row.isFree === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配送区域" width="200">
          <template slot-scope="{ row }">
            <el-button type="text" @click="handleShowDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
        <el-table-column label="首件" width="100">
          <template slot-scope="{ row }">
            <span v-if="row.isFree === 1">-</span>
            <span v-else>{{ row.firstNum }}件</span>
          </template>
        </el-table-column>
        <el-table-column label="续件" width="100">
          <template slot-scope="{ row }">
            <span v-if="row.isFree === 1">-</span>
            <span v-else>{{ row.addNum }}件</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
      </el-table>
      <!-- 模板数据 -->
      <el-dialog title="模板数据" :visible.sync="detailVisible" width="700px">
        <div v-if="detailData">
          <el-alert v-if="detailData.freeExpress === 1" title="包邮" type="success" :closable="false" class="mb20" />
          <template v-else>
            <div v-for="(region, index) in detailData.templateInfoVO.regionInfos" :key="index" class="region-item">
              <div class="region-title">
                <el-tag :type="region.isDefault === 1 ? 'success' : 'primary'" size="small" class="mr10">
                  {{ region.isDefault === 1 ? '默认区域' : '指定区域' }}
                </el-tag>
                <span>{{ region.describe }}</span>
              </div>
              <div v-if="region.region && region.region.length" class="region-list">
                <div v-for="(r, idx) in region.region" :key="idx" class="region-content">
                  <strong>{{ r.province }}：</strong>
                  <span>{{ r.cities }}</span>
                </div>
              </div>
              <div v-else class="region-content">全国（除指定区域外）</div>
            </div>
          </template>
        </div>
      </el-dialog>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          background
          :current-page="searchForm.pageNum"
          :page-size="searchForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { GetShipTemplateList } from '@/api/yytapi';

export default {
  name: 'YytShipTemplate',
  data() {
    return {
      searchForm: {
        pageNum: 1,
        pageSize: 10,
        spuId: null,
        templateName: '',
      },
      tableData: [],
      total: 0,
      loading: false,
      detailVisible: false,
      detailData: null,
    };
  },
  created() {
    // 如果有 spuId 参数，从路由获取
    if (this.$route.query.spuId) {
      this.searchForm.spuId = Number(this.$route.query.spuId);
    }
    this.getList();
  },
  methods: {
    // 获取列表
    async getList() {
      this.loading = true;
      try {
        const res = await GetShipTemplateList(this.searchForm);
        this.tableData = res.list || [];
        this.total = res.total || 0;
      } catch (e) {
        this.$message.error('获取列表失败');
      } finally {
        this.loading = false;
      }
    },
    // 搜索
    handleSearch() {
      this.searchForm.pageNum = 1;
      this.getList();
    },
    // 重置
    handleReset() {
      this.searchForm = {
        pageNum: 1,
        pageSize: 10,
        spuId: this.$route.query.spuId ? Number(this.$route.query.spuId) : null,
        templateName: '',
      };
      this.getList();
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.searchForm.pageSize = val;
      this.searchForm.pageNum = 1;
      this.getList();
    },
    // 页码改变
    handleCurrentChange(val) {
      this.searchForm.pageNum = val;
      this.getList();
    },
    // 模板数据
    handleShowDetail(row) {
      try {
        this.detailData = row.rawData ? JSON.parse(row.rawData) : null;
      } catch (e) {
        this.detailData = null;
      }
      this.detailVisible = true;
      console.log(this.detailData);
    },
  },
};
</script>

<style scoped lang="scss">
.search-top {
  margin-bottom: 0;
}
.mt20 {
  margin-top: 20px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
.mb20 {
  margin-bottom: 20px;
}
.region-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 15px;
}
.region-title {
  font-size: 14px;
  margin-bottom: 10px;
}
.region-list {
  padding-left: 10px;
}
.region-content {
  line-height: 1.8;
  font-size: 13px;
  color: #606266;
}
</style>
