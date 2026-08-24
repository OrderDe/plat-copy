<template>
  <div class="divBox">
    <!--
      这个页面的装修总开关：关掉后 App 的该页面回到原本写死的样式，
      下面配的方案不会生效但也不会丢。单独一张卡片、改完立即保存。
    -->
    <el-card class="box-card mb14" shadow="never" :bordered="false">
      <div class="qdiy-switch">
        <span class="qdiy-switch__label">启用{{ title }}装修</span>
        <el-switch v-model="enabled" :disabled="enableLoading" @change="handleEnableChange" />
        <span class="qdiy-switch__tip">
          {{
            enabled
              ? `App 的${title}页会渲染下面「生效中」的那套装修`
              : `已关闭，App 的${title}页使用原来的样式，下面配置的内容不会生效`
          }}
        </span>
      </div>
    </el-card>

    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="container">
        <p class="hint">
          {{ hint }}
        </p>
        <el-button
          v-hasPermi="['platform:qdiy:page:save']"
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="handleAdd"
        >
          新建方案
        </el-button>
        <span class="tip-text">可以配多套方案（节日版、活动版…），App 只用标记为「生效中」的那一套。</span>
      </div>

      <div v-loading="listLoading" class="template-grid">
        <div v-for="item in list" :key="item.id" class="template-card" :class="{ 'is-active': item.isActive === 1 }">
          <div class="cover">
            <el-image v-if="item.cover" :src="item.cover" fit="cover" :preview-src-list="[item.cover]" />
            <div v-else class="no-cover">暂无预览图</div>
            <el-tag v-if="item.isActive === 1" class="badge" size="mini" type="success">生效中</el-tag>
          </div>
          <div class="info">
            <div class="title" :title="item.title">{{ item.title }}</div>
            <div class="meta">{{ item.updateTime || item.createTime }}</div>
          </div>
          <div class="ops">
            <el-button v-hasPermi="['platform:qdiy:page:save']" type="text" size="small" @click="handleDecorate(item)">
              装修
            </el-button>
            <el-button
              v-if="item.isActive !== 1"
              v-hasPermi="['platform:qdiy:page:save']"
              type="text"
              size="small"
              @click="handleSetActive(item)"
            >
              设为生效
            </el-button>
            <el-button v-hasPermi="['platform:qdiy:page:save']" type="text" size="small" @click="handleCopy(item)">
              复制
            </el-button>
            <!--
              生效中的和系统预置的(type=3)不给删：删掉生效的会让 App 落到兜底那套，
              预置的那套是保底，删光了这个类型就一套方案都没有了
            -->
            <el-button
              v-if="item.isActive !== 1 && item.type !== 3"
              v-hasPermi="['platform:qdiy:page:delete']"
              type="text"
              size="small"
              class="danger-text"
              @click="handleDelete(item)"
            >
              删除
            </el-button>
          </div>
        </div>
        <div v-if="!listLoading && !list.length" class="empty">
          还没有{{ title }}装修方案，请先执行 sql/qdiy_page_body_component.sql 初始化
        </div>
      </div>
    </el-card>

    <el-dialog title="新建方案" :visible.sync="dialogVisible" width="460px" :close-on-click-modal="false">
      <el-form ref="pageForm" :model="pageForm" :rules="pageRules" label-width="90px" size="small">
        <el-form-item label="方案名称" prop="title">
          <el-input v-model="pageForm.title" placeholder="如：春节版" maxlength="30" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  qdiyPageListApi,
  qdiyPageSaveApi,
  qdiyPageCopyApi,
  qdiyPageDeleteApi,
  qdiyPageSetActiveApi,
  qdiyTemplateEnableInfoApi,
  qdiyTemplateEnableSaveApi,
} from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

/**
 * 固定槽位装修页的方案列表（商品分类 / 购物车）
 *
 * 这两个页面的主体是写死的功能区，装修只在主体上下加内容，靠 page-body 占位组件切分。
 * 可以配多套方案，App 用标记为 is_active 的那一套（后端 getFrontPageByTemplate）。
 *
 * 页面类型由路由 meta.template 指定，同一个组件服务两个菜单。
 */
