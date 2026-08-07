<template>
  <div class="flowable-form-build-page">
    <!-- 表单信息卡片 -->
    <el-card v-if="form.formId" class="form-info-card" shadow="never">
      <div class="form-info-header">
        <div>
          <div class="form-info-title">{{ form.formName || '表单配置' }}</div>
          <div class="form-info-subtitle">表单编号：{{ form.formId }}</div>
        </div>
        <el-tag v-if="formItems.length" type="success">已加载 {{ formItems.length }} 个字段</el-tag>
      </div>
      <table v-if="formItems.length" class="form-content-table">
        <thead>
          <tr>
            <th>字段名称</th>
            <th>组件类型</th>
            <th>字段标识</th>
            <th>默认值</th>
            <th>占位提示</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in formItems" :key="item.model || idx">
            <td>{{ item.label || '-' }}</td>
            <td>{{ item.type || '-' }}</td>
            <td class="mono-cell" :title="item.model">{{ item.model || '-' }}</td>
            <td>{{ (item.options && item.options.defaultValue) || '-' }}</td>
            <td>{{ (item.options && item.options.placeholder) || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </el-card>

    <!-- 表单设计器 -->
    <div class="form-design-page">
      <v-form-designer
        v-if="designerReady"
        ref="vfDesigner"
        v-loading="loading"
        :designer-config="designerConfig"
        class="form-designer"
      />
    </div>

    <!-- 保存按钮 -->
    <div class="btn-box">
      <el-button type="primary" size="medium" @click="handleForm">保存表单</el-button>
    </div>

    <!-- 系统表单信息弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="表单名称" prop="formName">
          <el-input v-model="form.formName" placeholder="请输入表单名称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" :loading="btnLoading" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { addForm, getForm, updateForm } from "@/api/flowable/form";

export default {
  name: "flowForm",
  data() {
    return {
      loading: false,
      btnLoading: false,
      designerReady: false,
      pendingFormJson: null,
      dialogTitle: '',
      dialogVisible: false,
      // 表单校验
      rules: {
        formName: [
          { required: true, message: "表单名称不能为空", trigger: "blur" }
        ]
      },
      // 表单参数
      form: {
        formId: null,
        formName: null,
        formContent: null,
        remark: null
      },
      designerConfig: {
        generateSFCButton: false,
        exportCodeButton: false,
        toolbarMaxWidth: 320,
        toolbarMinWidth: 300,
        formHeader: false,
      },
    }
  },
  computed: {
    formItems() {
      const json = this.pendingFormJson
      if (!json) return []
      return Array.isArray(json.widgetList) ? json.widgetList : []
    }
  },
  watch: {
    '$route.fullPath': {
      handler() {
        this.loadByRoute()
      },
      immediate: true
    }
  },
  mounted() {
    // 等待 VFormDesigner 脚本加载完成后再渲染
    this.$vFormReady.then(() => {
      this.$nextTick(() => {
        this.designerReady = true
        this.applyFormJson()
      })
    })
  },
  methods: {
    currentFormId() {
      const q = this.$route.query
      return Array.isArray(q.formId) ? q.formId[0] : q.formId
    },
    hasFormId(formId) {
      return formId !== undefined && formId !== null && formId !== '' && formId !== 'null'
    },
    loadByRoute() {
      const formId = this.currentFormId()
      if (this.hasFormId(formId)) {
        this.getFormData(formId)
      } else {
        this.resetDesigner()
      }
    },
    resetDesigner() {
      this.form = {
        formId: null,
        formName: null,
        formContent: null,
        remark: null
      }
      this.pendingFormJson = null
      if (this.$refs.vfDesigner) {
        this.$refs.vfDesigner.setFormJson({
          widgetList: [],
          formConfig: {
            modelName: "formData",
            refName: "vForm",
            rulesName: "rules",
            labelWidth: 80,
            labelPosition: "left",
            size: "",
            labelAlign: "label-left-align",
            cssCode: "",
            customClass: "",
            functions: "",
            layoutType: "PC",
            onFormCreated: "",
            onFormMounted: "",
            onFormDataChange: "",
            onFormValidate: ""
          }
        })
      }
    },
    getFormData(formId) {
      this.loading = true
      getForm(formId).then(res => {
        this.form.formId = res.formId || formId
        this.form.formName = res.formName || ''
        this.form.remark = res.remark || ''
        this.form.formContent = res.formContent || ''
        this.pendingFormJson = res.formContent ? JSON.parse(res.formContent) : null
        this.applyFormJson()
      }).finally(() => {
        this.loading = false
      })
    },
    applyFormJson() {
      this.$nextTick(() => {
        if (!this.designerReady || !this.pendingFormJson) return
        this.$refs.vfDesigner.setFormJson(this.pendingFormJson)
        // 二次加载确保渲染完成
        setTimeout(() => {
          if (this.$refs.vfDesigner && this.pendingFormJson) {
            this.$refs.vfDesigner.setFormJson(this.pendingFormJson)
          }
        }, 300)
      })
    },
    // 保存表单数据
    handleForm() {
      const formJson = this.$refs.vfDesigner && this.$refs.vfDesigner.getFormJson()
      if (!formJson) {
        this.$message.warning("表单数据还未加载完成")
        return
      }
      this.form.formContent = JSON.stringify(formJson)
      this.dialogTitle = '保存表单'
      this.dialogVisible = true
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs.formRef.validate(valid => {
        if (!valid) return
        this.btnLoading = true
        const request = this.form.formId != null ? updateForm(this.form) : addForm(this.form)
        request.then(() => {
          this.$modal.msgSuccess(this.form.formId != null ? "修改成功" : "新增成功")
          this.dialogVisible = false
          // 关闭当前标签页并返回上个页面
          const obj = { path: "/flowable/task/form", query: { t: Date.now() } }
          this.$tab.closeOpenPage(obj)
        }).finally(() => {
          this.btnLoading = false
        })
      })
    },
    // 取消按钮
    cancel() {
      this.dialogVisible = false
      this.$refs.formRef && this.$refs.formRef.resetFields()
    },
  }
}
</script>

<style lang="scss" scoped>
.flowable-form-build-page {
  position: relative;
}

.form-info-card {
  margin: 16px 20px 0;
}

.form-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.form-info-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.form-info-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
}

.form-content-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 12px;
}

.form-content-table th,
.form-content-table td {
  border: 1px solid #ebeef5;
  padding: 12px 10px;
  text-align: center;
  color: #303133;
  font-size: 14px;
  line-height: 20px;
  word-break: break-all;
}

.form-content-table th {
  background: #fafafa;
  font-weight: 600;
}

.mono-cell {
  font-family: Consolas, Monaco, "Courier New", monospace;
}

.form-design-page {
  height: calc(100vh - 310px);
  min-height: 460px;
  overflow: hidden;
  margin: 12px 20px 0;
}

.form-designer {
  height: 100%;
}

.btn-box {
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
}

body {
  margin: 0;
}

.el-container.main-container {
  background: #fff;
  margin-left: 0 !important;
}
</style>
