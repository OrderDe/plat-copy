<template>
  <div class="model-edit-warp" v-loading="loadingXml">
    <div class="model-toolbar">
      <div class="toolbar-left">
        <h3>编辑流程</h3>
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-button icon="el-icon-folder-opened" size="small" @click="openFile">导入</el-button>
          <el-button icon="el-icon-download" size="small" @click="downloadDiagram">导出</el-button>
          <el-button icon="el-icon-check" size="small" @click="checkProcess">流程检查</el-button>
          <el-button icon="el-icon-upload2" type="primary" size="small" @click="updateDiagram">更新</el-button>
        </el-button-group>
        <el-button size="small" @click="close">关 闭</el-button>
      </div>
    </div>
    <div class="model-content">
      <div ref="canvas" class="bpmn-canvas"></div>
      <div class="properties-panel">
        <div class="properties-header">
          <h4>属性面板</h4>
        </div>
        <div id="js-properties-panel" class="bpmn-properties"></div>
      </div>
    </div>

    <input ref="fileInput" type="file" accept=".bpmn,.xml" style="display:none" @change="handleFileImport" />

    <el-dialog title="更新部署流程" :visible.sync="deployDialogVisible" width="500px" append-to-body :close-on-click-modal="false">
      <el-form :model="deployForm" :rules="deployFormRules" ref="deployFormRef" label-width="100px" size="small">
        <el-form-item label="流程名称" prop="processName">
          <el-input v-model="deployForm.processName" placeholder="请输入流程名称" />
        </el-form-item>
        <!-- <el-form-item label="流程标识" prop="key">
          <el-input v-model="deployForm.key" placeholder="请输入流程标识key" />
        </el-form-item>
        <el-form-item label="所属分类">
          <el-input v-model="deployForm.category" placeholder="请输入所属分类" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="deployForm.description" placeholder="请输入描述" :rows="3" />
        </el-form-item> -->
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="deployDialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="deployLoading" @click="confirmDeploy">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import BpmnModeler from 'bpmn-js/lib/Modeler'
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  CamundaPlatformPropertiesProviderModule
} from 'bpmn-js-properties-panel'
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json'
import FileSaver from 'file-saver'
import { deployProcess, getProcessDefinitionXml, getProcessDefinition } from '@/api/ryFlowAble/activiti/model'
import { customTranslate } from '@/translate/index'

import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css'

