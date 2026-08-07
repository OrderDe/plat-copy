<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-back" size="mini" @click="goBack">返回</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-refresh" size="mini" @click="refreshHighlight">刷新高亮</el-button>
      </el-col>

      
    </el-row>

    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>流程实例详情</span>
        <el-tag v-if="processInstanceInfo" :type="processInstanceInfo.ended ? 'danger' : 'success'" style="float: right;">
          {{ processInstanceInfo.ended ? '已结束' : '运行中' }}
        </el-tag>
      </div>
      
      <el-descriptions :column="3" border v-if="processInstanceInfo">
        <el-descriptions-item label="流程实例ID">{{ processInstanceInfo.id }}</el-descriptions-item>
        <el-descriptions-item label="流程定义ID">{{ processInstanceInfo.processDefinitionId }}</el-descriptions-item>
        <el-descriptions-item label="流程定义Key">{{ processInstanceInfo.processDefinitionKey }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ parseTime(processInstanceInfo.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ processInstanceInfo.endTime ? parseTime(processInstanceInfo.endTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="业务Key">{{ processInstanceInfo.businessKey || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>流程高亮显示</span>
        <el-tag v-if="highlightLoading" type="info" style="float: right;">加载中...</el-tag>
      </div>
      
      <div v-loading="bpmnLoading" class="bpmn-container">
        <div id="bpmn-viewer" style="height: 600px; border: 1px solid #e4e7ed;"></div>
      </div>
    </el-card>
  </div>
</template>

<script>
import BpmnViewer from 'bpmn-js/lib/Viewer'
import { getProcessHighlight } from '@/api/ryFlowAble/activiti/process'

export default {
  name: 'ProcessDetail',
  data() {
    return {
      // 路由参数
      processDefinitionId: undefined,
      processInstanceId: undefined,
      
      // 加载状态
      bpmnLoading: false,
      highlightLoading: false,
      
      // BPMN查看器
      bpmnViewer: null,
      
      // 流程实例信息
      processInstanceInfo: null,
      
      // 高亮信息
      highlightInfo: null
    }
  },
  created() {
    // 获取路由参数
    this.processDefinitionId = this.$route.query.processDefinitionId
    this.processInstanceId = this.$route.query.processInstanceId
    
    if (!this.processDefinitionId || !this.processInstanceId) {
      this.$message.error('缺少必要的参数：processDefinitionId 和 processInstanceId')
      this.goBack()
      return
    }
  },
  mounted() {
    this.initBpmnViewer()
    this.loadProcessData()
  },
  beforeDestroy() {
    if (this.bpmnViewer) {
      this.bpmnViewer.destroy()
    }
  },
  methods: {
    /** 初始化BPMN查看器 */
    initBpmnViewer() {
      this.bpmnViewer = new BpmnViewer({
        container: '#bpmn-viewer'
      })
    },
    
    /** 加载流程数据 */
    async loadProcessData() {
      try {
        await this.loadProcessHighlight()
      } catch (error) {
        this.$message.error('加载流程数据失败: ' + error.message)
      }
    },
    
    /** 加载流程高亮信息 */
    async loadProcessHighlight() {
      this.highlightLoading = true
      this.bpmnLoading = true
      try {
        const response = await getProcessHighlight({
          processDefinitionId: this.processDefinitionId,
          processInstanceId: this.processInstanceId
        })
        
        this.highlightInfo = response.data
        
        // 使用返回的 modelXml 渲染 BPMN
        if (this.highlightInfo.modelXml) {
          await this.bpmnViewer.importXML(this.highlightInfo.modelXml)
        }
        //设置流程信息
        if(this.highlightInfo.processInstanceInfo){
          this.processInstanceInfo = this.highlightInfo.processInstanceInfo
        }
        
        // 应用高亮显示
        this.applyHighlight()
      } catch (error) {
        this.$message.error('加载流程高亮信息失败: ' + error.message)
      } finally {
        this.highlightLoading = false
        this.bpmnLoading = false
      }
    },
    
    /** 应用高亮显示 */
    applyHighlight() {
      if (!this.highlightInfo || !this.bpmnViewer) {
        return
      }
      
      const canvas = this.bpmnViewer.get('canvas')
      
      // 清除之前的高亮
      this.clearHighlight()
      
      // 使用 canvas.addMarker 方法应用高亮
      if (this.highlightInfo.executedActivityIds && this.highlightInfo.executedActivityIds.length > 0) {
        // 高亮已完成节点（绿色）
        this.highlightInfo.executedActivityIds.forEach(activityId => {
          canvas.addMarker(activityId, 'highlight-executed')
        })
      }
      
      if (this.highlightInfo.highlightedFlowIds && this.highlightInfo.highlightedFlowIds.length > 0) {
        // 高亮流程线（绿色）
        this.highlightInfo.highlightedFlowIds.forEach(flowId => {
          canvas.addMarker(flowId, 'highlight-line')
        })
      }
      
      if (this.highlightInfo.activeActivityIds && this.highlightInfo.activeActivityIds.length > 0) {
        // 高亮当前活动节点（橙色虚线）
        this.highlightInfo.activeActivityIds.forEach(activityId => {
          canvas.addMarker(activityId, 'highlight')
        })
        
        // 为当前活动节点添加虚线效果
        this.$nextTick(() => {
          document.querySelectorAll('.highlight').forEach((item) => {
            try {
              const rect = item.querySelector('.djs-visual rect')
              if (rect) {
                rect.setAttribute('stroke-dasharray', '4,4')
              }
            } catch (err) {
            }
          })
        })

        // 自动适应视图并居中显示
        this.$nextTick(() => {
          this.centerBpmnDiagram()
        })
      }
      
      // 自动适应视图
      canvas.zoom('fit-viewport')
      
      
    },
    /** 居中显示BPMN图表 */
    centerBpmnDiagram() {
      if (!this.bpmnViewer) {
        return
      }
      
      const canvas = this.bpmnViewer.get('canvas')
      
      // 先适应视口大小
      canvas.zoom('fit-viewport')
      
      // 延迟执行居中，确保zoom完成后再居中
      setTimeout(() => {
        canvas.center()
      }, 100)
    },
    
    /** 清除高亮显示 */
    clearHighlight() {
      if (!this.bpmnViewer) {
        return
      }
      
      const canvas = this.bpmnViewer.get('canvas')
      const elementRegistry = this.bpmnViewer.get('elementRegistry')
      
      // 清除所有元素的高亮标记
      elementRegistry.forEach(element => {
        canvas.removeMarker(element.id, 'highlight')
        canvas.removeMarker(element.id, 'highlight-executed')
        canvas.removeMarker(element.id, 'highlight-line')
      })
    },
    
    /** 刷新高亮 */
    async refreshHighlight() {
      await this.loadProcessHighlight()
      this.$message.success('高亮信息已刷新')
    },
    
    
    
    /** 返回上一页 */
    goBack() {
      this.$router.go(-1)
    },
    
    /** 时间格式化 */
    parseTime(time) {
      if (!time) return '-'
      return new Date(time).toLocaleString()
    }
  }
}
</script>

<style lang="scss">

.app-container {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.bpmn-container {
  min-height: 600px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}

.clearfix:after {
  clear: both;
}

/* BPMN查看器样式 */
#bpmn-viewer {
  background: #fafafa;
}
/* 全局：让高亮样式真正作用到 bpmn-js 生成的 SVG 元素 */


.highlight:not(.djs-connection) .djs-visual > :nth-child(1) {
    fill: rgb(251, 233, 209) !important; /* color elements as green */
  }

.highlight g.djs-visual > :nth-child(1) {
  stroke: rgb(214, 126, 125) !important;
}

.highlight-executed g.djs-visual > :nth-child(1) {
  stroke: rgb(0, 190, 0, 1) !important;
  fill: rgb(180, 241, 180) !important;
}

.highlight-line g.djs-visual > :nth-child(1) {
  stroke: rgb(0, 190, 0) !important;
}
/* 更精确地应用到连线元素（sequence flow） */
.djs-connection.highlight-line .djs-visual path,
[data-element-id].highlight-line .djs-visual path {
  stroke: rgb(0, 190, 0) !important;
  stroke-width: 2px !important;
  fill: none !important;
}

@keyframes dynamicNode{
    to {
      stroke-dashoffset: 100%;
    }
}

.highlight {
  .djs-visual {
    -webkit-animation: dynamicNode 18S linear infinite;
    -webkit-animation-fill-mode: forwards;
  }
}
</style>



