<template>
  <div class="app-container">
    <el-form :inline="true" size="small" class="filter-container">
      <el-form-item label="业务代码">
        <el-select v-model="query.bizType" clearable style="width:140px" @change="load">
          <el-option v-for="(v,k) in bizMap" :key="k" :label="`${k} ${v}`" :value="k" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="load">查询</el-button></el-form-item>
      <el-form-item><el-button type="primary" icon="el-icon-plus" @click="openEdit()">新增模板</el-button></el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="业务" width="140">
        <template slot-scope="{row}">{{ row.bizType }} <el-tag size="mini" style="margin-left:4px">{{ bizMap[row.bizType] || '-' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="name" label="模板名称" min-width="180" />
      <el-table-column prop="paperSize" label="纸张" width="120" />
      <el-table-column prop="copies" label="份数" width="70" />
      <el-table-column label="默认" width="80">
        <template slot-scope="{row}"><el-tag v-if="row.isDefault===1" type="success" size="mini">默认</el-tag></template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template slot-scope="{row}"><el-tag :type="row.status===1?'success':'info'" size="mini">{{ row.status===1?'启用':'停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openEdit(row)">编辑</el-button>
          <el-button type="text" @click="openPreview(row)">预览</el-button>
          <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page" :page-size.sync="query.limit" :total="total"
      layout="total, prev, pager, next" @current-change="load"
    />

    <!-- 新增/编辑 -->
    <el-dialog :title="form.id?'编辑模板':'新增模板'" :visible.sync="editVisible" width="960px" top="5vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small">
        <el-row :gutter="8">
          <el-col :span="8">
            <el-form-item label="业务代码" prop="bizType">
              <el-select v-model="form.bizType" style="width:100%">
                <el-option v-for="(v,k) in bizMap" :key="k" :label="`${k} ${v}`" :value="k" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8"><el-form-item label="纸张">
            <el-select v-model="form.paperSize" style="width:100%">
              <el-option label="A4" value="A4" />
              <el-option label="100 × 180 mm (热敏)" value="100x180" />
              <el-option label="100 × 100 mm" value="100x100" />
              <el-option label="100 × 60 mm" value="100x60" />
              <el-option label="60 × 40 mm" value="60x40" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="4"><el-form-item label="份数"><el-input-number v-model="form.copies" :min="1" :max="10" /></el-form-item></el-col>
          <el-col :span="4"><el-form-item label="默认">
            <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
          </el-form-item></el-col>
        </el-row>
        <el-form-item label="模板名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="模板 HTML" prop="templateHtml">
          <el-input v-model="form.templateHtml" type="textarea" :rows="16" style="font-family:monospace" />
          <div v-pre style="color:#909399;font-size:12px;margin-top:4px;line-height:1.8">
            变量：<code>{{code}}</code> <code>{{warehouseName}}</code> <code>{{applyUserName}}</code> <code>{{createTime}}</code> <code>{{printTime}}</code> <code>{{remark}}</code>
            <br />循环：<code>{{#each items}} ... {{/each}}</code>，块内可用 <code>{{_index}}</code> <code>{{productId}}</code> <code>{{goodsName}}</code> <code>{{num}}</code>
          </div>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio><el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onSubmit">保存</el-button>
      </div>
    </el-dialog>

    <!-- 预览 -->
    <el-dialog title="模板预览" :visible.sync="previewVisible" width="980px" top="4vh">
      <el-form :inline="true" size="small">
        <el-form-item label="业务">{{ previewRow.bizType }} - {{ bizMap[previewRow.bizType] }}</el-form-item>
        <el-form-item label="用哪张单据 ID 渲染">
          <el-input-number v-model="previewDocId" :min="1" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doPreview">刷新预览</el-button>
          <el-button @click="doOpen">在新窗口打印</el-button>
        </el-form-item>
      </el-form>
      <div style="border:1px solid #dcdfe6;padding:0;height:520px;overflow:auto;background:#fff">
        <iframe ref="previewFrame" style="width:100%;height:100%;border:0"></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { printApi } from '@/api/warehouse';
import { doPrint } from '../components/printUtil';

export default {
  name: 'WarehousePrintTemplate',
  data() {
    return {
      loading: false, total: 0, tableData: [],
      query: { page: 1, limit: 50, bizType: '' },
      editVisible: false, form: this.emptyForm(),
      previewVisible: false, previewRow: {}, previewDocId: 1,
      bizMap: { IN: '入库单', OUT: '出库单', PK: '拣货单', RV: '复核单', CK: '盘点单', DL: '发货面单', BOX: '箱唛', SN: '序列号标签', LABEL: '商品标签' },
      rules: {
        bizType: [{ required: true, message: '请选业务', trigger: 'change' }],
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
        templateHtml: [{ required: true, message: '请输入模板 HTML', trigger: 'blur' }],
      },
    };
  },
  created() { this.load(); },
  methods: {
    emptyForm() { return { id: null, bizType: 'IN', name: '', paperSize: 'A4', templateHtml: '', copies: 1, status: 1, isDefault: 0, remark: '' }; },
    async load() {
      this.loading = true;
      try { const r = await printApi.page(this.query); this.tableData = (r && r.list) || []; this.total = (r && r.total) || 0; }
      finally { this.loading = false; }
    },
    openEdit(row) { this.form = row ? { ...row } : this.emptyForm(); this.editVisible = true; },
    async onSubmit() {
      await this.$refs.formRef.validate();
      this.form.id ? await printApi.edit(this.form) : await printApi.add(this.form);
      this.$message.success('已保存');
      this.editVisible = false;
      this.load();
    },
    onDelete(row) {
      this.$confirm(`删除模板「${row.name}」?`, '提示', { type: 'warning' })
        .then(async () => { await printApi.del(row.id); this.$message.success('已删除'); this.load(); }).catch(() => {});
    },
    openPreview(row) { this.previewRow = row; this.previewDocId = 1; this.previewVisible = true; this.$nextTick(this.doPreview); },
    async doPreview() {
      try {
        const html = await printApi.render(this.previewRow.id, this.previewDocId);
        const doc = this.$refs.previewFrame.contentDocument || this.$refs.previewFrame.contentWindow.document;
        doc.open(); doc.write(html); doc.close();
      } catch (e) { this.$message.error(e.message || '渲染失败'); }
    },
    async doOpen() {
      try { await doPrint(this.previewRow.bizType, this.previewDocId); }
      catch (e) { this.$message.error(e.message || '打印失败'); }
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
</style>
