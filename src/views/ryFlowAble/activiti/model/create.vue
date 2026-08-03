<template>
  <div class="model-create-warp">
    <div class="model-toolbar">
      <div class="toolbar-left">
        <h3>新建流程</h3>
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-button icon="el-icon-folder-opened" size="small" @click="openFile">导入</el-button>
          <el-button icon="el-icon-download" size="small" @click="downloadDiagram">导出</el-button>
          <el-button icon="el-icon-check" size="small" @click="checkProcess">流程检查</el-button>
          <el-button icon="el-icon-upload2" type="primary" size="small" @click="deployToEngine">部署</el-button>
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

    <el-dialog :title="deployDialogTitle" :visible.sync="deployDialogVisible" width="500px" append-to-body :close-on-click-modal="false">
      <el-form :model="deployForm" :rules="deployFormRules" ref="deployFormRef" label-width="100px" size="small">
        <el-form-item label="流程名称" prop="processName">
          <el-input v-model="deployForm.processName" placeholder="请输入流程名称" />
        </el-form-item>
        <!-- <el-form-item label="流程标识" prop="key">
          <el-input v-model="deployForm.key" placeholder="请输入流程标识key" />
        </el-form-item> -->
        <!-- <el-form-item label="所属分类">
          <el-input v-model="deployForm.category" placeholder="请输入所属分类" />
        </el-form-item> -->
        <!-- <el-form-item label="描述">
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
import { deployProcess } from '@/api/ryFlowAble/activiti/model'
import { customTranslate } from '@/translate/index'

import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css'

// 默认空白模板
const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:modeler="http://camunda.org/schema/modeler/1.0" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="camunda-modeler" exporterVersion="1.0.0" modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="7.15.0">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="开始">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:endEvent id="EndEvent_1" name="结束">
      <bpmn:incoming>Flow_1</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="159" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="186" y="202" width="22" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="432" y="159" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="439" y="202" width="22" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="215" y="177" />
        <di:waypoint x="432" y="177" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

export default {
  name: 'CamundaModelCreate',
  data() {
    return {
      bpmnModeler: null,
      deployDialogVisible: false,
      deployDialogTitle: '部署流程',
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
  mounted() {
    this.initModeler()
  },
  methods: {
    // 初始化 Modeler
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
      this.bpmnModeler.importXML(defaultXml).then(() => {
        const canvas = this.bpmnModeler.get('canvas')
        canvas.zoom('fit-viewport')
      })
    },

    // camunda → activiti 命名空间转换
    replaceCamundaToActiviti(xml) {
      return xml
        .replace(/xmlns:camunda="http:\/\/camunda.org\/schema\/1.0\/bpmn"/g, 'xmlns:activiti="http://activiti.org/bpmn"')
        .replace(/ deployment-source="camunda-modeler"/g, ' deployment-source="activiti-modeler"')
        .replace(/camunda:/g, 'activiti:')
    },

    // 导入 BPMN
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
          xml = xml.replace(/xmlns:activiti="http:\/\/activiti.org\/bpmn"/g, 'xmlns:camunda="http://camunda.org/schema/1.0/bpmn"')
            .replace(/activiti:/g, 'camunda:')
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

    // 导出 BPMN
    async downloadDiagram() {
      try {
        const { xml } = await this.bpmnModeler.saveXML({ format: true, preamble: true })
        const exportXml = this.replaceCamundaToActiviti(xml)
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
          this.$message.success('流程检查通过，未发现明显问题。')
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
        const processes = elementRegistry.filter(el => el.type === 'bpmn:Process')
        if (processes.length === 0) {
          errors.push('未找到流程定义。')
        } else {
          const bo = processes[0].businessObject
          if (bo.isExecutable !== true) errors.push('流程未设置为可执行（isExecutable=true）。')
          if (!this.deployForm.processName) errors.push('流程名称不能为空。')
        }
        const startEvents = elementRegistry.filter(el => el.type === 'bpmn:StartEvent')
        const endEvents = elementRegistry.filter(el => el.type === 'bpmn:EndEvent')
        if (startEvents.length === 0) errors.push('至少需要一个开始事件。')
        if (endEvents.length === 0) errors.push('至少需要一个结束事件。')
        return { errors }
      } catch (e) {
        return { errors: ['流程检查失败：' + e.message] }
      }
    },

    // 打开部署弹窗
    deployToEngine() {
      try {
        const elementRegistry = this.bpmnModeler.get('elementRegistry')
        const processes = elementRegistry.filter(el => el.type === 'bpmn:Process')
        const processBo = processes.length > 0 ? processes[0].businessObject : {}
        this.deployForm.processName = processBo.name || ''
        // this.deployForm.key = processBo.id || ''
        // this.deployForm.category = ''
        // this.deployForm.description = ''
      } catch (e) { /* ignore */ }
      this.deployDialogVisible = true
    },

    // 确认部署
    async confirmDeploy() {
      const valid = await this.$refs.deployFormRef.validate().catch(() => false)
      if (!valid) return
      this.deployLoading = true
      try {
        const checkResult = await this.performDeploymentCheck()
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
        const exportXml = this.replaceCamundaToActiviti(xml)
        await deployProcess({
          processName: this.deployForm.processName,
          // key: this.deployForm.key,
          // category: this.deployForm.category,
          // description: this.deployForm.description,
          bpmnXml: exportXml,
          svg: ''
        })
        this.$message.success('部署成功')
        this.deployDialogVisible = false
        this.close()
      } catch (e) {
        this.$message.error(e.message || '部署失败')
      } finally {
        this.deployLoading = false
      }
    },

    // 关闭跳转
    close() {
      this.$tab.closeOpenPage({ path: '/ryFlowAble/activiti/model', query: { t: Date.now() } })
    }
  }
}
</script>

<style lang="scss">
.model-create-warp {
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
