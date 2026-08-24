<template>
  <div class="qdiy-editor" v-loading="loading">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="left">
        <el-button size="small" icon="el-icon-arrow-left" @click="handleBack">返回</el-button>
        <span class="page-name">{{ pageInfo.title }}</span>
        <el-tag size="mini" type="info">{{ templateName }}</el-tag>
      </div>
      <div class="right">
        <el-button size="small" icon="el-icon-refresh-left" :disabled="!canUndo" @click="undo">撤销</el-button>
        <el-button size="small" icon="el-icon-refresh-right" :disabled="!canRedo" @click="redo">重做</el-button>
        <el-button size="small" icon="el-icon-view" @click="previewVisible = true">预览</el-button>
        <el-button
          size="small"
          icon="el-icon-camera"
          :loading="capturing"
          v-hasPermi="savePermi"
          @click="handleGenerateCover"
        >
          生成预览图
        </el-button>
        <el-button
          type="primary"
          size="small"
          :loading="saving"
          v-hasPermi="savePermi"
          @click="handleSave"
        >
          保存
        </el-button>
      </div>
    </div>

    <!-- 三栏主体 -->
    <div class="editor-body">
      <WidgetLibrary :groups="groups" :list="list" @add="handleAdd" @select-existing="handleSelect" />

      <PhoneCanvas
        ref="canvas"
        :list="list"
        :component-map="componentMap"
        :active-index="activeIndex"
        :page-title="pageInfo.title"
        :show-bottom-nav="pageInfo.isShowBottomNav === 1"
        @select="handleSelect"
        @remove="handleRemove"
        @copy="handleCopy"
        @move="handleMove"
        @reorder="handleReorder"
        @drag-end="pushHistory"
      />

      <PropertyPanel :item="activeItem" :component="activeComponent" />
    </div>

    <!-- 预览 -->
    <el-dialog title="页面预览" :visible.sync="previewVisible" width="440px" top="5vh">
      <div class="preview-tips">
        以下为编辑器内的结构预览。真实 H5 / 小程序效果需 App 端渲染组件支持，该部分本轮未排期。
      </div>
      <div class="preview-phone">
        <div v-if="!hasTopComponent" class="phone-head">{{ pageInfo.title }}</div>
        <div class="phone-body">
          <div v-for="(item, index) in list" :key="index" :style="toStyle(item.computedStyle)">
            <component :is="previewOf(item.identify)" :item="item" :active-item="item" :component="componentOf(item.identify)" />
          </div>
          <div v-if="!list.length" class="empty">页面暂无内容</div>
        </div>
        <div v-if="pageInfo.isShowBottomNav === 1" class="phone-foot">底部导航</div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import WidgetLibrary from './components/WidgetLibrary';
import PhoneCanvas from './components/PhoneCanvas';
import PropertyPanel from './components/PropertyPanel';
import { createItem, previewOf, toStyle, parsePermission } from './registry';
import {
  qdiyPageInfoApi,
  qdiyPageUpdateApi,
  qdiyComponentsListApi,
  qdiyMarketDetailApi,
  qdiyMarketUpdateApi,
} from '@/api/qdiy';
import { fileImageApi } from '@/api/systemSetting';
import html2canvas from 'html2canvas';

/** 撤销栈最大深度 */
const MAX_HISTORY = 50;

