<template>
  <div v-loading="bpmnLoading" class="bpmn-container">
    <div :id="containerId" style="height: 480px; border: 1px solid #e4e7ed;"></div>
  </div>
</template>

<script>
import { getProcessHighlight } from '@/api/ryFlowAble/activiti/process'
import BpmnViewer from 'bpmn-js/lib/Viewer'

export default {
  name: 'ProcessTrace',
  props: {
    processInstanceId: {
      type: String,
      default: ''
    },
    processDefinitionId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      bpmnViewer: null,
      bpmnLoading: false,
      containerId: `bpmn-viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  watch: {
    processInstanceId: {
      handler() {
        if (this.processInstanceId && this.processDefinitionId) {
          this.loadProcessTrace()
        }
      },
      immediate: false
    },
    processDefinitionId: {
      handler() {
        if (this.processInstanceId && this.processDefinitionId) {
          this.loadProcessTrace()
        }
      },
      immediate: false
    }
  },
  mounted() {
    // 如果组件挂载时已经有参数，立即加载
    if (this.processInstanceId && this.processDefinitionId) {
      this.$nextTick(() => {
        this.loadProcessTrace()
      })
    }
  },
  beforeDestroy() {
    if (this.bpmnViewer) {
      try {
        this.bpmnViewer.destroy()
      } catch (e) {
        console.error('销毁 BPMN 查看器失败:', e)
      }
      this.bpmnViewer = null
    }
  },
  methods: {
    /** 初始化BPMN查看器 */
    initBpmnViewer() {
      if (this.bpmnViewer) return
      this.bpmnViewer = new BpmnViewer({ container: `#${this.containerId}` })
    },
    /** 加载流程轨迹 */
    async loadProcessTrace() {
      if (!this.processInstanceId || !this.processDefinitionId) {
        return
      }

      this.bpmnLoading = true
      this.$nextTick(async () => {
        try {
          // 调用 getProcessHighlight 接口获取流程高亮信息
          const response = await getProcessHighlight({
            processInstanceId: this.processInstanceId,
            processDefinitionId: this.processDefinitionId
          })

          const highlightInfo = (response && response.data) || {}

          // 初始化 BPMN 查看器
          this.initBpmnViewer()

          // 如果已有内容，先清除
          if (this.bpmnViewer) {
            try {
              // 清除所有标记
              const canvas = this.bpmnViewer.get('canvas')
              const elementRegistry = this.bpmnViewer.get('elementRegistry')
              elementRegistry.forEach(el => {
                canvas.removeMarker(el.id, 'highlight')
                canvas.removeMarker(el.id, 'highlight-executed')
                canvas.removeMarker(el.id, 'highlight-line')
              })
            } catch (e) {
              // 如果清除失败，重新创建查看器
              if (this.bpmnViewer) {
                try {
                  this.bpmnViewer.destroy()
                } catch (e) {}
              }
              this.bpmnViewer = null
              this.initBpmnViewer()
            }
          }

          // 使用返回的 modelXml 渲染 BPMN
          if (highlightInfo.modelXml) {
            await this.bpmnViewer.importXML(highlightInfo.modelXml)
            // 等待渲染完成
            await this.$nextTick()
          }

          // 应用高亮显示
          this.applyHighlight({
            activeActivityIds: highlightInfo.activeActivityIds || [],
            executedActivityIds: highlightInfo.executedActivityIds || [],
            highlightedFlowIds: highlightInfo.highlightedFlowIds || []
          })
        } catch (error) {
          console.error('获取流程高亮信息失败:', error)
          this.$message && this.$message.error('获取流程高亮信息失败: ' + (error.message || '未知错误'))
        } finally {
          this.bpmnLoading = false
        }
      })
    },
    /** 应用流程高亮 */
    applyHighlight(highlightInfo) {
      if (!this.bpmnViewer || !highlightInfo) return
      
      try {
        const canvas = this.bpmnViewer.get('canvas')
        const elementRegistry = this.bpmnViewer.get('elementRegistry')
        
        if (!canvas || !elementRegistry) {
          console.warn('BPMN 查看器未完全初始化')
          return
        }
        
        // 清除旧标记
        elementRegistry.forEach(el => {
          try {
            canvas.removeMarker(el.id, 'highlight')
            canvas.removeMarker(el.id, 'highlight-executed')
            canvas.removeMarker(el.id, 'highlight-line')
          } catch (e) {
            // 忽略清除标记时的错误
          }
        })
        
        // 已执行节点
        if (highlightInfo.executedActivityIds && highlightInfo.executedActivityIds.length) {
          highlightInfo.executedActivityIds.forEach(id => {
            try {
              if (elementRegistry.get(id)) {
                canvas.addMarker(id, 'highlight-executed')
              }
            } catch (e) {
              console.warn(`无法为节点 ${id} 添加已执行标记:`, e)
            }
          })
        }
        
        // 高亮连线
        if (highlightInfo.highlightedFlowIds && highlightInfo.highlightedFlowIds.length) {
          highlightInfo.highlightedFlowIds.forEach(id => {
            try {
              if (elementRegistry.get(id)) {
                canvas.addMarker(id, 'highlight-line')
              }
            } catch (e) {
              console.warn(`无法为连线 ${id} 添加高亮标记:`, e)
            }
          })
        }
        
        // 活动节点
        if (highlightInfo.activeActivityIds && highlightInfo.activeActivityIds.length) {
          highlightInfo.activeActivityIds.forEach(id => {
            try {
              if (elementRegistry.get(id)) {
                canvas.addMarker(id, 'highlight')
              }
            } catch (e) {
              console.warn(`无法为节点 ${id} 添加活动标记:`, e)
            }
          })
          
          this.$nextTick(() => {
            try {
              const container = document.getElementById(this.containerId)
              if (container) {
                container.querySelectorAll('.highlight').forEach((item) => {
                  try {
                    const rect = item.querySelector('.djs-visual rect')
                    if (rect) rect.setAttribute('stroke-dasharray', '4,4')
                  } catch (e) {}
                })
              }
            } catch (e) {}
          })
        }
        
        // 适配视口 - 添加延迟和错误处理
        this.$nextTick(() => {
          try {
            // 检查容器是否存在且有内容
            const container = document.getElementById(this.containerId)
            if (!container) {
              console.warn('BPMN 容器不存在')
              return
            }
            
            // 检查是否有有效的 SVG 内容
            const svg = container.querySelector('svg')
            if (!svg) {
              console.warn('SVG 元素不存在')
              return
            }
            
            // 检查 viewBox 是否有效
            const viewBox = svg.getAttribute('viewBox')
            if (viewBox) {
              const viewBoxValues = viewBox.split(/\s+/).map(v => parseFloat(v))
              const hasInvalidValues = viewBoxValues.some(v => !isFinite(v) || isNaN(v))
              if (hasInvalidValues) {
                console.warn('SVG viewBox 包含无效值:', viewBox)
                return
              }
            }
            
            // 尝试适配视口
            canvas.zoom('fit-viewport')
            
            // 延迟居中操作，确保缩放完成
            setTimeout(() => {
              try {
                canvas.center()
              } catch (e) {
                console.warn('居中操作失败:', e)
              }
            }, 100)
          } catch (e) {
            console.warn('适配视口失败:', e)
          }
        })
      } catch (error) {
        console.error('应用流程高亮失败:', error)
      }
    },
    /** 刷新流程轨迹 */
    refresh() {
      this.loadProcessTrace()
    }
  }
}
</script>

<style>
.bpmn-container {
  min-height: 480px;
}

/* 高亮样式，参考 model/highlight.vue，不能使用 scoped */
.highlight:not(.djs-connection) .djs-visual > :nth-child(1) {
  fill: rgb(251, 233, 209) !important;
}
.highlight g.djs-visual > :nth-child(1) {
  stroke: rgb(214, 126, 125) !important;
}
.highlight-executed g.djs-visual > :nth-child(1) {
  stroke: rgba(0, 190, 0, 1) !important;
  fill: rgb(180, 241, 180) !important;
}
.highlight-line g.djs-visual > :nth-child(1) {
  stroke: rgb(0, 190, 0) !important;
}
.djs-connection.highlight-line .djs-visual path,
[data-element-id].highlight-line .djs-visual path {
  stroke: rgb(0, 190, 0) !important;
  stroke-width: 2px !important;
  fill: none !important;
}
@keyframes dynamicNode {
  to {
    stroke-dashoffset: 100%;
  }
}
.highlight .djs-visual {
  -webkit-animation: dynamicNode 18s linear infinite;
  -webkit-animation-fill-mode: forwards;
}
</style>

