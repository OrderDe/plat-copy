<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="container">
        <el-form :inline="true" size="small" @submit.native.prevent>
          <el-form-item label="海报类型：">
            <el-select v-model="tableFrom.type" placeholder="全部" clearable style="width: 160px" @change="handleSearch">
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div class="mb20">
        <el-button type="primary" size="small" v-hasPermi="['platform:qdiy:poster:save']" @click="handleAdd">
          新增海报
        </el-button>
      </div>

      <el-table v-loading="listLoading" :data="tableData.data" size="small">
        <el-table-column label="预览图" min-width="100">
          <template slot-scope="scope">
            <div class="demo-image__preview">
              <el-image v-if="scope.row.cover" :src="scope.row.cover" :preview-src-list="[scope.row.cover]" />
              <span v-else>-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="海报名称" min-width="160">
          <template slot-scope="scope">
            <span>{{ scope.row.title }}</span>
            <el-tag v-if="scope.row.isDefault === 1" type="success" size="mini" class="ml10">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="海报类型" min-width="110">
          <template slot-scope="scope">{{ typeName(scope.row.type) }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" min-width="80" />
        <el-table-column prop="createTime" label="创建时间" min-width="150" />
        <el-table-column label="操作" min-width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" v-hasPermi="['platform:qdiy:poster:update']" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button
              v-if="scope.row.isDefault !== 1"
              type="text"
              size="small"
              v-hasPermi="['platform:qdiy:poster:update']"
              @click="handleSetDefault(scope.row)"
            >
              设为默认
            </el-button>
            <el-button
              v-if="scope.row.isDefault !== 1"
              type="text"
              size="small"
              v-hasPermi="['platform:qdiy:poster:delete']"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <el-dialog :title="posterForm.id ? '编辑海报' : '新增海报'" :visible.sync="dialogVisible" width="560px" :close-on-click-modal="false">
      <el-form ref="posterForm" :model="posterForm" :rules="posterRules" label-width="90px" size="small">
        <el-form-item label="海报名称" prop="title">
          <el-input v-model="posterForm.title" placeholder="请输入海报名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="海报类型" prop="type">
          <el-select v-model="posterForm.type" placeholder="请选择海报类型" style="width: 100%">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="预览图">
          <div class="upload-box" @click="uploadVisible = true">
            <img v-if="posterForm.cover" :src="posterForm.cover" class="pic" />
            <i v-else class="el-icon-plus" />
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model.number="posterForm.sort" :min="0" controls-position="right" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleSubmit">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="选择图片" :visible.sync="uploadVisible" width="960px" :close-on-click-modal="false" append-to-body>
      <uploadPictures v-if="uploadVisible" :multiple="false" @getImage="handleGetImage" />
    </el-dialog>
  </div>
</template>

<script>
import uploadPictures from '@/components/base/uploadPicture';
import {
  qdiyPosterListApi,
  qdiyPosterSaveApi,
  qdiyPosterUpdateApi,
  qdiyPosterSetDefaultApi,
  qdiyPosterDeleteApi,
} from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

export default {
  name: 'QDiyPoster',
  components: { uploadPictures },
  data() {
    return {
      listLoading: false,
      submitLoading: false,
      dialogVisible: false,
      uploadVisible: false,
      tableData: { data: [], total: 0 },
      tableFrom: { page: 1, limit: 20, type: '' },
      typeOptions: [
        { label: '商品海报', value: 'goods' },
        { label: '用户海报', value: 'user' },
        { label: '自定义海报', value: 'custom' },
      ],
      posterForm: { id: null, title: '', type: 'goods', cover: '', content: '', sort: 0 },
      posterRules: {
        title: [{ required: true, message: '请输入海报名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择海报类型', trigger: 'change' }],
      },
    };
  },
  mounted() {
    if (checkPermi(['platform:qdiy:poster:list'])) this.getList();
  },
  methods: {
    typeName(type) {
      const item = this.typeOptions.find((e) => e.value === type);
      return item ? item.label : type;
    },
    getList() {
      this.listLoading = true;
      qdiyPosterListApi(this.tableFrom)
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
    handleAdd() {
      this.posterForm = { id: null, title: '', type: 'goods', cover: '', content: '', sort: 0 };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.posterForm && this.$refs.posterForm.clearValidate());
    },
    handleEdit(row) {
      this.posterForm = Object.assign({}, row);
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.posterForm && this.$refs.posterForm.clearValidate());
    },
    handleGetImage(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url) this.posterForm.cover = url;
      this.uploadVisible = false;
    },
    handleSubmit() {
      this.$refs.posterForm.validate((valid) => {
        if (!valid) return;
        this.submitLoading = true;
        const api = this.posterForm.id ? qdiyPosterUpdateApi : qdiyPosterSaveApi;
        api(this.posterForm)
          .then(() => {
            this.submitLoading = false;
            this.dialogVisible = false;
            this.$message.success('保存成功');
            this.getList();
          })
          .catch(() => {
            this.submitLoading = false;
          });
      });
    },
    handleSetDefault(row) {
      this.$confirm(`确定将「${row.title}」设为该类型的默认海报吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyPosterSetDefaultApi(row.id).then(() => {
          this.$message.success('设置成功');
          this.getList();
        });
      });
    },
    handleDelete(row) {
      this.$confirm(`确定删除海报「${row.title}」吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyPosterDeleteApi(row.id).then(() => {
          this.$message.success('删除成功');
          this.getList();
        });
      });
    },
  },
};
</script>

<style scoped lang="scss">
.demo-image__preview {
  ::v-deep .el-image {
    width: 36px;
    height: 36px;
  }
}
.ml10 {
  margin-left: 10px;
}
.mb20 {
  margin-bottom: 20px;
}
.upload-box {
  width: 80px;
  height: 80px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c0c4cc;
  .pic {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
