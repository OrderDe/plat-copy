<template>
  <div class="divBox">
    <el-card shadow="never">
      <div class="template-header">
        <el-form inline size="small" @submit.native.prevent>
          <el-form-item label="模板名称">
            <el-input v-model.trim="keywords" clearable placeholder="请输入模板名称" @keyup.enter.native="loadList(1)" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadList(1)">查询</el-button>
            <el-button @click="loadList(1)">刷新</el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table v-loading="loading" :data="list" size="small">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="模板" min-width="280">
          <template slot-scope="scope">
            <div class="template-cell">
              <el-image v-if="scope.row.coverImage" :src="scope.row.coverImage" fit="cover" class="template-thumb" />
              <div v-else class="template-thumb empty-thumb"><i class="el-icon-picture-outline" /></div>
              <span :title="scope.row.name">{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="templateCategory" label="行业分类" width="130">
          <template slot-scope="scope">{{ scope.row.templateCategory || '其他' }}</template>
        </el-table-column>
        <el-table-column prop="isShow" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.isShow === 1 ? 'success' : 'info'">{{ scope.row.isShow === 1 ? '已发布' : '已下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" @click="editCategory(scope.row)">编辑分类</el-button>
            <el-button type="text" @click="togglePublish(scope.row)">{{ scope.row.isShow === 1 ? '下架' : '发布' }}</el-button>
            <el-button type="text" class="danger" @click="removeTemplate(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="template-pagination"
        background
        :page-sizes="[10, 20, 30]"
        :page-size="limit"
        :current-page="page"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="sizeChange"
        @current-change="pageChange"
      />
    </el-card>
  </div>
</template>

<script>
import {
  pagediyTemplateDeleteApi,
  pagediyTemplateListApi,
  pagediyTemplateUpdateApi,
} from '@/api/devise';

export default {
  name: 'MerchantDiyTemplateLibrary',
  data() {
    return {
      keywords: '',
      page: 1,
      limit: 10,
      total: 0,
      list: [],
      loading: false,
    };
  },
  mounted() {
    this.loadList();
  },
  methods: {
    async loadList(page) {
      this.loading = true;
      this.page = page || this.page;
      try {
        const res = await pagediyTemplateListApi({
          page: this.page,
          limit: this.limit,
          keywords: encodeURIComponent(this.keywords),
        });
        this.list = res.list || [];
        this.total = res.total || 0;
      } finally {
        this.loading = false;
      }
    },
    async editCategory(row) {
      const result = await this.$prompt('请输入模板行业分类', '编辑模板', {
        inputValue: row.templateCategory || '其他',
        confirmButtonText: '保存',
        cancelButtonText: '取消',
      });
      await pagediyTemplateUpdateApi({ id: row.id, templateCategory: result.value || '其他' });
      this.$message.success('保存成功');
      this.loadList();
    },
    async togglePublish(row) {
      await pagediyTemplateUpdateApi({ id: row.id, isShow: row.isShow === 1 ? 0 : 1 });
      this.$message.success(row.isShow === 1 ? '模板已下架' : '模板已发布');
      this.loadList();
    },
    removeTemplate(row) {
      this.$modalSure(`删除“${row.name}”模板吗？`).then(async () => {
        await pagediyTemplateDeleteApi(row.id);
        this.$message.success('删除成功');
        this.loadList();
      });
    },
    sizeChange(value) {
      this.limit = value;
      this.loadList(1);
    },
    pageChange(value) {
      this.page = value;
      this.loadList();
    },
  },
};
</script>

<style scoped lang="scss">
.template-header {
  display: flex;
  justify-content: space-between;
}

.template-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.template-thumb {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  border-radius: 4px;
  background: #f5f7fa;
}

.empty-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 22px;
}

.template-pagination {
  margin-top: 20px;
  text-align: right;
}

.danger {
  color: #f56c6c;
}
</style>