export default {
  name: 'QDiyFixedPage',
  data() {
    return {
      listLoading: false,
      submitLoading: false,
      dialogVisible: false,
      // 本页面的装修开关
      enabled: true,
      enableLoading: false,
      list: [],
      pageForm: { title: '' },
      pageRules: {
        title: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
      },
    };
  },
  computed: {
    template() {
      return (this.$route.meta && this.$route.meta.template) || '';
    },
    title() {
      return (this.$route.meta && this.$route.meta.title) || '';
    },
    hint() {
      const body = this.template === 'goods_cate' ? '分类树和商品列表' : '购物车列表和结算栏';
      return `${this.title}页的${body}是固定的，装修内容加在它的上下两侧。`
        + '在编辑器里把组件拖到「页面主体位置」之前就显示在上方，之后就显示在下方。';
    },
  },
  mounted() {
    if (checkPermi(['platform:qdiy:page:list'])) {
      this.getList();
      this.getEnabled();
    }
  },
  methods: {
    checkPermi,
    getEnabled() {
      if (!this.template) return;
      qdiyTemplateEnableInfoApi(this.template)
        .then((res) => {
          this.enabled = res === true || res === 'true';
        })
        .catch(() => {});
    },
    handleEnableChange(val) {
      this.enableLoading = true;
      qdiyTemplateEnableSaveApi(this.template, val)
        .then(() => {
          this.$message.success(val ? `已启用${this.title}装修` : `已关闭，${this.title}页恢复原样式`);
        })
        .catch(() => {
          // 保存失败要把开关拨回去，否则界面显示的和实际生效的不一致
          this.enabled = !val;
        })
        .finally(() => {
          this.enableLoading = false;
        });
    },
    getList() {
      if (!this.template) return;
      this.listLoading = true;
      // 一个类型下的方案不会多，一次取完，不做分页
      qdiyPageListApi({ page: 1, limit: 100, template: this.template })
        .then((res) => {
          // 生效的排前面，其余按接口返回顺序
          this.list = ((res && res.list) || []).slice().sort((a, b) => (b.isActive || 0) - (a.isActive || 0));
          this.listLoading = false;
        })
        .catch(() => {
          this.listLoading = false;
        });
    },
    handleDecorate(row) {
      this.$router.push({ name: 'qdiyEditor', params: { id: String(row.id) } });
    },
    handleSetActive(row) {
      this.$confirm(`确定让「${row.title}」生效吗？App 的${this.title}页会立即改用这套装修。`, '提示', {
        type: 'warning',
      }).then(() => {
        qdiyPageSetActiveApi(row.id).then(() => {
          this.$message.success('已生效');
          this.getList();
        });
      });
    },
    handleCopy(row) {
      qdiyPageCopyApi(row.id).then(() => {
        this.$message.success('复制成功');
        this.getList();
      });
    },
    handleDelete(row) {
      this.$confirm(`确定删除方案「${row.title}」吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyPageDeleteApi(row.id).then(() => {
          this.$message.success('删除成功');
          this.getList();
        });
      });
    },
    handleAdd() {
      this.pageForm = { title: '' };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.pageForm && this.$refs.pageForm.clearValidate());
    },
    handleSubmit() {
      this.$refs.pageForm.validate((valid) => {
        if (!valid) return;
        this.submitLoading = true;
        // 新建的方案不自动生效，避免手一抖把线上页面换掉，要用得自己点「设为生效」
        qdiyPageSaveApi({
          title: this.pageForm.title,
          template: this.template,
          isShowBottomNav: 1,
          // 预置一个主体占位，否则新方案打开编辑器看不到主体在哪
          content: JSON.stringify([
            { identify: 'page-body', site: 0, data: {}, computedStyle: {},
              funcListItem: { type: 'page-body', title: '页面主体位置' } },
          ]),
        })
          .then(() => {
            this.$message.success('创建成功');
            this.dialogVisible = false;
            this.submitLoading = false;
            this.getList();
          })
          .catch(() => {
            this.submitLoading = false;
          });
      });
    },
  },
};
</script>

<style scoped lang="scss">
.mb14 {
  margin-bottom: 14px;
}
.qdiy-switch {
  display: flex;
  align-items: center;

  &__label {
    margin-right: 12px;
    font-size: 14px;
    color: #303133;
  }

  &__tip {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }
}
.container {
  margin-bottom: 16px;
}
.hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #909399;
  line-height: 20px;
}
.tip-text {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
.template-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  min-height: 200px;
}
.template-card {
  width: 200px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;

  &.is-active {
    border-color: #67c23a;
  }

  .cover {
    height: 260px;
    background: #f5f7fa;
    position: relative;

    ::v-deep .el-image {
      width: 100%;
      height: 100%;
    }

    /*
     * 预览图是整页截图，长图（宽高比常在 1:5 以上）。cover 默认居中裁剪，
     * 裁出来的正好是页面中段，顶部的公告、标题一个都看不见，
     * 看着就像「预览图没生成」。改成从顶部裁，卡片显示的就是页面开头。
     */
    ::v-deep img {
      object-position: top center;
    }
  }
  .badge {
    position: absolute;
    top: 6px;
    right: 6px;
  }
  .no-cover {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    font-size: 12px;
  }
  .info {
    padding: 8px 10px;

    .title {
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta {
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
    }
  }
  .ops {
    padding: 0 6px 8px;
    display: flex;
    // 按钮数量随状态变化（最多「装修/设为生效/复制/删除」四个），
    // 用 wrap + gap 而不是 space-between，免得挤在 200px 里把最后一个裁掉
    flex-wrap: wrap;
    gap: 2px 8px;

    ::v-deep .el-button {
      padding: 0;
      margin-left: 0;
    }
  }
  .danger-text {
    color: #f56c6c;
  }
}
.empty {
  width: 100%;
  padding: 60px 0;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>
