<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <el-row :gutter="16">
        <!-- 左侧分组树 -->
        <el-col :span="5">
          <div class="group-panel">
            <div class="group-head">
              <span>素材分组</span>
              <el-button type="text" size="mini" v-hasPermi="['platform:qdiy:material:save']" @click="handleAddGroup">
                新增分组
              </el-button>
            </div>
            <el-tree
              ref="groupTree"
              :data="groupTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              highlight-current
              default-expand-all
              @node-click="handleGroupClick"
            >
              <span slot-scope="{ node, data }" class="tree-node">
                <span>{{ node.label }}</span>
                <span v-if="data.id > 0" class="tree-op">
                  <i class="el-icon-edit" @click.stop="handleEditGroup(data)" />
                  <i class="el-icon-delete" @click.stop="handleDeleteGroup(data)" />
                </span>
              </span>
            </el-tree>
          </div>
        </el-col>

        <!-- 右侧素材列表 -->
        <el-col :span="19">
          <div class="mb20">
            <el-input
              v-model="tableFrom.name"
              placeholder="搜索素材名称"
              size="small"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleSearch"
            />
            <el-button type="primary" size="small" class="ml10" @click="handleSearch">查询</el-button>
            <el-button type="primary" size="small" v-hasPermi="['platform:qdiy:material:save']" @click="uploadVisible = true">
              上传素材
            </el-button>
            <el-button size="small" :disabled="!selection.length" v-hasPermi="['platform:qdiy:material:save']" @click="handleMove">
              移动到分组
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="!selection.length"
              v-hasPermi="['platform:qdiy:material:delete']"
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
          </div>

          <el-table v-loading="listLoading" :data="tableData.data" size="small" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="45" />
            <el-table-column label="预览" width="90">
              <template slot-scope="scope">
                <div class="demo-image__preview">
                  <el-image v-if="scope.row.type === 1" :src="scope.row.url" :preview-src-list="[scope.row.url]" />
                  <i v-else class="el-icon-video-camera video-icon" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="素材名称" min-width="180" />
            <el-table-column label="类型" width="90">
              <template slot-scope="scope">{{ scope.row.type === 2 ? '视频' : '图片' }}</template>
            </el-table-column>
            <el-table-column label="大小" width="110">
              <template slot-scope="scope">{{ formatSize(scope.row.size) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="上传时间" min-width="150" />
            <el-table-column label="操作" width="120" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleCopyUrl(scope.row)">复制链接</el-button>
                <el-button
                  type="text"
                  size="small"
                  v-hasPermi="['platform:qdiy:material:delete']"
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
        </el-col>
      </el-row>
    </el-card>

    <!-- 分组新增/编辑 -->
    <el-dialog :title="groupForm.id ? '编辑分组' : '新增分组'" :visible.sync="groupVisible" width="420px">
      <el-form ref="groupForm" :model="groupForm" :rules="groupRules" label-width="80px" size="small">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model.number="groupForm.sort" :min="0" controls-position="right" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="groupVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleGroupSubmit">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 移动到分组 -->
    <el-dialog title="移动到分组" :visible.sync="moveVisible" width="420px">
      <el-select v-model="moveTargetPid" placeholder="请选择目标分组" style="width: 100%" size="small">
        <el-option label="根目录" :value="0" />
        <el-option v-for="item in groupFlatList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span slot="footer">
        <el-button size="small" @click="moveVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleMoveSubmit">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 上传素材 -->
    <el-dialog title="上传素材" :visible.sync="uploadVisible" width="960px" :close-on-click-modal="false">
      <uploadPictures v-if="uploadVisible" :multiple="true" @getImage="handleGetImage" />
    </el-dialog>
  </div>
</template>

<script>
import uploadPictures from '@/components/base/uploadPicture';
import {
  qdiyMaterialGroupListApi,
  qdiyMaterialListApi,
  qdiyMaterialSaveApi,
  qdiyMaterialUpdateApi,
  qdiyMaterialMoveApi,
  qdiyMaterialDeleteApi,
} from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

export default {
  name: 'QDiyMaterial',
  components: { uploadPictures },
  data() {
    return {
      listLoading: false,
      submitLoading: false,
      groupVisible: false,
      moveVisible: false,
      uploadVisible: false,
      groupFlatList: [],
      groupTree: [],
      selection: [],
      moveTargetPid: 0,
      tableData: { data: [], total: 0 },
      tableFrom: { page: 1, limit: 20, pid: 0, name: '' },
      groupForm: { id: null, name: '', pid: 0, type: 0, sort: 0 },
      groupRules: {
        name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
      },
    };
  },
  mounted() {
    if (checkPermi(['platform:qdiy:material:group'])) this.getGroupList();
    if (checkPermi(['platform:qdiy:material:list'])) this.getList();
  },
  methods: {
    formatSize(size) {
      if (!size) return '-';
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    },
    getGroupList() {
      qdiyMaterialGroupListApi().then((res) => {
        this.groupFlatList = res || [];
        this.groupTree = [{ id: 0, name: '全部素材', children: this.buildTree(this.groupFlatList, 0) }];
      });
    },
    // 后端返回的是扁平分组，这里按 pid 组装成树
    buildTree(list, pid) {
      return list
        .filter((e) => e.pid === pid)
        .map((e) => ({ ...e, children: this.buildTree(list, e.id) }));
    },
    getList() {
      this.listLoading = true;
      qdiyMaterialListApi(this.tableFrom)
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
    handleGroupClick(data) {
      this.tableFrom.pid = data.id;
      this.tableFrom.page = 1;
      this.getList();
    },
    handleSelectionChange(val) {
      this.selection = val;
    },
    handleAddGroup() {
      this.groupForm = { id: null, name: '', pid: this.tableFrom.pid || 0, type: 0, sort: 0 };
      this.groupVisible = true;
      this.$nextTick(() => this.$refs.groupForm && this.$refs.groupForm.clearValidate());
    },
    handleEditGroup(data) {
      this.groupForm = { id: data.id, name: data.name, pid: data.pid, type: 0, sort: data.sort || 0 };
      this.groupVisible = true;
      this.$nextTick(() => this.$refs.groupForm && this.$refs.groupForm.clearValidate());
    },
    handleGroupSubmit() {
      this.$refs.groupForm.validate((valid) => {
        if (!valid) return;
        this.submitLoading = true;
        const api = this.groupForm.id ? qdiyMaterialUpdateApi : qdiyMaterialSaveApi;
        api(this.groupForm)
          .then(() => {
            this.submitLoading = false;
            this.groupVisible = false;
            this.$message.success('保存成功');
            this.getGroupList();
          })
          .catch(() => {
            this.submitLoading = false;
          });
      });
    },
    handleDeleteGroup(data) {
      this.$confirm(`确定删除分组「${data.name}」吗？分组下有内容时无法删除。`, '提示', { type: 'warning' }).then(() => {
        qdiyMaterialDeleteApi([data.id]).then(() => {
          this.$message.success('删除成功');
          this.getGroupList();
        });
      });
    },
    handleGetImage(img) {
      const list = Array.isArray(img) ? img : [img];
      const tasks = list
        .map((e) => (typeof e === 'string' ? { url: e, name: e.split('/').pop() } : { url: e.sattDir, name: e.name || e.sattDir }))
        .filter((e) => e.url)
        .map((e) =>
          qdiyMaterialSaveApi({
            pid: this.tableFrom.pid || 0,
            name: e.name,
            type: 1,
            url: e.url,
            sort: 0,
          }),
        );
      Promise.all(tasks).then(() => {
        this.uploadVisible = false;
        this.$message.success(`已添加 ${tasks.length} 个素材`);
        this.getList();
      });
    },
    handleCopyUrl(row) {
      const input = document.createElement('input');
      input.value = row.url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.$message.success('链接已复制');
    },
    handleMove() {
      this.moveTargetPid = 0;
      this.moveVisible = true;
    },
    handleMoveSubmit() {
      this.submitLoading = true;
      qdiyMaterialMoveApi(
        this.moveTargetPid,
        this.selection.map((e) => e.id),
      )
        .then(() => {
          this.submitLoading = false;
          this.moveVisible = false;
          this.$message.success('移动成功');
          this.getList();
        })
        .catch(() => {
          this.submitLoading = false;
        });
    },
    handleDelete(row) {
      this.$confirm(`确定删除素材「${row.name}」吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyMaterialDeleteApi([row.id]).then(() => {
          this.$message.success('删除成功');
          this.getList();
        });
      });
    },
    handleBatchDelete() {
      this.$confirm(`确定删除选中的 ${this.selection.length} 个素材吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyMaterialDeleteApi(this.selection.map((e) => e.id)).then(() => {
          this.$message.success('删除成功');
          this.getList();
        });
      });
    },
  },
};
</script>

<style scoped lang="scss">
.group-panel {
  border-right: 1px solid #ebeef5;
  min-height: 500px;
  padding-right: 12px;
}
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
}
.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
  .tree-op i {
    margin-left: 8px;
    color: #909399;
  }
}
.demo-image__preview {
  ::v-deep .el-image {
    width: 40px;
    height: 40px;
  }
}
.video-icon {
  font-size: 28px;
  color: #909399;
}
.ml10 {
  margin-left: 10px;
}
.mb20 {
  margin-bottom: 20px;
}
</style>
