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
    <el-dialog
      :title="form.id?'编辑打印模板':'新增打印模板'"
      :visible.sync="editVisible"
      width="94%"
      top="3vh"
      custom-class="print-edit-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="86px" size="small">
        <div class="basic-panel">
          <el-row :gutter="14">
            <el-col :xs="24" :sm="8" :md="6">
              <el-form-item label="业务类型" prop="bizType">
                <el-select v-model="form.bizType" style="width:100%" @change="onBizTypeChange">
                  <el-option v-for="(v,k) in bizMap" :key="k" :label="`${k} ${v}`" :value="k" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8" :md="6">
              <el-form-item label="纸张大小">
                <el-select v-model="form.paperSize" style="width:100%" @change="onVisualChange">
                  <el-option label="A4" value="A4" />
                  <el-option label="100 × 180 mm（热敏）" value="100x180" />
                  <el-option label="100 × 100 mm" value="100x100" />
                  <el-option label="100 × 60 mm" value="100x60" />
                  <el-option label="60 × 40 mm" value="60x40" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="4" :md="4">
              <el-form-item label="打印份数"><el-input-number v-model="form.copies" :min="1" :max="10" controls-position="right" /></el-form-item>
            </el-col>
            <el-col :xs="12" :sm="4" :md="4">
              <el-form-item label="设为默认"><el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" /></el-form-item>
            </el-col>
            <el-col :xs="12" :sm="4" :md="4">
              <el-form-item label="状态">
                <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="模板名称" prop="name"><el-input v-model="form.name" placeholder="例如：入库单-A4-默认" /></el-form-item>
        </div>

        <el-alert
          title="不需要编辑代码：在左侧勾选要打印的内容，右侧会立即显示效果。"
          type="success"
          :closable="false"
          show-icon
          class="friendly-tip"
        />

        <el-row :gutter="16" class="visual-editor">
          <el-col :xs="24" :md="13" class="settings-column">
            <div class="editor-card">
              <div class="card-title"><i class="el-icon-setting" /> 页面设置</div>
              <el-form-item label="页面标题" class="compact-form-item">
                <el-input v-model="visualConfig.title" maxlength="30" show-word-limit @input="onVisualChange" />
              </el-form-item>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="排版风格" class="compact-form-item">
                    <el-select v-model="visualConfig.density" style="width:100%" @change="onVisualChange">
                      <el-option label="标准清晰" value="standard" />
                      <el-option label="紧凑省纸" value="compact" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="正文字号" class="compact-form-item">
                    <el-radio-group v-model="visualConfig.fontSize" size="mini" @change="onVisualChange">
                      <el-radio-button :label="12">小</el-radio-button>
                      <el-radio-button :label="14">中</el-radio-button>
                      <el-radio-button :label="16">大</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <div class="editor-card">
              <div class="card-title">
                <span><i class="el-icon-document" /> 单据信息</span>
                <span class="card-subtitle">勾选后显示</span>
              </div>
              <el-checkbox-group v-model="visualConfig.infoFields" class="option-grid" @change="onVisualChange">
                <el-checkbox v-for="item in currentSchema.info" :key="item.key" :label="item.key">{{ item.label }}</el-checkbox>
              </el-checkbox-group>
            </div>

            <div class="editor-card">
              <div class="card-title">
                <span><i class="el-icon-menu" /> 商品明细列</span>
                <span class="card-subtitle">可按需精简</span>
              </div>
              <el-checkbox-group v-model="visualConfig.columns" class="option-grid" @change="onVisualChange">
                <el-checkbox v-for="item in currentSchema.columns" :key="item.key" :label="item.key">{{ item.label }}</el-checkbox>
              </el-checkbox-group>
              <div v-if="!visualConfig.columns.length" class="field-warning">请至少选择一列商品明细</div>
            </div>

            <div class="editor-card">
              <div class="card-title"><i class="el-icon-finished" /> 页尾内容</div>
              <div class="footer-options">
                <el-checkbox v-if="currentSchema.totalKey || currentSchema.totalFields" v-model="visualConfig.showTotal" @change="onVisualChange">显示数量合计</el-checkbox>
                <el-checkbox v-if="currentSchema.hasRemark" v-model="visualConfig.showRemark" @change="onVisualChange">显示备注</el-checkbox>
                <el-checkbox v-model="visualConfig.showPrintTime" @change="onVisualChange">显示打印时间</el-checkbox>
                <el-checkbox v-model="visualConfig.showSignature" @change="onVisualChange">显示签字栏</el-checkbox>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :md="11" class="preview-column">
            <div class="preview-head">
              <span><i class="el-icon-view" /> 实时效果预览</span>
              <el-tag size="mini" type="info">示例数据</el-tag>
            </div>
            <div class="preview-shell">
              <div class="preview-paper" :class="`paper-${form.paperSize}`">
                <div v-html="visualPreviewHtml" />
              </div>
            </div>
          </el-col>
        </el-row>

        <el-collapse v-model="advancedOpen" class="advanced-panel">
          <el-collapse-item name="html">
            <template slot="title">
              <span class="advanced-title"><i class="el-icon-s-tools" /> 高级设置（技术人员使用）</span>
              <span class="advanced-desc">需要特殊版式时再编辑模板源码</span>
            </template>
            <el-alert
              v-if="editorSource === 'advanced'"
              title="当前预览来自自定义源码。修改上方任一可视化设置后，将切换为标准可视化模板。"
              type="warning"
              :closable="false"
              show-icon
              class="advanced-alert"
            />
            <el-form-item label="模板源码" prop="templateHtml">
              <el-input
                v-model="form.templateHtml"
                type="textarea"
                :rows="12"
                class="code-editor"
                @input="onAdvancedHtmlInput"
              />
              <div class="code-help">仅建议熟悉 HTML 的技术人员修改。日常调整请使用上方中文选项。</div>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>

        <el-form-item label="管理备注" class="remark-item"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="仅供后台管理人员查看，不会打印到单据上" /></el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <span class="save-hint"><i class="el-icon-info" /> 保存后可在列表中点击“预览”用真实单据检查</span>
        <span>
          <el-button size="small" @click="editVisible=false">取消</el-button>
          <el-button type="primary" size="small" :loading="saving" @click="onSubmit">保存模板</el-button>
        </span>
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
        <iframe ref="previewFrame" style="width:100%;height:100%;border:0" />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { printApi } from '@/api/warehouse';