export default {
  name: 'CamundaModelEdit',
  data() {
    return {
      bpmnModeler: null,
      loadingXml: false,
      processDefinitionId: undefined,
      deployDialogVisible: false,
      deployLoading: false,
      deployForm: {
        processName: '',
        // key: '',
        // category: '',
        // description: ''
      },
      deployFormRules: {
        processName: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
        // key: [{ required: true, message: '请输入流程标识', trigger: 'blur' }]
      }
    }
  },
  created() {
    console.log(this.$route.params)
    this.processDefinitionId = this.$route.params.modelId
  },
  mounted() {
    this.initModeler()
    this.loadById()
  },
  methods: {
    initModeler() {
      this.bpmnModeler = new BpmnModeler({
        container: this.$refs.canvas,
        propertiesPanel: { parent: '#js-properties-panel' },
        additionalModules: [
          BpmnPropertiesPanelModule,
          BpmnPropertiesProviderModule,
          CamundaPlatformPropertiesProviderModule,
          { translate: ['value', customTranslate] }
        ],
        moddleExtensions: { camunda: camundaModdleDescriptor },
        exporter: { name: 'camunda-modeler', version: '1.0.0' }
      })
    },

    // 命名空间转换
    replaceCamundaToActiviti(xml) {
      return xml
        .replace(/xmlns:camunda="http:\/\/camunda.org\/schema\/1.0\/bpmn"/g, 'xmlns:activiti="http://activiti.org/bpmn"')
        .replace(/ deployment-source="camunda-modeler"/g, ' deployment-source="activiti-modeler"')
        .replace(/camunda:/g, 'activiti:')
    },
    replaceActivitiToCamunda(xml) {
      return xml
        .replace(/xmlns:activiti="http:\/\/activiti.org\/bpmn"/g, 'xmlns:camunda="http://camunda.org/schema/1.0/bpmn"')
        .replace(/activiti:/g, 'camunda:')
    },
    ensureCamundaNamespace(xml) {
      if (xml.includes('xmlns:camunda="http://camunda.org/schema/1.0/bpmn"')) return xml
      return xml.replace(
        /<bpmn:definitions(\s[^>]*)?>/,
        (m) => m.replace(/<bpmn:definitions/, '<bpmn:definitions xmlns:camunda="http://camunda.org/schema/1.0/bpmn"')
      )
    },

    // 加载已有流程
    async loadById() {
      if (!this.processDefinitionId) {
        this.$message.error('缺少流程定义ID')
        return
      }
      this.loadingXml = true
      try {
        const [xmlRes, defRes] = await Promise.all([
          getProcessDefinitionXml(this.processDefinitionId),
          getProcessDefinition(this.processDefinitionId)
        ])
        let xml = xmlRes?.bpmn20Xml || xmlRes?.data?.bpmn20Xml || xmlRes
        if (!xml || typeof xml !== 'string') {
          this.$message.error('未获取到有效的BPMN XML')
          return
        }
        // 预填流程名称
        const defDetail = defRes?.data || defRes
        console.log(defDetail.processName)
        if (defDetail?.processName) {
          this.deployForm.processName = defDetail.processName;
        }
        if (defDetail?.key) {
          this.deployForm.key = defDetail.key
        }
        xml = this.replaceActivitiToCamunda(xml)
        xml = this.ensureCamundaNamespace(xml)
        await this.bpmnModeler.importXML(xml)
        this.$nextTick(() => {
          this.bpmnModeler.get('canvas').zoom('fit-viewport')
        })
      } catch (e) {
        console.error(e)
        this.$message.error('加载流程XML失败: ' + (e.message || '未知错误'))
      } finally {
        this.loadingXml = false
      }
    },

    // 导入
    openFile() {
      this.$refs.fileInput && this.$refs.fileInput.click()
    },
    handleFileImport(event) {
      const file = event.target.files && event.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (e) => {
        let xml = e.target.result
        try {
          xml = this.replaceActivitiToCamunda(xml)
          xml = this.ensureCamundaNamespace(xml)
          await this.bpmnModeler.importXML(xml)
          this.$message.success('导入成功')
        } catch (err) {
          this.$message.error('导入失败: ' + err.message)
        } finally {
          event.target.value = ''
        }
      }
      reader.readAsText(file)
    },

    // 导出
    async downloadDiagram() {
      try {
        const { xml } = await this.bpmnModeler.saveXML({ format: true, preamble: true })
        const exportXml = this.replaceCamundaToActiviti(this.ensureCamundaNamespace(xml))
        const blob = new Blob([exportXml], { type: 'application/xml' })
        FileSaver.saveAs(blob, 'diagram.bpmn')
      } catch (err) {
        this.$message.error('导出失败: ' + err.message)
      }
    },

    // 流程检查
    async checkProcess() {
      try {
        const r = await this.performDeploymentCheck()
        if (r.errors.length > 0) {
          this.$alert(
            '<ul style="margin-left:16px">' + r.errors.map(e => '<li>' + this.escapeHtml(e) + '</li>').join('') + '</ul>',
            '流程检查发现问题',
            { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' }
          )
        } else {
          this.$message.success('流程检查通过。')
        }
      } catch (e) {
        this.$message.error('流程检查失败：' + e.message)
      }
    },
    escapeHtml(str) {
      return String(str).replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]))
    },

    // 部署前检查
    async performDeploymentCheck() {
      try {
        const elementRegistry = this.bpmnModeler.get('elementRegistry')
        const errors = []
        const getCamundaAttr = (bo, key) => {
          if (!bo) return ''
          if (typeof bo.get === 'function') { const v = bo.get(key); if (v) return v }
          return bo[key] || bo.$attrs?.[key] || ''
        }
        const processes = elementRegistry.filter(el => el.type === 'bpmn:Process')
        if (processes.length === 0) {
          errors.push('未找到流程定义。')
        } else {
          const bo = processes[0].businessObject
          if (bo.isExecutable !== true) errors.push('流程未设置为可执行（isExecutable=true）。')
          if (!this.deployForm.processName || this.deployForm.processName.trim() === '') errors.push('流程名称不能为空。')
        }
        const startEvents = elementRegistry.filter(el => el.type === 'bpmn:StartEvent')
        const endEvents = elementRegistry.filter(el => el.type === 'bpmn:EndEvent')
        if (startEvents.length === 0) errors.push('至少需要一个开始事件。')
        if (endEvents.length === 0) errors.push('至少需要一个结束事件。')
        const userTasks = elementRegistry.filter(el => el.type === 'bpmn:UserTask')
        userTasks.forEach(t => {
          const bo = t.businessObject || {}
          if (!bo.name) errors.push('用户任务 ' + t.id + ' 未设置名称。')
          const assignee = getCamundaAttr(bo, 'camunda:assignee')
          const candidateUsers = getCamundaAttr(bo, 'camunda:candidateUsers')
          const candidateGroups = getCamundaAttr(bo, 'camunda:candidateGroups')
          if (!assignee && !candidateUsers && !candidateGroups) {
            errors.push('用户任务 ' + (bo.name || t.id) + ' 未设置执行人。')
          }
        })
        const serviceTasks = elementRegistry.filter(el => el.type === 'bpmn:ServiceTask')
        serviceTasks.forEach(task => {
          const bo = task.businessObject || {}
          const hasImpl = [getCamundaAttr(bo, 'camunda:class'), getCamundaAttr(bo, 'camunda:delegateExpression'),
            getCamundaAttr(bo, 'camunda:expression'), getCamundaAttr(bo, 'camunda:type')].some(Boolean)
          if (!hasImpl) errors.push('服务任务 ' + (bo.name || task.id) + ' 未设置执行实现。')
        })
        return { errors }
      } catch (e) {
        return { errors: ['流程检查失败：' + e.message] }
      }
    },

    // 打开更新弹窗
    updateDiagram() {
      try {
        const elementRegistry = this.bpmnModeler.get('elementRegistry')
        const processes = elementRegistry.filter(el => el.type === 'bpmn:Process')
        const processBo = processes.length > 0 ? processes[0].businessObject : {}
        console.log('processBo', processBo)
        // this.deployForm.processName = processBo.name || ''
        // this.deployForm.key = processBo.id || ''
        // this.deployForm.category = ''
        // this.deployForm.description = ''
      } catch (e) { /* ignore */ }
      this.deployDialogVisible = true
    },

    // 确认更新部署
    async confirmDeploy() {
      const valid = await this.$refs.deployFormRef.validate().catch(() => false);
      console.log('valid', valid)
      if (!valid) return
      this.deployLoading = true
      try {
        const checkResult = await this.performDeploymentCheck();
        console.log('checkResult', checkResult)
        if (checkResult.errors.length > 0) {
          this.$alert(
            '<ul style="margin-left:16px">' + checkResult.errors.map(e => '<li>' + this.escapeHtml(e) + '</li>').join('') + '</ul>',
            '部署前检查发现问题',
            { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' }
          )
          this.deployLoading = false
          return
        }
        const { xml } = await this.bpmnModeler.saveXML({ format: true, preamble: true })
        const exportXml = this.replaceCamundaToActiviti(this.ensureCamundaNamespace(xml))
        await deployProcess({
          processName: this.deployForm.processName,
          // key: this.deployForm.key,
          // category: this.deployForm.category,
          // description: this.deployForm.description,
          bpmnXml: exportXml,
          svg: ''
        })
        this.$message.success('更新部署成功')
        this.deployDialogVisible = false
        this.close()
      } catch (e) {
        this.$message.error(e.message || '更新部署失败')
      } finally {
        this.deployLoading = false
      }
    },

    close() {
      this.$tab.closeOpenPage({ path: '/ryFlowAble/activiti/model', query: { t: Date.now() } })
    }
  }
}
</script>

<style lang="scss">
.model-edit-warp {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.model-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}
.toolbar-left h3 {
  margin: 0;
  font-size: 16px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.model-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.bpmn-canvas {
  flex: 1;
  background: #f5f7fa;
}
.properties-panel {
  width: 300px;
  border-left: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.properties-header {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
}
.properties-header h4 {
  margin: 0;
  font-size: 14px;
}
.bpmn-properties {
  flex: 1;
  overflow-y: auto;
}
</style>
