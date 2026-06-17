<template>
  <div class="invoice-record">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">发票记录管理</span>
      </div>
      <!-- 搜索表单 -->
      <el-row :gutter="24" class="mb15" type="flex">
        <el-col :span="8">
          <div class="flex">
            <div class="laber-width">发票抬头：</div>
            <el-input
              v-model="queryParams.invoiceTitle"
              placeholder="发票抬头"
              size="small"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="flex">
            <div class="laber-width">开票编码：</div>
            <el-input
              v-model="queryParams.invoiceCode"
              placeholder="开票编码/申请单号"
              size="small"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="flex">
            <div class="laber-width">订单号：</div>
            <el-input
              v-model="queryParams.orderNo"
              placeholder="开票订单号"
              size="small"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="24" class="mb15" type="flex">
        <el-col :span="8">
          <div class="flex">
            <div class="laber-width">开票类型：</div>
            <el-select v-model="queryParams.invoiceType" placeholder="开票类型" size="small" clearable>
              <el-option label="个人" :value="0" />
              <el-option label="企业" :value="1" />
            </el-select>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="flex">
            <div class="laber-width">发票类型：</div>
            <el-select v-model="queryParams.category" placeholder="发票类型" size="small" clearable>
              <el-option label="增值税普通发票" :value="1" />
              <el-option label="增值税专用发票" :value="2" />
              <el-option label="电子发票" :value="3" />
            </el-select>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="flex">
            <div class="laber-width">发票状态：</div>
            <el-select v-model="queryParams.status" placeholder="发票状态" size="small" clearable>
              <el-option label="申请中" :value="0" />
              <el-option label="已开票" :value="1" />
              <el-option label="已拒绝" :value="2" />
              <!-- <el-option label="已审核" :value="3" /> -->
            </el-select>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="24" class="mb15" type="flex">
        <el-col :span="12">
          <div class="flex">
            <div class="laber-width">搜索：</div>
            <el-input
              v-model="queryParams.keyword"
              placeholder="订单号 / 发票抬头"
              size="small"
              clearable
              @keyup.enter.native="handleQuery"
            />
            <el-button class="ml20" type="primary" size="small" @click="handleQuery">搜索</el-button>
            <el-button size="small" @click="resetQuery">重置</el-button>
          </div>
        </el-col>
      </el-row>
      <!-- <el-row :gutter="20" class="mb15">
        <el-col :span="24">
          <el-button type="primary" size="small" plain @click="openForm('create')">新增</el-button>
        </el-col>
      </el-row> -->

      <!-- 列表 -->
      <el-table v-loading="loading" :data="list" border stripe size="mini">
        <el-table-column label="编号" align="center" prop="id" width="80" />
        <el-table-column label="开票编码" align="center" prop="invoiceCode" width="150" />
        <el-table-column label="订单号" align="center" prop="orderNo" width="150" />
        <el-table-column label="发票抬头" align="center" prop="invoiceTitle" min-width="150" show-overflow-tooltip />
        <el-table-column label="开票金额" align="center" prop="invoiceAmount" width="120">
          <template slot-scope="scope"> ¥{{ (scope.row.invoiceAmount || 0).toFixed(2) }} </template>
        </el-table-column>
        <el-table-column label="开票类型" align="center" prop="invoiceType" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.invoiceType === 0" type="info" size="mini">个人</el-tag>
            <el-tag v-else-if="scope.row.invoiceType === 1" type="success" size="mini">企业</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发票类型" align="center" prop="category" width="140">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.category === 1" size="mini">增值税普通发票</el-tag>
            <el-tag v-else-if="scope.row.category === 2" type="warning" size="mini">增值税专用发票</el-tag>
            <el-tag v-else-if="scope.row.category === 3" type="primary" size="mini">电子发票</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发票状态" align="center" prop="status" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 0" type="info" size="mini">申请中</el-tag>
            <el-tag v-else-if="scope.row.status === 1" type="success" size="mini">已开票</el-tag>
            <el-tag v-else-if="scope.row.status === 2" type="warning" size="mini">已拒绝</el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column label="申请人" align="center" prop="userName" width="100" /> -->
        <el-table-column label="申请时间" align="center" prop="applyTime" width="160" />
        <el-table-column label="开票时间" align="center" prop="invoiceTime" width="160" />
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleDetail(scope.row.id)">详情</el-button>
            <el-button v-if="scope.row.status === 0" type="text" size="small" @click="handleUploadInvoice(scope.row.id)"
              >去开票</el-button
            >
            <!-- <el-button type="text" size="small" @click="handleDelete(scope.row.id)">删除</el-button> -->
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="mt10 text-right">
        <el-pagination
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @current-change="pageChange"
          @size-change="sizeChange"
        />
      </div>
    </el-card>

    <!-- 表单弹窗：添加/修改 -->
    <InvoiceRecordForm ref="formRef" @success="getList" />

    <!-- 详情弹窗 -->
    <InvoiceRecordDetail ref="detailRef" />

    <!-- 开票上传弹窗 -->
    <InvoiceUploadForm ref="uploadFormRef" @success="getList" />
  </div>
</template>

<script>
import { getInvoiceRecordPage, deleteInvoiceRecord } from '@/api/invoiceRecord';
import InvoiceRecordForm from './InvoiceRecordForm.vue';
import InvoiceRecordDetail from './InvoiceRecordDetail.vue';
import InvoiceUploadForm from './InvoiceUploadForm.vue';

export default {
  name: 'InvoiceRecord',
  components: {
    InvoiceRecordForm,
    InvoiceRecordDetail,
    InvoiceUploadForm,
  },
  data() {
    return {
      loading: false,
      total: 0,
      list: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        invoiceCode: '',
        orderNo: '',
        invoiceType: undefined,
        category: undefined,
        status: undefined,
        keyword:''
      },
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    /** 查询列表 */
    async getList() {
      this.loading = true;
      try {
        const res = await getInvoiceRecordPage(this.queryParams);
        this.list = res.list || [];
        this.total = res.total || 0;
      } finally {
        this.loading = false;
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        invoiceCode: '',
        orderNo: '',
        invoiceType: undefined,
        category: undefined,
        status: undefined,
        keyword:''
      };
      this.getList();
    },
    /** 分页 */
    pageChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    },
    sizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 添加/修改操作 */
    openForm(type, id) {
      this.$refs.formRef.open(type, id);
    },
    /** 详情操作 */
    handleDetail(id) {
      this.$refs.detailRef.open(id);
    },
    /** 开票上传操作 */
    handleUploadInvoice(id) {
      this.$refs.uploadFormRef.open(id);
    },
    /** 删除按钮操作 */
    handleDelete(id) {
      this.$confirm('确定要删除该发票记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(async () => {
          try {
            await deleteInvoiceRecord(id);
            this.$message.success('删除成功');
            this.getList();
          } catch (e) {
            console.error('删除失败:', e);
          }
        })
        .catch(() => {});
    },
  },
};
</script>

<style lang="scss" scoped>
.invoice-record {
  min-height: calc(100vh - 180px);
}
.laber-width{
  width: 80px;
  min-width: 80px;
  display: flex;
  align-items: center;
}
</style>
