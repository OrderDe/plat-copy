<template>
  <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="800px" @close="handleClose">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" v-loading="formLoading">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="订单号" prop="orderNo">
            <el-input v-model="formData.orderNo" placeholder="请输入开票订单号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="订单ID" prop="orderId">
            <el-input v-model.number="formData.orderId" placeholder="请输入订单ID" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开票金额" prop="invoiceAmount">
            <el-input-number
              v-model="formData.invoiceAmount"
              :precision="2"
              :min="0"
              controls-position="right"
              placeholder="请输入开票金额"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开票类型" prop="invoiceType">
            <el-select v-model="formData.invoiceType" placeholder="请选择开票类型" style="width: 100%">
              <el-option label="个人" :value="0" />
              <el-option label="企业" :value="1" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="发票类型" prop="category">
            <el-select v-model="formData.category" placeholder="请选择发票类型" style="width: 100%">
              <el-option label="增值税普通发票" :value="1" />
              <el-option label="增值税专用发票" :value="2" />
              <el-option label="电子发票" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发票状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择发票状态" style="width: 100%">
              <el-option label="开票中" :value="0" />
              <el-option label="已开票" :value="1" />
              <el-option label="审核中" :value="2" />
              <el-option label="已审核" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="发票抬头" prop="invoiceTitle">
        <el-input v-model="formData.invoiceTitle" placeholder="请输入发票抬头" />
      </el-form-item>

      <el-row :gutter="20" v-if="formData.invoiceType === 1">
        <el-col :span="12">
          <el-form-item label="税号" prop="taxNo">
            <el-input v-model="formData.taxNo" placeholder="请输入税号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公司名称" prop="companyName">
            <el-input v-model="formData.companyName" placeholder="请输入公司名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="公司地址" prop="companyAddress" v-if="formData.invoiceType === 1">
        <el-input v-model="formData.companyAddress" placeholder="请输入公司地址" />
      </el-form-item>

      <el-row :gutter="20" v-if="formData.invoiceType === 1">
        <el-col :span="12">
          <el-form-item label="公司电话" prop="companyPhone">
            <el-input v-model="formData.companyPhone" placeholder="请输入公司电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="formData.invoiceType === 1 && formData.category === 2">
        <el-col :span="12">
          <el-form-item label="银行名称" prop="bankName">
            <el-input v-model="formData.bankName" placeholder="请输入银行名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="银行账户" prop="bankAccount">
            <el-input v-model="formData.bankAccount" placeholder="请输入银行账户" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="申请时间" prop="applyTime">
            <el-date-picker
              v-model="formData.applyTime"
              type="datetime"
              placeholder="选择申请时间"
              style="width: 100%"
              value-format="yyyy-MM-dd HH:mm:ss"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开票编码" prop="invoiceCode">
            <el-input v-model="formData.invoiceCode" placeholder="请输入开票编码/申请单号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="附件地址" prop="attachmentUrl">
        <el-input v-model="formData.attachmentUrl" placeholder="请输入附件地址" />
        <div class="mt10">
          <el-button type="primary" size="small" @click="showUploadDialog = true">上传附件</el-button>
        </div>
        <!-- 上传对话框 -->
        <el-dialog title="上传附件" :visible.sync="showUploadDialog" width="500px" append-to-body>
          <div class="upload-tip">请上传开票凭证，支持 PDF、DOC、DOCX、XLS、XLSX、JPG、PNG 格式，文件大小不超过 10MB</div>
          <div class="upLoadPicBox" @click="modalPicTap">
            <div v-if="uploadedFileUrl" class="pictrue">
              <img :src="uploadedFileUrl" />
            </div>
            <div v-else class="upLoad">
              <i class="el-icon-camera cameraIconfont" />
            </div>
          </div>
          <span slot="footer">
            <el-button @click="confirmUploadFile" type="primary" :disabled="!uploadedFileUrl">确认上传</el-button>
            <el-button @click="showUploadDialog = false">取消</el-button>
          </span>
        </el-dialog>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
          :rows="3"
        />
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button @click="submitForm" type="primary" :loading="submitLoading">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { getInvoiceRecordDetail, createOrUpdateInvoiceRecord } from '@/api/invoiceRecord';

