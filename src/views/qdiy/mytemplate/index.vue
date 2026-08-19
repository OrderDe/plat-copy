<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="container">
        <el-form :inline="true" size="small" @submit.native.prevent>
          <el-form-item label="模板名称：">
            <el-input
              v-model="tableFrom.title"
              placeholder="请输入模板名称"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleSearch"
            />
          </el-form-item>
          <el-form-item label="页面类型：">
            <el-select v-model="tableFrom.template" placeholder="全部" clearable style="width: 160px">
              <el-option v-for="item in templateOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="listLoading" class="template-grid">
        <div v-for="item in tableData.data" :key="item.id" class="template-card">
          <div class="cover">
            <el-image v-if="item.cover" :src="item.cover" fit="cover" :preview-src-list="[item.cover]" />
            <div v-else class="no-cover">暂无预览图</div>
          </div>
          <div class="info">
            <div class="title" :title="item.title">{{ item.title }}</div>
            <div class="meta">
              <span>{{ templateName(item.template) }}</span>
              <span v-if="item.expireTime" class="expire">到期：{{ item.expireTime }}</span>
              <span v-else class="forever">永久有效</span>
            </div>
          </div>
          <div class="ops">
            <el-button type="text" size="small" v-hasPermi="['platform:qdiy:mytemplate:use']" @click="handleUse(item)">
              套用到页面
            </el-button>
            <el-button type="text" size="small" v-hasPermi="['platform:qdiy:mytemplate:delete']" @click="handleDelete(item)">
              删除
            </el-button>
          </div>
        </div>
        <div v-if="!listLoading && !tableData.data.length" class="empty">
          暂无模板，去<el-button type="text" @click="$router.push('/qdiy/market')">模板市场</el-button>逛逛吧
        </div>
      </div>

      <div class="block">
        <el-pagination
          background
          :page-sizes="[20, 40, 60, 80]"
          :page-size="tableFrom.limit"
          :current-page="tableFrom.page"
          layout="total, sizes, prev, pager, next, jumper"
          :total="tableData.total"
          @current-change="pageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 选择要套用的页面 -->
    <el-dialog title="套用到页面" :visible.sync="useVisible" width="460px">
      <div class="tips mb20">仅可套用到相同页面类型的装修页面。</div>
      <el-select v-model="targetPageId" placeholder="请选择目标页面" style="width: 100%" size="small">
        <el-option v-for="item in pageList" :key="item.id" :label="item.title" :value="item.id" />
      </el-select>
      <span slot="footer">
        <el-button size="small" @click="useVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleUseSubmit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { qdiyMyTemplateListApi, qdiyMyTemplateUseApi, qdiyMyTemplateDeleteApi, qdiyPageListApi } from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

export default {
  name: 'QDiyMyTemplate',
  data() {
    return {
      listLoading: false,
      submitLoading: false,
      useVisible: false,
      targetPageId: null,
      currentTemplate: null,
      pageList: [],
      tableData: { data: [], total: 0 },
      tableFrom: { page: 1, limit: 20, title: '', template: '' },
      templateOptions: [
        { label: '系统首页', value: 'home_page' },
        { label: '商品详情', value: 'goods_detail' },
        { label: '用户中心', value: 'user_center' },
        { label: '自定义页面', value: 'custom_page' },
        { label: '商品模板', value: 'goods_template' },
      ],
    };
  },
  mounted() {
    if (checkPermi(['platform:qdiy:mytemplate:list'])) this.getList();
  },
  methods: {
    templateName(template) {
      const item = this.templateOptions.find((e) => e.value === template);
      return item ? item.label : template;
    },
    getList() {
      this.listLoading = true;
      qdiyMyTemplateListApi(this.tableFrom)
        .then((res) => {
          this.tableData.data = res.list || [];
          this.tableData.total = Number(res.total) || 0;
          this.listLoading = false;
        })
        .catch(() => {
          this.listLoading = false;
        });
    },
    handleSearch() {
      this.tableFrom.page = 1;
      this.getList();
    },
    pageChange(page) {
      this.tableFrom.page = page;
      this.getList();
    },
    handleSizeChange(limit) {
      this.tableFrom.limit = limit;
      this.getList();
    },
    handleUse(item) {
      this.currentTemplate = item;
      this.targetPageId = null;
      // 只拉取同类型的页面供选择，避免提交后被后端拒绝
      qdiyPageListApi({ page: 1, limit: 100, template: item.template }).then((res) => {
        this.pageList = res.list || [];
        this.useVisible = true;
      });
    },
    handleUseSubmit() {
      if (!this.targetPageId) {
        this.$message.warning('请选择目标页面');
        return;
      }
      this.submitLoading = true;
      qdiyMyTemplateUseApi({ id: this.currentTemplate.id, pageId: this.targetPageId })
        .then(() => {
          this.submitLoading = false;
          this.useVisible = false;
          this.$message.success('套用成功');
        })
        .catch(() => {
          this.submitLoading = false;
        });
    },
    handleDelete(item) {
      this.$confirm(`确定删除模板「${item.title}」吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyMyTemplateDeleteApi(item.id).then(() => {
          this.$message.success('删除成功');
          this.getList();
        });
      });
    },
  },
};
</script>

<style scoped lang="scss">
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
  .cover {
    height: 260px;
    background: #f5f7fa;
    ::v-deep .el-image {
      width: 100%;
      height: 100%;
    }
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
      display: flex;
      justify-content: space-between;
    }
    .forever {
      color: #67c23a;
    }
    .expire {
      color: #e6a23c;
    }
  }
  .ops {
    padding: 0 10px 8px;
    display: flex;
    justify-content: space-between;
  }
}
.empty {
  width: 100%;
  text-align: center;
  color: #909399;
  padding: 60px 0;
}
.tips {
  font-size: 12px;
  color: #999;
}
.mb20 {
  margin-bottom: 20px;
}
</style>
