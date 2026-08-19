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
            <div class="meta">{{ templateName(item.template) }}</div>
          </div>
          <div class="ops">
            <el-button type="text" size="small" v-hasPermi="['platform:qdiy:market:receive']" @click="handleReceive(item)">
              领取模板
            </el-button>
          </div>
        </div>
        <div v-if="!listLoading && !tableData.data.length" class="empty">暂无上架模板</div>
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
  </div>
</template>

<script>
import { qdiyMarketListApi, qdiyMarketReceiveApi } from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

export default {
  name: 'QDiyMarket',
  data() {
    return {
      listLoading: false,
      tableData: { data: [], total: 0 },
      tableFrom: { page: 1, limit: 20, title: '', template: '', cateId: '' },
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
    if (checkPermi(['platform:qdiy:market:list'])) this.getList();
  },
  methods: {
    templateName(template) {
      const item = this.templateOptions.find((e) => e.value === template);
      return item ? item.label : template;
    },
    getList() {
      this.listLoading = true;
      qdiyMarketListApi(this.tableFrom)
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
    handleReceive(item) {
      this.$confirm(`确定领取模板「${item.title}」到我的模板吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyMarketReceiveApi(item.id).then(() => {
          this.$message.success('领取成功，可在【我的模板】中使用');
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
    }
  }
  .ops {
    padding: 0 10px 8px;
    text-align: right;
  }
}
.empty {
  width: 100%;
  text-align: center;
  color: #909399;
  padding: 60px 0;
}
</style>