export default {
  name: 'InvoiceRecordForm',
  data() {
    return {
      dialogVisible: false,
      dialogTitle: '新增发票记录',
      formLoading: false,
      submitLoading: false,
      formType: 'create',
      showUploadDialog: false,
      uploadedFileUrl: '',
      formData: {
        id: undefined,
        invoiceCode: '',
        orderNo: '',
        invoiceAmount: 0,
        invoiceType: 0,
        category: 1,
        invoiceTitle: '',
        taxNo: '',
        status: 0,
        applyTime: '',
        spuId: 0,
        invoiceTime: '',
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        bankName: '',
        bankAccount: '',
        email: '',
        orderId: 0,
        userId: 0,
        userName: '',
        spuName: '',
        attachmentUrl: '',
        remark: ''
      },
      formRules: {
        orderNo: [{ required: true, message: '订单号不能为空', trigger: 'blur' }],
        orderId: [{ required: true, message: '订单ID不能为空', trigger: 'blur' }],
        invoiceAmount: [
          { required: true, message: '开票金额不能为空', trigger: 'blur' }
        ],
        invoiceType: [{ required: true, message: '开票类型不能为空', trigger: 'change' }],
        category: [{ required: true, message: '发票类别不能为空', trigger: 'change' }],
        invoiceTitle: [{ required: true, message: '发票抬头不能为空', trigger: 'blur' }],
        status: [{ required: true, message: '发票状态不能为空', trigger: 'change' }],
        email: [
          { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
        ]
      }
    };
  },
  methods: {
    /** 确认上传文件 */
    confirmUploadFile() {
      if (this.uploadedFileUrl) {
        this.formData.attachmentUrl = this.uploadedFileUrl;
        this.showUploadDialog = false;
        this.uploadedFileUrl = '';
        this.$message.success('附件上传成功');
      }
    },
    /** 打开图片选择 */
    modalPicTap() {
      const _this = this;
      this.$modalUpload(
        function(img) {
          if (!img) return;
          _this.uploadedFileUrl = img[0].sattDir;
        },
        false,
        'store'
      );
    },
    /** 打开弹窗 */
    async open(type, id) {
      this.dialogVisible = true;
      this.dialogTitle = type === 'create' ? '新增发票记录' : '修改发票记录';
      this.formType = type;
      this.resetForm();
      // 修改时，设置数据
      if (id) {
        this.formLoading = true;
        try {
          const res = await getInvoiceRecordDetail(id);
          this.formData = { ...this.formData, ...res };
        } finally {
          this.formLoading = false;
        }
      }
    },
    /** 提交表单 */
    submitForm() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          await createOrUpdateInvoiceRecord(this.formData);
          this.$message.success(this.formType === 'create' ? '新增成功' : '修改成功');
          this.dialogVisible = false;
          this.$emit('success');
        } finally {
          this.submitLoading = false;
        }
      });
    },
    /** 重置表单 */
    resetForm() {
      this.formData = {
        id: undefined,
        invoiceCode: '',
        orderNo: '',
        invoiceAmount: 0,
        invoiceType: 0,
        category: 1,
        invoiceTitle: '',
        taxNo: '',
        status: 0,
        applyTime: '',
        spuId: 0,
        invoiceTime: '',
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        bankName: '',
        bankAccount: '',
        email: '',
        orderId: 0,
        userId: 0,
        userName: '',
        spuName: '',
        attachmentUrl: '',
        remark: ''
      };
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields();
      }
    },
    handleClose() {
      this.resetForm();
    }
  }
};
</script>

<style scoped>
.mt10 {
  margin-top: 10px;
}
.upload-tip {
  margin-bottom: 16px;
  color: #909399;
  font-size: 14px;
  line-height: 1.5;
}
.upLoadPicBox {
  position: relative;
  width: 80px;
  height: 80px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}
.upLoadPicBox .pictrue {
  width: 100%;
  height: 100%;
}
.upLoadPicBox .pictrue img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upLoadPicBox .upLoad {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.upLoadPicBox .cameraIconfont {
  font-size: 24px;
  color: #999;
}
</style>
