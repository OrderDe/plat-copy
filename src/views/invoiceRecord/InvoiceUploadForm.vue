<template>
  <el-dialog title="开票上传" :visible.sync="dialogVisible" width="600px" append-to-body>
    <div v-loading="loading">
      <!-- 发票信息 -->
      <div class="invoice-info">
        <h4>发票信息</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="开票编码">{{ invoiceInfo.invoiceCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ invoiceInfo.orderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发票抬头">{{ invoiceInfo.invoiceTitle || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开票金额">¥{{ (invoiceInfo.invoiceAmount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="开票类型">
            <el-tag v-if="invoiceInfo.invoiceType === 0" type="info" size="mini">个人</el-tag>
            <el-tag v-else-if="invoiceInfo.invoiceType === 1" type="success" size="mini">企业</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag v-if="invoiceInfo.status === 0" type="info" size="mini">开票中</el-tag>
            <el-tag v-else-if="invoiceInfo.status === 1" type="success" size="mini">已开票</el-tag>
            <el-tag v-else-if="invoiceInfo.status === 2" type="warning" size="mini">审核中</el-tag>
            <el-tag v-else-if="invoiceInfo.status === 3" type="primary" size="mini">已审核</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 上传区域 -->
      <div class="upload-section">
        <h4>上传开票附件</h4>
        <p class="tip">请上传开票凭证，支持 PDF、DOC、DOCX、XLS、XLSX、JPG、PNG 格式，文件大小不超过 10MB</p>
        <uploadFile v-model="uploadedFileUrl" />
        <div v-if="uploadedFileUrl" style="margin-top: 10px; color: #67c23a; font-size: 12px;">
          <i class="el-icon-check"></i> 已上传成功
        </div>
      </div>

      <!-- 备注 -->
      <div class="remark-section">
        <h4>备注</h4>
        <el-input
          type="textarea"
          v-model="remark"
          placeholder="请输入备注信息（选填）"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
      </div>
    </div>

    <span slot="footer">
      <el-button @click="dialogVisible = false" :disabled="loading">取消</el-button>
      <el-button
        type="danger"
        :loading="loading"
        :disabled="loading"
        @click="rejectInvoice"
      >拒绝开票</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!uploadedFileUrl || loading"
        @click="confirmInvoice"
      >确认开票</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getInvoiceRecordDetail, changeInvoiceStatus } from '@/api/invoiceRecord';
import uploadFile from '@/components/Upload/uploadFile';

export default {
  name: 'InvoiceUploadForm',
  components: { uploadFile },
  data() {
    return {
      dialogVisible: false,
      dialogTitle: '开票上传',
      loading: false,
      uploadedFileUrl: '',
      remark: '',
      invoiceInfo: {}
    };
  },
  methods: {
    /** 打开弹窗 */
    async open(invoiceId) {
      this.dialogVisible = true;
      this.loading = true;
      this.uploadedFileUrl = '';
      this.remark = '';
      try {
        this.invoiceInfo = await getInvoiceRecordDetail(invoiceId);
      } catch (error) {
        console.error('获取发票信息失败:', error);
        this.$message.error('获取发票信息失败');
        this.dialogVisible = false;
      } finally {
        this.loading = false;
      }
    },
    /** 确认开票（状态=已开票） */
    async confirmInvoice() {
      if (!this.uploadedFileUrl) {
        this.$message.error('请上传开票附件');
        return;
      }
      this.loading = true;
      try {
        await changeInvoiceStatus({
          id: this.invoiceInfo.id,
          status: 1,
          attachmentUrl: this.uploadedFileUrl,
          remark: this.remark || ''
        });
        this.$message.success('已确认开票');
        this.dialogVisible = false;
        this.$emit('success');
      } catch (error) {
        console.error('开票失败:', error);
        this.$message.error('开票失败，请重试');
      } finally {
        this.loading = false;
      }
    },
    /** 拒绝开票（状态=已拒绝） */
    async rejectInvoice() {
      this.loading = true;
      try {
        await changeInvoiceStatus({
          id: this.invoiceInfo.id,
          status: 2,
          attachmentUrl: this.uploadedFileUrl || '',
          remark: this.remark || ''
        });
        this.$message.success('已拒绝开票');
        this.dialogVisible = false;
        this.$emit('success');
      } catch (error) {
        console.error('拒绝开票失败:', error);
        this.$message.error('拒绝开票失败，请重试');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.invoice-info {
  margin-bottom: 24px;
}
.invoice-info h4 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}
.upload-section {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
}
.upload-section h4 {
  margin-bottom: 8px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}
.tip {
  margin-bottom: 16px;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
}
.upload-section .tip {
  margin-bottom: 16px;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
}
.remark-section {
  margin-top: 20px;
}
.remark-section h4 {
  margin-bottom: 8px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}
</style>