import { doPrint } from '../components/printUtil';

const VISUAL_MARKER = 'WMS_VISUAL_CONFIG:';

export default {
  name: 'WarehousePrintTemplate',
  data() {
    return {
      loading: false,
      saving: false,
      total: 0,
      tableData: [],
      query: { page: 1, limit: 50, bizType: '' },
      editVisible: false,
      form: this.emptyForm(),
      visualConfig: this.emptyVisualConfig(),
      editorSource: 'visual',
      advancedOpen: [],
      previewVisible: false,
      previewRow: {},
      previewDocId: 1,
      bizMap: {
        IN: '入库单', QC: '质检单', OUT: '出库单', PK: '拣货单', RV: '复核单', CK: '盘点单',
        DL: '发货面单', BOX: '箱唛', SN: '序列号标签', LABEL: '商品标签',
      },
      schemas: {
        IN: {
          info: [
            { key: 'code', label: '入库单号' }, { key: 'warehouseName', label: '仓库' },
            { key: 'type', label: '入库类型' }, { key: 'applyUserName', label: '入库人' },
            { key: 'createTime', label: '创建时间' },
          ],
          columns: [
            { key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' },
            { key: 'goodsName', label: '商品名称' }, { key: 'plan', label: '应入数量' },
            { key: 'num', label: '实入数量' }, { key: 'productionDate', label: '生产日期' },
            { key: 'expiryDate', label: '有效期' },
          ],
          totalKey: 'totalNum', totalLabel: '入库合计', hasRemark: true,
        },
        QC: {
          info: [
            { key: 'code', label: '质检单号' }, { key: 'inboundCode', label: '关联入库单' },
            { key: 'warehouseName', label: '仓库' }, { key: 'inspectorName', label: '质检员' },
            { key: 'inspectorPhone', label: '联系方式' }, { key: 'statusText', label: '单据状态' },
            { key: 'resultText', label: '质检结果' }, { key: 'createTime', label: '创建时间' },
          ],
          columns: [
            { key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' },
            { key: 'goodsName', label: '商品名称' }, { key: 'sku', label: '规格' },
            { key: 'qtyReceived', label: '送检数量' }, { key: 'qtyPass', label: '合格数量' },
            { key: 'qtyFail', label: '不合格数量' }, { key: 'dispositionText', label: '处置方式' },
            { key: 'failReason', label: '不合格原因' },
          ],
          totalFields: [
            { key: 'totalReceived', label: '送检合计' },
            { key: 'totalPass', label: '合格合计' },
            { key: 'totalFail', label: '不合格合计' },
          ],
          totalKey: '', totalLabel: '', hasRemark: true,
        },
        OUT: {
          info: [
            { key: 'code', label: '出库单号' }, { key: 'warehouseName', label: '仓库' },
            { key: 'applyUserName', label: '出库人' }, { key: 'createTime', label: '创建时间' },
          ],
          columns: [
            { key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' },
            { key: 'goodsName', label: '商品名称' }, { key: 'num', label: '出库数量' },
          ],
          totalKey: '', totalLabel: '', hasRemark: true,
        },
        PK: {
          info: [
            { key: 'code', label: '拣货单号' }, { key: 'waveCode', label: '波次号' },
            { key: 'outboundCode', label: '出库单号' }, { key: 'pickerName', label: '拣货员' },
            { key: 'warehouseName', label: '仓库' }, { key: 'createTime', label: '创建时间' },
          ],
          columns: [
            { key: '_index', label: '序号' }, { key: 'locationCode', label: '库位' },
            { key: 'batchNo', label: '批次' }, { key: 'productId', label: '商品ID' },
            { key: 'goodsName', label: '商品名称' }, { key: 'planNum', label: '应拣数量' },
            { key: 'actualPick', label: '实拣（手填）' },
          ],
          totalKey: '', totalLabel: '', hasRemark: false,
        },
        RV: {
          info: [
            { key: 'code', label: '复核单号' }, { key: 'pickOrderCode', label: '拣货单号' },
            { key: 'reviewerName', label: '复核员' }, { key: 'warehouseName', label: '仓库' },
          ],
          columns: [
            { key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' },
            { key: 'goodsName', label: '商品名称' }, { key: 'pickedNum', label: '拣货数量' },
            { key: 'reviewedNum', label: '复核数量' },
          ],
          totalKey: '', totalLabel: '', hasRemark: false,
        },
        CK: {
          info: [
            { key: 'code', label: '盘点单号' }, { key: 'warehouseName', label: '仓库' },
            { key: 'checkPeople', label: '盘点人' }, { key: 'createTime', label: '创建时间' },
          ],
          columns: [
            { key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' },
            { key: 'bookStock', label: '账面库存' }, { key: 'actualStock', label: '实际库存' },
            { key: 'diffNum', label: '差异数量' },
          ],
          totalKey: '', totalLabel: '', hasRemark: false,
        },
        DL: {
          info: [
            { key: 'code', label: '发货单号' }, { key: 'warehouseName', label: '仓库' },
            { key: 'supplierName', label: '供应商' }, { key: 'expressCompany', label: '快递公司' },
            { key: 'expressNo', label: '快递单号' }, { key: 'createTime', label: '创建时间' },
          ],
          columns: [
            { key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' },
            { key: 'goodsName', label: '商品名称' }, { key: 'num', label: '发货数量' },
          ],
          totalKey: '', totalLabel: '', hasRemark: false,
        },
        BOX: {
          info: [
            { key: 'code', label: '箱唛编号' }, { key: 'boxLabel', label: '箱号/总箱数' },
            { key: 'outboundCode', label: '出库单号' }, { key: 'warehouseName', label: '仓库' },
            { key: 'expressCompany', label: '承运商' }, { key: 'expressNo', label: '承运单号' },
            { key: 'sizeText', label: '箱体尺寸' }, { key: 'weightKg', label: '实重(kg)' },
            { key: 'volumeWeightKg', label: '体积重(kg)' }, { key: 'chargeWeightKg', label: '计费重(kg)' },
            { key: 'packUserName', label: '装箱人' },
          ],
          columns: [
            { key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' },
            { key: 'goodsName', label: '商品名称' }, { key: 'batchNo', label: '批次' },
            { key: 'num', label: '数量' },
          ],
          totalKey: 'totalNum', totalLabel: '装箱合计', hasRemark: true,
        },
        SN: {
          info: [{ key: 'code', label: '序列号' }, { key: 'goodsName', label: '商品名称' }],
          columns: [{ key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' }, { key: 'goodsName', label: '商品名称' }],
          totalKey: '', totalLabel: '', hasRemark: false,
        },
        LABEL: {
          info: [{ key: 'code', label: '商品编码' }, { key: 'goodsName', label: '商品名称' }],
          columns: [{ key: '_index', label: '序号' }, { key: 'productId', label: '商品ID' }, { key: 'goodsName', label: '商品名称' }],
          totalKey: '', totalLabel: '', hasRemark: false,
        },
      },
      rules: {
        bizType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
        name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
        templateHtml: [{ required: true, message: '模板内容不能为空', trigger: 'blur' }],
      },
    };
  },
  computed: {
    currentSchema() {
      return this.schemas[this.form.bizType] || this.schemas.IN;
    },
    visualPreviewHtml() {
      return this.renderSample(this.form.templateHtml || this.generateTemplateHtml());
    },
  },
  created() { this.load(); },
  methods: {
    emptyForm() {
      return { id: null, bizType: 'IN', name: '', paperSize: 'A4', templateHtml: '', copies: 1, status: 1, isDefault: 0, remark: '' };
    },
    emptyVisualConfig() {
      return {
        title: '入库单', density: 'standard', fontSize: 14,
        infoFields: [], columns: [], showTotal: true, showRemark: true,
        showPrintTime: true, showSignature: true,
      };
    },
    defaultPaper(bizType) {
      if (bizType === 'DL') return '100x180';
      if (bizType === 'BOX') return '100x100';
      if (bizType === 'SN' || bizType === 'LABEL') return '60x40';
      return 'A4';
    },
    buildDefaultVisualConfig(bizType) {
      const schema = this.schemas[bizType] || this.schemas.IN;
      return {
        title: this.bizMap[bizType] || '打印单据',
        density: this.defaultPaper(bizType) === 'A4' ? 'standard' : 'compact',
        fontSize: this.defaultPaper(bizType) === 'A4' ? 14 : 12,
        infoFields: schema.info.map(item => item.key),
        columns: schema.columns.map(item => item.key),
        showTotal: Boolean(schema.totalKey || schema.totalFields),
        showRemark: Boolean(schema.hasRemark),
        showPrintTime: true,
        showSignature: ['IN', 'QC', 'OUT', 'PK', 'RV', 'CK'].includes(bizType),
      };
    },
    async load() {
      this.loading = true;
      try {
        const r = await printApi.page(this.query);
        this.tableData = (r && r.list) || [];
        this.total = (r && r.total) || 0;
      } finally { this.loading = false; }
    },
    openEdit(row) {
      this.advancedOpen = [];
      if (row) {
        this.form = { ...row };
        const parsed = this.parseVisualConfig(row.templateHtml, row.bizType);
        this.visualConfig = parsed.config;
        this.editorSource = parsed.fromMarker ? 'visual' : 'advanced';
      } else {
        this.form = this.emptyForm();
        this.form.paperSize = this.defaultPaper(this.form.bizType);
        this.form.name = `${this.bizMap[this.form.bizType]}-${this.form.paperSize}`;
        this.visualConfig = this.buildDefaultVisualConfig(this.form.bizType);
        this.editorSource = 'visual';
        this.form.templateHtml = this.generateTemplateHtml();
      }
      this.editVisible = true;
      this.$nextTick(() => { if (this.$refs.formRef) this.$refs.formRef.clearValidate(); });
    },
    onBizTypeChange(bizType) {
      this.form.paperSize = this.defaultPaper(bizType);
      this.visualConfig = this.buildDefaultVisualConfig(bizType);
      if (!this.form.id || !this.form.name) this.form.name = `${this.bizMap[bizType]}-${this.form.paperSize}`;
      this.onVisualChange();
    },
    onVisualChange() {
      this.editorSource = 'visual';
      this.form.templateHtml = this.generateTemplateHtml();
    },
    onAdvancedHtmlInput() {
      this.editorSource = 'advanced';
    },
    parseVisualConfig(html, bizType) {
      const fallback = this.buildDefaultVisualConfig(bizType);
      if (!html) return { config: fallback, fromMarker: false };
      const marker = html.match(/<!--WMS_VISUAL_CONFIG:([\s\S]*?)-->/);
      if (marker) {
        try {
          const saved = JSON.parse(decodeURIComponent(marker[1]));
          return { config: this.normalizeConfig(saved, bizType), fromMarker: true };
        } catch (e) { /* 使用下方的兼容识别 */ }
      }
      const schema = this.schemas[bizType] || this.schemas.IN;
      const beforeItems = html.split('{{#each items}}')[0];
      const itemMatch = html.match(/\{\{#each\s+items\}\}([\s\S]*?)\{\{\/each\}\}/);
      const itemHtml = itemMatch ? itemMatch[1] : '';
      const heading = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)
        || html.match(/<div[^>]*text-align\s*:\s*center[^>]*>([\s\S]*?)<\/div>/i);
      const title = heading ? heading[1].replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, '').trim() : fallback.title;
      const config = {
        ...fallback,
        title: title || fallback.title,
        infoFields: schema.info.filter(item => beforeItems.includes(`{{${item.key}}}`)).map(item => item.key),
        columns: schema.columns.filter(item => itemHtml.includes(`{{${item.key}}}`)).map(item => item.key),
        showTotal: Boolean(
          (schema.totalKey && html.includes(`{{${schema.totalKey}}}`))
          || (schema.totalFields && schema.totalFields.some(item => html.includes(`{{${item.key}}}`)))
        ),
        showRemark: html.includes('{{remark}}'),
        showPrintTime: html.includes('{{printTime}}'),
        showSignature: /签字|_{4,}/.test(html),
      };
      if (!config.infoFields.length) config.infoFields = fallback.infoFields;
      if (!config.columns.length) config.columns = fallback.columns;
      return { config, fromMarker: false };
    },
    normalizeConfig(saved, bizType) {
      const fallback = this.buildDefaultVisualConfig(bizType);
      const schema = this.schemas[bizType] || this.schemas.IN;
      const infoKeys = schema.info.map(item => item.key);
      const columnKeys = schema.columns.map(item => item.key);
      const fontSize = [12, 14, 16].includes(Number(saved.fontSize)) ? Number(saved.fontSize) : fallback.fontSize;
      return {
        ...fallback,
        ...saved,
        title: saved.title || fallback.title,
        density: saved.density === 'compact' ? 'compact' : 'standard',
        fontSize,
        infoFields: Array.isArray(saved.infoFields) ? saved.infoFields.filter(key => infoKeys.includes(key)) : fallback.infoFields,
        columns: Array.isArray(saved.columns) ? saved.columns.filter(key => columnKeys.includes(key)) : fallback.columns,
      };
    },
    escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    generateTemplateHtml() {
      const schema = this.currentSchema;
      const cfg = this.visualConfig;
      const compact = cfg.density === 'compact';
      const padding = compact ? 8 : 20;
      const cellPadding = compact ? 4 : 7;
      const titleSize = Number(cfg.fontSize) + (compact ? 6 : 10);
      const info = schema.info.filter(item => cfg.infoFields.includes(item.key));
      const columns = schema.columns.filter(item => cfg.columns.includes(item.key));
      const markerConfig = {
        title: cfg.title, density: cfg.density, fontSize: cfg.fontSize,
        infoFields: cfg.infoFields, columns: cfg.columns, showTotal: cfg.showTotal,
        showRemark: cfg.showRemark, showPrintTime: cfg.showPrintTime, showSignature: cfg.showSignature,
      };
      const marker = `<!--${VISUAL_MARKER}${encodeURIComponent(JSON.stringify(markerConfig))}-->`;
      const infoRows = [];
      for (let i = 0; i < info.length; i += 2) {
        const cells = info.slice(i, i + 2).map(item => `<td style="padding:${cellPadding}px 6px"><span style="color:#606266">${item.label}：</span>${item.key === 'code' ? '<b>' : ''}{{${item.key}}}${item.key === 'code' ? '</b>' : ''}</td>`).join('');
        infoRows.push(`<tr>${cells}${i + 1 === info.length ? '<td></td>' : ''}</tr>`);
      }
      const table = columns.length ? `
  <table border="1" cellspacing="0" cellpadding="${cellPadding}" style="width:100%;border-collapse:collapse;font-size:${cfg.fontSize}px;color:#000">
    <thead style="background:#f2f3f5;font-weight:bold"><tr>${columns.map(item => `<th style="padding:${cellPadding}px 4px;text-align:center;vertical-align:middle">${item.label}</th>`).join('')}</tr></thead>
    <tbody>
      {{#each items}}
      <tr>${columns.map(item => `<td style="padding:${cellPadding}px 4px;text-align:center;vertical-align:middle;${item.key === '_index' ? 'width:38px;' : ''}">{{${item.key}}}</td>`).join('')}</tr>
      {{/each}}
    </tbody>
  </table>` : '';
      const footer = [];
      if (cfg.showTotal && schema.totalFields) {
        footer.push(`<div style="margin-top:${cellPadding + 3}px;display:flex;gap:28px">${schema.totalFields.map(item => `<span>${item.label}：<b>{{${item.key}}}</b></span>`).join('')}</div>`);
      } else if (cfg.showTotal && schema.totalKey) {
        footer.push(`<div style="margin-top:${cellPadding + 3}px">${schema.totalLabel}：<b>{{${schema.totalKey}}}</b> 件</div>`);
      }
      if (cfg.showRemark && schema.hasRemark) footer.push(`<div style="margin-top:${cellPadding + 1}px">备注：{{remark}}</div>`);
      if (cfg.showSignature) footer.push('<div style="margin-top:28px;display:flex;justify-content:space-between"><span>制单人：____________</span><span>经办人：____________</span></div>');
      if (cfg.showPrintTime) footer.push('<div style="margin-top:8px;text-align:right;color:#606266">打印时间：{{printTime}}</div>');
      return `${marker}
<div style="font-family:SimSun,Microsoft YaHei,sans-serif;padding:${padding}px;color:#000;font-size:${cfg.fontSize}px;line-height:1.5">
  <h2 style="text-align:center;margin:0 0 ${compact ? 8 : 16}px;font-size:${titleSize}px;color:#000">${this.escapeHtml(cfg.title || this.bizMap[this.form.bizType])}</h2>
  ${infoRows.length ? `<table style="width:100%;font-size:${cfg.fontSize}px;margin-bottom:${compact ? 6 : 12}px;color:#000">${infoRows.join('')}</table>` : ''}${table}
  ${footer.join('\n  ')}
</div>`;
    },
    renderSample(html) {
      const sample = {
        code: `${this.form.bizType || 'IN'}202608070001`, warehouseName: '总仓 / 上海仓', type: '采购入库',
        applyUserName: '张三', createTime: '2026-08-07 10:30:00', printTime: '2026-08-07 14:20:00',
        remark: '外箱完好，请按批次上架', outboundCode: 'OUT202608070012', waveCode: 'WV20260807003',
        pickerName: '李四', pickOrderCode: 'PK202608070006', reviewerName: '王五', checkPeople: '赵六',
        supplierName: '示例供应商', expressCompany: '顺丰速运', expressNo: 'SF1234567890',
        boxLabel: '1 / 3', sizeText: '60×40×35 cm', weightKg: '12.6', volumeWeightKg: '16.8',
        chargeWeightKg: '16.8', packUserName: '陈七', totalNum: '28',
        inboundCode: 'IN202608070006', inspectorName: '张质检', inspectorPhone: '13800000000',
        statusText: '已完成', resultText: '存在不合格', totalReceived: 28, totalPass: 26, totalFail: 2,
      };
      const rows = [
        { _index: 1, productId: 1001, goodsName: '示例商品A', sku: '红色,XL', plan: 10, num: 10, productionDate: '2026-08-01', expiryDate: '2027-08-01', locationCode: 'A01-01-01', batchNo: 'B20260801', planNum: 10, actualPick: '', pickedNum: 10, reviewedNum: 10, bookStock: 50, actualStock: 50, diffNum: 0, qtyReceived: 10, qtyPass: 10, qtyFail: 0, dispositionText: '合格入库', failReason: '' },
        { _index: 2, productId: 1002, goodsName: '示例商品B', sku: '蓝色,L', plan: 18, num: 18, productionDate: '2026-08-02', expiryDate: '2027-08-02', locationCode: 'A01-01-02', batchNo: 'B20260802', planNum: 18, actualPick: '', pickedNum: 18, reviewedNum: 18, bookStock: 30, actualStock: 29, diffNum: -1, qtyReceived: 18, qtyPass: 16, qtyFail: 2, dispositionText: '转不合格区', failReason: '外观破损' },
      ];
      let result = String(html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
      result = result.replace(/\{\{#each\s+items\}\}([\s\S]*?)\{\{\/each\}\}/g, (all, block) => rows.map(row => this.replaceVars(block, { ...sample, ...row })).join(''));
      return this.replaceVars(result, sample);
    },
    replaceVars(html, data) {
      return String(html).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (all, key) => this.escapeHtml(data[key] == null ? '' : data[key]));
    },
    async onSubmit() {
      if (!this.visualConfig.columns.length && this.editorSource === 'visual') {
        this.$message.warning('请至少选择一列商品明细');
        return;
      }
      await this.$refs.formRef.validate();
      this.saving = true;
      try {
        this.form.id ? await printApi.edit(this.form) : await printApi.add(this.form);
        this.$message.success('模板已保存');
        this.editVisible = false;
        this.load();
      } finally { this.saving = false; }
    },
    onDelete(row) {
      this.$confirm(`删除模板「${row.name}」?`, '提示', { type: 'warning' })
        .then(async () => { await printApi.del(row.id); this.$message.success('已删除'); this.load(); }).catch(() => {});
    },
    openPreview(row) {
      this.previewRow = row;
      this.previewDocId = 1;
      this.previewVisible = true;
      this.$nextTick(this.doPreview);
    },
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
.basic-panel { padding: 14px 14px 0; background: #f7f8fa; border: 1px solid #ebeef5; border-radius: 6px; }
.friendly-tip { margin: 14px 0; }
.visual-editor { display: flex; align-items: stretch; }
.settings-column, .preview-column { display: flex; flex-direction: column; }
.editor-card { margin-bottom: 12px; padding: 14px 16px; border: 1px solid #ebeef5; border-radius: 6px; background: #fff; }
.card-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; color: #303133; font-size: 14px; font-weight: 600; }
.card-title i { margin-right: 5px; color: #409eff; }
.card-subtitle { color: #909399; font-size: 12px; font-weight: 400; }
.compact-form-item { margin-bottom: 10px; }
.option-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 10px; }
.option-grid .el-checkbox { margin-right: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.footer-options { display: flex; flex-wrap: wrap; gap: 10px 24px; }
.footer-options .el-checkbox { margin-right: 0; }
.field-warning { margin-top: 8px; color: #e6a23c; font-size: 12px; }
.preview-column { padding-bottom: 12px; }
.preview-head { display: flex; justify-content: space-between; align-items: center; height: 42px; padding: 0 14px; color: #303133; font-size: 14px; font-weight: 600; background: #f5f7fa; border: 1px solid #dcdfe6; border-bottom: 0; border-radius: 6px 6px 0 0; }
.preview-head i { margin-right: 5px; color: #409eff; }
.preview-shell { flex: 1; min-height: 530px; max-height: 630px; padding: 20px; overflow: auto; background: #e9edf2; border: 1px solid #dcdfe6; border-radius: 0 0 6px 6px; }
.preview-paper { width: 100%; min-height: 500px; margin: 0 auto; overflow: hidden; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.1); }
.preview-paper.paper-100x180 { max-width: 390px; min-height: 560px; }
.preview-paper.paper-100x100 { max-width: 390px; min-height: 390px; }
.preview-paper.paper-100x60 { max-width: 420px; min-height: 250px; }
.preview-paper.paper-60x40 { max-width: 360px; min-height: 240px; }
.advanced-panel { margin-top: 2px; border: 1px solid #ebeef5; border-radius: 6px; }
.advanced-panel >>> .el-collapse-item__header { padding: 0 16px; border-bottom: 0; border-radius: 6px; }
.advanced-panel >>> .el-collapse-item__wrap { border-bottom: 0; }
.advanced-panel >>> .el-collapse-item__content { padding: 0 16px 16px; }
.advanced-title { color: #606266; font-weight: 600; }
.advanced-title i { margin-right: 5px; }
.advanced-desc { margin-left: 12px; color: #909399; font-size: 12px; }
.advanced-alert { margin-bottom: 12px; }
.code-editor >>> textarea { font-family: Consolas, Monaco, monospace; font-size: 12px; line-height: 1.6; }
.code-help { margin-top: 5px; color: #909399; font-size: 12px; }
.remark-item { margin-top: 14px; margin-bottom: 0; }
.dialog-footer { display: flex; justify-content: space-between; align-items: center; }
.save-hint { color: #909399; font-size: 12px; }
@media (max-width: 992px) {
  .visual-editor { display: block; }
  .option-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .preview-shell { min-height: 420px; }
  .save-hint { display: none; }
  .dialog-footer { justify-content: flex-end; }
}
</style>
