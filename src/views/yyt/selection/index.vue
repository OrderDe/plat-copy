<template>
  <div v-if="checkPermi(['platform:yyt:selection:list'])" class="divBox relative">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">选品列表</span>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="queryForm" size="small" class="mb10">
        <el-form-item label="商品名称">
          <el-input v-model="queryForm.name" placeholder="请输入商品名称" clearable style="width:160px" />
        </el-form-item>
        <!-- 一级分类 -->
        <el-form-item label="一级分类">
          <el-select v-model="queryForm.categoryId1" placeholder="请选择" clearable style="width:120px" @change="onCat1Change">
            <el-option v-for="item in catList1" :key="item.subId" :label="item.name" :value="item.subId" />
          </el-select>
        </el-form-item>
        <!-- 二级分类 -->
        <el-form-item label="二级分类">
          <el-select v-model="queryForm.categoryId2" placeholder="请选择" clearable style="width:120px" @change="onCat2Change">
            <el-option v-for="item in catList2" :key="item.subId" :label="item.name" :value="item.subId" />
          </el-select>
        </el-form-item>
        <!-- 三级分类 -->
        <el-form-item label="三级分类">
          <el-select v-model="queryForm.categoryId3" placeholder="请选择" clearable style="width:120px">
            <el-option v-for="item in catList3" :key="item.subId" :label="item.name" :value="item.subId" />
          </el-select>
        </el-form-item>
        <!-- 导入状态 -->
        <el-form-item label="导入状态">
          <el-select v-model="queryForm.importStatus" placeholder="全部" clearable style="width:110px">
            <el-option label="待导入" :value="0" />
            <el-option label="已导入" :value="1" />
            <el-option label="导入失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="mb10">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-upload2"
          :disabled="selectedRows.length === 0"
          @click="onBatchImport"
          v-hasPermi="['platform:yyt:selection:import']"
        >批量导入（{{ selectedRows.length }}）</el-button>
        <el-button
          type="danger"
          size="small"
          icon="el-icon-delete"
          :disabled="selectedRows.length === 0"
          @click="onBatchRemove"
          v-hasPermi="['platform:yyt:selection:remove']"
        >批量移除（{{ selectedRows.length }}）</el-button>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        size="mini"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="spuId" label="SPU_ID" width="120" />
        <el-table-column prop="name" label="商品名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" min-width="220">
          <template slot-scope="{ row }">
            <span>{{ row.categoryName1 }}</span>
            <span v-if="row.categoryName2"> / {{ row.categoryName2 }}</span>
            <span v-if="row.categoryName3"> / {{ row.categoryName3 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商品状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="mini">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shopId" label="商场ID" width="100" />
        <el-table-column label="导入状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag
              :type="row.importStatus === 1 ? 'success' : row.importStatus === 2 ? 'danger' : 'warning'"
              size="mini"
            >
              {{ row.importStatus === 1 ? '已导入' : row.importStatus === 2 ? '导入失败' : '待导入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="addTime" label="添加时间" width="160" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="onReImport(row)" v-hasPermi="['platform:yyt:selection:reimport']">重新导入</el-button>
            <el-button type="text" size="mini" style="color:#F56C6C" @click="onRemove(row)" v-hasPermi="['platform:yyt:selection:remove']">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="mt15 acea-row row-right">
        <el-pagination
          background
          :current-page="queryForm.pageIndex"
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
import { GetCategoryTree } from '@/api/yytapi';

export default {
  name: 'YytSelection',
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      selectedRows: [],
      catList1: [],
      catList2: [],
      catList3: [],
      queryForm: {
        pageIndex: 1,
        pageSize: 20,
        name: '',
        categoryId1: '',
        categoryId2: '',
        categoryId3: '',
        importStatus: '',
      },
    };
  },
  mounted() {
    this.loadCategoryTree();
    this.getList();
  },
  methods: {
    // 加载一级分类
    async loadCategoryTree() {
      const res = await GetCategoryTree({ pid: 0, level: 1 });
      this.catList1 = res || [];
    },
    // 一级分类切换，请求二级分类
    async onCat1Change(val) {
      this.queryForm.categoryId2 = '';
      this.queryForm.categoryId3 = '';
      this.catList2 = [];
      this.catList3 = [];
      if (!val) return;
      const res = await GetCategoryTree({ pid: val, level: 2 });
      this.catList2 = res || [];
    },
    // 二级分类切换，请求三级分类
    async onCat2Change(val) {
      this.queryForm.categoryId3 = '';
      this.catList3 = [];
      if (!val) return;
      const res = await GetCategoryTree({ pid: val, level: 3 });
      this.catList3 = res || [];
    },
    getList() {
      this.loading = true;
      // 调用选品列表接口（接口路径待配置）
      // GetSelectionList(this.queryForm).then(res => { ... })
      // 模拟数据结构
      setTimeout(() => {
        this.tableData = [];
        this.total = 0;
        this.loading = false;
      }, 300);
    },
    onSearch() {
      this.queryForm.pageIndex = 1;
      this.getList();
    },
    onReset() {
      this.queryForm = { pageIndex: 1, pageSize: 20, name: '', categoryId1: '', categoryId2: '', categoryId3: '', importStatus: '' };
      this.catList2 = [];
      this.catList3 = [];
      this.getList();
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows;
    },
    handleSizeChange(size) {
      this.queryForm.pageSize = size;
      this.queryForm.pageIndex = 1;
      this.getList();
    },
    handleCurrentChange(page) {
      this.queryForm.pageIndex = page;
      this.getList();
    },
    onReImport(row) {
      this.$confirm(`确认重新导入商品【${row.name}】？`, '提示', { type: 'warning' }).then(() => {
        // 调用重新导入接口
        this.$message.success('已提交导入请求');
        this.getList();
      });
    },
    onRemove(row) {
      this.$confirm(`确认移除商品【${row.name}】？`, '提示', { type: 'warning' }).then(() => {
        // 调用移除接口
        this.$message.success('移除成功');
        this.getList();
      });
    },
    onBatchImport() {
      this.$confirm(`确认批量导入选中的 ${this.selectedRows.length} 个商品？`, '提示', { type: 'warning' }).then(() => {
        // 调用批量导入接口
        this.$message.success('已提交批量导入请求');
      });
    },
    onBatchRemove() {
      this.$confirm(`确认批量移除选中的 ${this.selectedRows.length} 个商品？此操作不可恢复！`, '警告', { type: 'warning' }).then(() => {
        // 调用批量移除接口
        this.$message.success('批量移除成功');
        this.getList();
      });
    },
  },
};
</script>