export default {
  name: 'QDiyEditor',
  components: { WidgetLibrary, PhoneCanvas, PropertyPanel },
  data() {
    return {
      loading: false,
      saving: false,
      capturing: false,
      previewVisible: false,
      pageInfo: {},
      groups: [],
      list: [],
      activeIndex: -1,
      history: [],
      historyIndex: -1,
      // 撤销/重做期间不记录历史，避免自身触发 watch
      restoring: false,
      historyTimer: null,
      templateOptions: {
        home_page: '系统首页',
        goods_detail: '商品详情',
        user_center: '用户中心',
        custom_page: '自定义页面',
        goods_template: '商品模板',
        goods_cate: '商品分类',
        shopping_cart: '购物车',
      },
    };
  },
  computed: {
    /**
     * 编辑器有两种数据源：页面装修（默认）和模板市场的模板。
     * 两者的画布、组件库、属性面板完全一致，只有「读哪张表、存回哪张表」不同，
     * 所以用 query.type 分流，不再复制一份编辑器。
     */
    isMarket() {
      return this.$route.query.type === 'market';
    },
    savePermi() {
      return this.isMarket ? ['platform:qdiy:market:save'] : ['platform:qdiy:page:update'];
    },
    templateName() {
      return this.templateOptions[this.pageInfo.template] || this.pageInfo.template;
    },
    // 组件注册表按 code 索引，画布和属性面板都要用
    componentMap() {
      const map = {};
      this.groups.forEach((g) => {
        (g.list || []).forEach((c) => {
          map[c.code] = c;
        });
      });
      return map;
    },
    activeItem() {
      return this.activeIndex >= 0 && this.activeIndex < this.list.length ? this.list[this.activeIndex] : null;
    },
    activeComponent() {
      return this.activeItem ? this.componentMap[this.activeItem.identify] || {} : {};
    },
    canUndo() {
      return this.historyIndex > 0;
    },
    canRedo() {
      return this.historyIndex < this.history.length - 1;
    },
    hasTopComponent() {
      return this.list.some((item) => {
        const component = this.componentMap[item.identify];
        return component && Number(component.isTop) === 1;
      });
    },
  },
  watch: {
    // 属性面板是直接改 item 对象的，这里统一防抖记录历史
    list: {
      deep: true,
      handler() {
        if (this.restoring) return;
        clearTimeout(this.historyTimer);
        this.historyTimer = setTimeout(() => this.pushHistory(), 500);
      },
    },
  },
  mounted() {
    this.getInfo();
  },
  beforeDestroy() {
    clearTimeout(this.historyTimer);
  },
  methods: {
    previewOf,
    toStyle,
    componentOf(code) {
      return this.componentMap[code] || {};
    },
    getInfo() {
      const id = this.$route.params.id;
      if (!id) return;
      if (this.isMarket) return this.getMarketInfo(id);
      this.loading = true;
      qdiyPageInfoApi(id)
        .then((res) => {
          this.pageInfo = res || {};
          this.groups = res.components || [];
          this.list = this.parseContent(res.content);
          this.resetHistory();
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    /**
     * 模板详情接口只返回模板本身，不带组件注册表，
     * 需要按模板的页面类型另取一次组件库，否则左侧组件区是空的。
     */
    getMarketInfo(id) {
      this.loading = true;
      qdiyMarketDetailApi(id)
        .then((res) => {
          const detail = res || {};
          this.pageInfo = detail;
          this.list = this.parseContent(detail.content);
          return qdiyComponentsListApi({ template: detail.template }).then((groups) => {
            this.groups = groups || [];
          });
        })
        .then(() => {
          this.resetHistory();
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    // content 存的是 activeItem[] 的 JSON 字符串
    parseContent(content) {
      if (!content) return [];
      try {
        const arr = JSON.parse(content);
        if (!Array.isArray(arr)) return [];
        return arr.map((e, index) => {
          const item = Object.assign({ identify: '', site: index, data: {}, computedStyle: {}, params: {} }, e || {});
          // 兼容旧版 PHP 装修数据：旧协议把组件标识放在 funcListItem.type，
          // 新协议使用 identify。迁移后两种数据都必须能继续编辑和预览。
          item.identify = item.identify || item.type || (item.funcListItem && (item.funcListItem.type || item.funcListItem.code)) || '';
          item.site = Number.isFinite(Number(item.site)) ? Number(item.site) : index;
          return item;
        });
      } catch (e) {
        this.$message.warning('页面内容解析失败，已按空页面打开');
        return [];
      }
    },
    /** ---------------- 画布操作 ---------------- */
    handleAdd(component) {
      const item = createItem(component, this.list.length);
      if (Number(component.isTop) === 1) {
        // 固定顶部组件插到最前
        this.list.unshift(item);
        this.activeIndex = 0;
      } else {
        this.list.push(item);
        this.activeIndex = this.list.length - 1;
      }
      // 属性面板会在下一轮渲染中补齐组件默认样式；等这次更新完成后再入栈，
      // 避免一次“添加组件”被拆成两个撤销步骤（先撤销样式、再撤销组件）。
      this.$nextTick(() => {
        clearTimeout(this.historyTimer);
        this.historyTimer = setTimeout(() => this.pushHistory(), 0);
      });
    },
    handleSelect(index) {
      this.activeIndex = index;
    },
    handleRemove(index) {
      const item = this.list[index];
      const perm = parsePermission((this.componentMap[item.identify] || {}).permission);
      if (!perm.delete) {
        this.$message.warning('该组件不允许删除');
        return;
      }
      this.list.splice(index, 1);
      if (this.activeIndex === index) {
        this.activeIndex = -1;
      } else if (this.activeIndex > index) {
        this.activeIndex -= 1;
      }
      this.pushHistory();
    },
    handleCopy(index) {
      const source = this.list[index];
      const component = this.componentMap[source.identify] || {};
      const max = Number(component.count) || 0;
      if (max > 0 && this.list.filter((e) => e.identify === source.identify).length >= max) {
        this.$message.warning(`「${component.title || source.identify}」最多添加 ${max} 个`);
        return;
      }
      const copy = JSON.parse(JSON.stringify(source));
      this.list.splice(index + 1, 0, copy);
      this.activeIndex = index + 1;
      this.pushHistory();
    },
    handleMove(index, offset) {
      const target = index + offset;
      if (target < 0 || target >= this.list.length) return;
      const item = this.list[index];
      this.list.splice(index, 1);
      this.list.splice(target, 0, item);
      this.activeIndex = target;
      this.pushHistory();
    },
    handleReorder(newList) {
      this.list = newList;
      this.activeIndex = -1;
    },
    /** ---------------- 撤销 / 重做 ---------------- */
    snapshot() {
      return JSON.stringify(this.list);
    },
    resetHistory() {
      this.history = [this.snapshot()];
      this.historyIndex = 0;
    },
    pushHistory() {
      const snap = this.snapshot();
      if (this.history[this.historyIndex] === snap) return;
      // 在历史中间做了新操作，丢弃之后的记录
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(snap);
      if (this.history.length > MAX_HISTORY) {
        this.history.shift();
      }
      this.historyIndex = this.history.length - 1;
    },
    restore(index) {
      this.restoring = true;
      this.historyIndex = index;
      this.list = JSON.parse(this.history[index]);
      this.activeIndex = -1;
      this.$nextTick(() => {
        this.restoring = false;
      });
    },
    undo() {
      if (this.canUndo) this.restore(this.historyIndex - 1);
    },
    redo() {
      if (this.canRedo) this.restore(this.historyIndex + 1);
    },
    /** ---------------- 预览图 ---------------- */
    /**
     * 把画布截成图片当预览图：cover 字段本身只是一个图片地址，和 content 没有联动，
     * 靠人手动传图很容易和模板内容对不上，这里改成一键按当前内容生成。
     */
    handleGenerateCover() {
      if (!this.list.length) {
        this.$message.warning('页面还没有内容，先添加组件再生成预览图');
        return;
      }
      const el = this.$refs.canvas && this.$refs.canvas.$refs.phone;
      if (!el) return;
      this.capturing = true;

      /*
       * 画布装在 .phone-canvas 这个 overflow-y:auto 的滚动容器里。
       * html2canvas 按视口坐标定位被截元素，容器只要滚动过，截出来的就是从当前位置
       * 往下的一段——顶部的公告、标题全丢，看着像「预览图没生成」，其实是截偏了。
       * 截图前先把容器滚回顶部，并显式给出完整尺寸，截完再滚回去。
       */
      const scroller = el.parentElement;
      const prevScrollTop = scroller ? scroller.scrollTop : 0;
      if (scroller) scroller.scrollTop = 0;
      const restoreScroll = () => {
        if (scroller) scroller.scrollTop = prevScrollTop;
      };

      html2canvas(el, {
        backgroundColor: '#ffffff',
        // 素材图多是 OSS 外链，没 CORS 头就画不进来；allowTaint 会污染画布导致导不出，只能用 useCORS
        useCORS: true,
        imageTimeout: 8000,
        scale: 1,
        // 截完整的画布，而不是当前可视的那一屏
        scrollX: 0,
        scrollY: 0,
        width: el.offsetWidth,
        height: el.scrollHeight,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: Math.max(el.scrollHeight, document.documentElement.clientHeight),
        // 选中框、操作条、“固定顶部”角标是编辑器的辅助元素，不该出现在预览图里
        onclone: (doc) => {
          doc.querySelectorAll('.op-bar, .fixed-flag').forEach((e) => e.remove());
          doc.querySelectorAll('.canvas-item').forEach((e) => {
            e.classList.remove('active');
            e.style.border = '1px solid transparent';
          });
        },
      })
        .then((canvas) => {
          restoreScroll();
          return this.canvasToFile(canvas);
        })
        .then((file) => {
          const formData = new FormData();
          formData.append('multipart', file);
          return fileImageApi(formData, { model: 'diy', pid: 0 });
        })
        .then((res) => {
          const url = res && (res.url || res.sattDir);
          if (!url) throw new Error('上传返回地址为空');
          this.$set(this.pageInfo, 'cover', url);
          // 生成完直接落库，否则用户不点保存就白截一次
          return this.saveCurrent();
        })
        .then(() => {
          this.capturing = false;
          this.resetHistory();
          this.$message.success('预览图已生成并保存');
        })
        .catch((e) => {
          restoreScroll();
          this.capturing = false;
          if (e) this.$message.error('预览图生成失败：' + (e.message || '请重试'));
        });
    },
    canvasToFile(canvas) {
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('画布导出失败'));
            resolve(new File([blob], `qdiy-cover-${Date.now()}.png`, { type: 'image/png' }));
          },
          'image/png',
          0.9
        );
      });
    },
    /** ---------------- 保存 / 返回 ---------------- */
    /** 保存当前内容，返回 Promise，供保存按钮和生成预览图共用 */
    saveCurrent() {
      // site 按当前顺序重排后再提交
      const content = JSON.stringify(this.list.map((e, i) => Object.assign({}, e, { site: i })));
      if (this.isMarket) {
        // 模板的名称/分类在模板市场弹窗里维护，这里除内容外其余字段原样带上，避免被清空
        return qdiyMarketUpdateApi({
          id: this.pageInfo.id,
          title: this.pageInfo.title,
          template: this.pageInfo.template,
          cateId: this.pageInfo.cateId,
          cateName: this.pageInfo.cateName,
          cover: this.pageInfo.cover,
          sort: this.pageInfo.sort,
          isOnSale: this.pageInfo.isOnSale,
          content,
        });
      }
      return qdiyPageUpdateApi({
        id: this.pageInfo.id,
        title: this.pageInfo.title,
        template: this.pageInfo.template,
        type: this.pageInfo.type,
        isShowBottomNav: this.pageInfo.isShowBottomNav,
        cover: this.pageInfo.cover,
        content,
      });
    },
    handleSave() {
      this.saving = true;
      this.saveCurrent()
        .then(() => {
          this.saving = false;
          this.$message.success('保存成功');
          this.resetHistory();
        })
        .catch(() => {
          this.saving = false;
        });
    },
    handleBack() {
      const back = this.isMarket ? '/qdiy/market' : '/qdiy/page';
      if (this.historyIndex > 0) {
        this.$confirm('页面有未保存的改动，确定离开吗？', '提示', { type: 'warning' })
          .then(() => this.$router.push(back))
          .catch(() => {});
        return;
      }
      this.$router.push(back);
    },
  },
};
</script>

<style scoped lang="scss">
.qdiy-editor {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 2000;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.editor-header {
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .page-name {
    margin: 0 10px;
    font-size: 15px;
    font-weight: 500;
  }
}
.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.preview-tips {
  font-size: 12px;
  color: #e6a23c;
  margin-bottom: 12px;
  line-height: 20px;
}
.preview-phone {
  width: 375px;
  margin: 0 auto;
  border: 1px solid #ebeef5;
  max-height: 70vh;
  overflow-y: auto;
  .phone-head {
    height: 44px;
    line-height: 44px;
    text-align: center;
    background: #fafafa;
    font-size: 14px;
  }
  .phone-foot {
    height: 50px;
    line-height: 50px;
    text-align: center;
    background: #fafafa;
    font-size: 12px;
    color: #909399;
  }
  .empty {
    padding: 100px 0;
    text-align: center;
    color: #c0c4cc;
    font-size: 13px;
  }
}
</style>
