<template>
  <div v-if="checkPermi(['platform:invoice:management:list'])" class="divBox">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">开票管理</span>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="queryForm" size="small" class="mb10">
        <el-form-item label="开票状态">
          <el-select v-model="queryForm.invoiceStatus" placeholder="全部" clearable style="width:120px">
            <el-option label="待开票" :value="0" />
            <el-option label="开票中" :value="1" />
            <el-option label="已开票" :value="2" />
            <el-option label="已拒绝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单编号">
          <el-input v-model="queryForm.orderNo" placeholder="请输入订单编号" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="开票抬头">
          <el-input v-model="queryForm.title" placeholder="请输入开票抬头" clearable style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="tableData" border size="small">
        <el-table-column prop="orderNo" label="订单编号" min-width="160" />
        <el-table-column prop="title" label="开票抬头" min-width="180" show-overflow-tooltip />
        <el-table-column prop="taxNo" label="税号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="invoiceAmount" label="开票金额" width="120" align="right">
          <template slot-scope="{ row }">
            <span class="price-text">¥{{ row.invoiceAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="开票状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="statusTagType(row.invoiceStatus)" size="mini">
              {{ statusLabel(row.invoiceStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="invoiceNo" label="发票号" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="onViewOrder(row)" v-hasPermi="['platform:invoice:management:detail']">查看订单</el-button>
            <el-button v-if="row.invoiceStatus === 0" type="text" size="mini" style="color:#67C23A" @click="onInvoice(row)" v-hasPermi="['platform:invoice:management:invoice']">去开票</el-button>
            <el-button v-if="row.invoiceStatus === 0" type="text" size="mini" style="color:#F56C6C" @click="onReject(row)" v-hasPermi="['platform:invoice:management:reject']">拒绝</el-button>
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

    <!-- 开票弹窗 -->
    <el-dialog title="开票" :visible.sync="invoiceDialogVisible" width="500px">
      <el-form ref="invoiceForm" :model="invoiceForm" label-width="100px">
        <el-form-item label="订单编号">{{ invoiceForm.orderNo }}</el-form-item>
        <el-form-item label="开票抬头">{{ invoiceForm.title }}</el-form-item>
        <el-form-item label="税号">{{ invoiceForm.taxNo }}</el-form-item>
        <el-form-item label="开票金额">
          <span class="price-text">¥{{ invoiceForm.invoiceAmount }}</span>
        </el-form-item>
        <el-form-item label="发票号" required>
          <el-input v-model="invoiceForm.invoiceNo" placeholder="请输入发票号" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="invoiceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmitInvoice">确认开票</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { checkPermi } from '@/utils/permission';

export default {
  name: 'InvoiceManagement',
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      queryForm: {
        pageIndex: 1,
        pageSize: 20,
        orderNo: '',
        title: '',
        invoiceStatus: '',
      },
      invoiceDialogVisible: false,
      invoiceForm: {
        id: '',
        orderNo: '',
        title: '',
        taxNo: '',
        invoiceAmount: '',
        invoiceNo: '',
      },
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    checkPermi,
    statusLabel(status) {
      const map = { 0: '待开票', 1: '开票中', 2: '已开票', 3: '已拒绝' };
      return map[status] || '未知';
    },
    statusTagType(status) {
      const map = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' };
      return map[status] || 'info';
    },
    getList() {
      this.loading = true;
      // TODO: 调用开票列表接口
      // invoiceListApi(this.queryForm).then(res => { ... })
      setTimeout(() => {
        // 模拟数据
        this.tableData = [
          { id: 1, orderNo: 'ORD202604110001', title: '深圳市某某科技有限公司', taxNo: '91440300MA5XXXXXX', invoiceAmount: '1280.00', invoiceStatus: 0, invoiceNo: '', createTime: '2026-04-11 10:30:00' },
          { id: 2, orderNo: 'ORD202604110002', title: '广州某某贸易公司', taxNo: '91440101MA5YYYYYY', invoiceAmount: '5600.00', invoiceStatus: 1, invoiceNo: '', createTime: '2026-04-11 11:20:00' },
          { id: 3, orderNo: 'ORD202604100001', title: '东莞市某某实业', taxNo: '91441900MA5ZZZZZZ', invoiceAmount: '3200.00', invoiceStatus: 2, invoiceNo: 'FP202604110001', createTime: '2026-04-10 09:15:00' },
          { id: 4, orderNo: 'ORD202604090001', title: '佛山市某某商贸', taxNo: '91440600MA5AAAAAA', invoiceAmount: '890.00', invoiceStatus: 3, invoiceNo: '', createTime: '2026-04-09 14:30:00' },
        ];
        this.total = 4;
        this.loading = false;
      }, 300);
    },
    onSearch() {
      this.queryForm.pageIndex = 1;
      this.getList();
    },
    onReset() {
      this.queryForm = { pageIndex: 1, pageSize: 20, orderNo: '', title: '', invoiceStatus: '' };
      this.getList();
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
    onViewOrder(row) {
      this.$message.info('查看订单：' + row.orderNo);
      // TODO: 调用查看订单详情方法
    },
    onInvoice(row) {
      this.invoiceForm = { ...row };
      this.invoiceDialogVisible = true;
    },
    onSubmitInvoice() {
      if (!this.invoiceForm.invoiceNo) {
        this.$message.warning('请输入发票号');
        return;
      }
      this.$confirm('确认开票?', '提示', { type: 'warning' }).then(() => {
        // TODO: 调用开票接口
        // invoiceApi(this.invoiceForm).then(res => { ... })
        this.$message.success('开票成功');
        this.invoiceDialogVisible = false;
        this.getList();
      });
    },
    onReject(row) {
      this.$prompt('请输入拒绝原因', '拒绝开票', { type: 'warning' }).then(({ value }) => {
        if (!value) {
          this.$message.warning('请输入拒绝原因');
          return;
        }
        // TODO: 调用拒绝接口
        // rejectInvoiceApi({ id: row.id, reason: value }).then(res => { ... })
        this.$message.success('已拒绝');
        this.getList();
      });
    },
  },
};
</script>

<style scoped>
.price-text { color: #f56c6c; font-weight: 600; }
</style>
