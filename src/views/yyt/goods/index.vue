<template>
  <div v-if="checkPermi(['platform:yyt:goods:list'])" class="divBox relative">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">怡亚通商品列表</span>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="queryForm" size="small" class="mb10">
        <!-- 一级分类 -->
        <el-form-item label="一级分类">
          <el-select v-model="queryForm.categoryId1" placeholder="请选择" clearable style="width:130px" @change="onCat1Change">
            <el-option v-for="item in catList1" :key="item.subId" :label="item.name" :value="item.subId" />
          </el-select>
        </el-form-item>
        <!-- 二级分类 -->
        <el-form-item label="二级分类">
          <el-select v-model="queryForm.categoryId2" placeholder="请选择" clearable style="width:130px" @change="onCat2Change">
            <el-option v-for="item in catList2" :key="item.subId" :label="item.name" :value="item.subId" />
          </el-select>
        </el-form-item>
        <!-- 三级分类 -->
        <el-form-item label="三级分类">
          <el-select v-model="queryForm.categoryId3" placeholder="请选择" clearable style="width:130px">
            <el-option v-for="item in catList3" :key="item.subId" :label="item.name" :value="item.subId" />
          </el-select>
        </el-form-item>
        <!-- 商品名称 -->
        <el-form-item label="商品名称">
          <el-input v-model="queryForm.name" placeholder="请输入商品名称" clearable style="width:160px" />
        </el-form-item>
        <!-- 库名称 -->
        <el-form-item label="库名称">
          <el-input v-model="queryForm.libName" placeholder="请输入库名称" clearable style="width:130px" />
          <el-button type="text" size="small" class="ml5" @click="onFillTestLib">测试库</el-button>
        </el-form-item>
        <!-- SPU ID -->
        <el-form-item label="SPU ID">
          <el-input v-model="queryForm.spuId" placeholder="请输入SPU ID" clearable style="width:130px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作栏 -->
      <div class="mb10">
        <!-- <el-button type="primary" size="small" icon="el-icon-refresh" :loading="syncBrandLoading" @click="onSyncBrand">同步怡亚通品牌</el-button>
        <el-button type="primary" size="small" icon="el-icon-refresh" :loading="syncCategoryLoading" @click="onSyncCategory">同步怡亚通分类</el-button>
        <el-button type="primary" size="small" icon="el-icon-refresh" :loading="syncGoodsLoading" @click="onSyncGoods">同步怡亚通商品列表</el-button> -->
        <!-- <el-button
          type="success"
          size="small"
          icon="el-icon-plus"
          :disabled="selectedRows.length === 0"
          @click="onBatchAddToLibrary"
        >批量加入商品库（{{ selectedRows.length }}）</el-button> -->
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
        <el-table-column label="分类" min-width="200">
          <template slot-scope="{ row }">
            {{ row.categoryName1 }}
            <span v-if="row.categoryName2"> / {{ row.categoryName2 }}</span>
            <span v-if="row.categoryName3"> / {{ row.categoryName3 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="brandName" label="品牌" width="100" show-overflow-tooltip />
        <el-table-column prop="libName" label="商品库" min-width="120" show-overflow-tooltip />
        <el-table-column prop="inventory" label="库存" width="80" align="center" />
        <el-table-column prop="deliveryPlace" label="发货地" width="120" show-overflow-tooltip />
        <el-table-column label="商品状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.status ==0 ? 'success' : 'info'" size="mini">
              {{ row.status == 0 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="包邮" width="70" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.freeExpress ==1 ? 'success' : 'info'" size="mini">
              {{ row.freeExpress ==1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column label="限售区域" width="80" align="center">
          <template slot-scope="{ row }">
            <span :style="{ color: row.isLimitArea === 'Y' ? '#E6A23C' : '#67C23A' }">
              {{ row.isLimitArea === 'Y' ? '是' : '否' }}
            </span>
          </template>
        </el-table-column> -->
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="onViewDetail(row)" v-hasPermi="['platform:yyt:goods:detail']">查看详情</el-button>
            <!-- <el-button type="text" size="mini" style="color:#67C23A" @click="onAddToLibrary([row])">加入商品库</el-button> -->
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

    <!-- 商品详情抽屉 -->
    <goods-detail-drawer ref="goodsDetailDrawer" />
  </div>
</template>

<script>
import { GetCategoryTree, GetSpuList, SyncYytBrand, SyncYytCategory, SyncYytSpu } from '@/api/yytapi';
import GoodsDetailDrawer from './components/GoodsDetailDrawer.vue';

export default {
  name: 'YytGoods',
  components: { GoodsDetailDrawer },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      selectedRows: [],
      catList1: [],
      catList2: [],
      catList3: [],
      syncBrandLoading: false,
      syncCategoryLoading: false,
      syncGoodsLoading: false,
      queryForm: {
        pageIndex: 1,
        pageSize: 20,
        categoryId1: '',
        categoryId2: '',
        categoryId3: '',
        name: '',
        // libName: '分销商测试专用商品库',
        libName: '',
        spuId: '',
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
    // 同步品牌
    onSyncBrand() {
      this.syncBrandLoading = true;
      SyncYytBrand()
        .then((res) => {
          this.$message.success(res && res.message ? res.message : '品牌同步成功');
        })
        .catch(() => {})
        .finally(() => { this.syncBrandLoading = false; });
    },
    // 同步分类
    onSyncCategory() {
      this.syncCategoryLoading = true;
      SyncYytCategory()
        .then((res) => {
          this.$message.success(res && res.message ? res.message : '分类同步成功');
          this.loadCategoryTree();
        })
        .catch(() => {})
        .finally(() => { this.syncCategoryLoading = false; });
    },
    // 同步商品
    onSyncGoods() {
      this.syncGoodsLoading = true;
      SyncYytSpu()
        .then((res) => {
          this.$message.success(res && res.message ? res.message : '商品同步成功');
          this.getList();
        })
        .catch(() => {})
        .finally(() => { this.syncGoodsLoading = false; });
    },
    buildParams() {
      const { pageIndex, pageSize, categoryId1, categoryId2, categoryId3, name, libName, spuId } = this.queryForm;
      const params = { pageIndex, pageSize };
      if (categoryId1) params.categoryId1 = categoryId1;
      if (categoryId2) params.categoryId2 = categoryId2;
      if (categoryId3) params.categoryId3 = categoryId3;
      if (name) params.name = name;
      if (libName) params.libName = libName;
      if (spuId) params.spuId = spuId;
      return params;
    },
    getList() {
      this.loading = true;
      GetSpuList(this.buildParams())
        .then((res) => {
          console.log('商品列表', res);
          this.tableData = (res && res.list);
          this.total = (res && res.total) || 0;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onSearch() {
      this.queryForm.pageIndex = 1;
      this.getList();
    },
    onReset() {
      this.queryForm = { pageIndex: 1, pageSize: 20, categoryId1: '', categoryId2: '', categoryId3: '', name: '', libName: '', spuId: '' };
      this.catList2 = [];
      this.catList3 = [];
      this.getList();
    },
    onFillTestLib() {
      this.queryForm.libName = '分销商测试专用商品库';
      this.queryForm.pageIndex = 1;
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
    onViewDetail(row) {
      this.$refs.goodsDetailDrawer.open(row.spuId);
    },
    onAddToLibrary(rows) {
      this.$confirm(`确认将选中的 ${rows.length} 个商品加入商品库？`, '提示', { type: 'warning' }).then(() => {
        // 调用加入商品库接口（接口路径待配置）
        this.$message.success('已成功加入商品库');
      });
    },
    onBatchAddToLibrary() {
      this.onAddToLibrary(this.selectedRows);
    },
  },
};
</script>

<style scoped>
.price-text { color: #f56c6c; font-weight: 600; }
</style>
