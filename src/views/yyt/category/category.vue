<template>
  <!-- v-if="checkPermi(['platform:yyt:category:list'])"  -->
  <div class="divBox relative">
    <el-card :bordered="false" shadow="never" class="ivu-mt" :body-style="{ padding: '20px' }">
      <div class="mb15">
        <span class="page-title">怡亚通分类管理</span>
      </div>
      <el-row :gutter="20" class="mb15">
        <el-col :span="4">
          <el-input v-model="searchForm.name" placeholder="分类名称" size="small" clearable @keyup.enter.native="getList" />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" size="small" @click="getList">搜索</el-button>
          <el-button size="small" @click="resetForm">重置</el-button>
        </el-col>
      </el-row>
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        border
        size="mini"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        class="mt10"
        >
        <!-- lazy -->
        <!-- :load="loadChildren" -->
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="id" label="分类ID" width="120" />
        <el-table-column prop="level" label="层级" width="80">
          <template slot-scope="{ row }">
            <el-tag :type="row.level === 1 ? 'primary' : row.level === 2 ? 'success' : 'warning'" size="mini">
              {{ row.level === 1 ? '一级' : row.level === 2 ? '二级' : '三级' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="isShow" label="是否显示" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="row.isShow ? 'success' : 'danger'" size="mini">
              {{ row.isShow === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="platformType" label="平台类型" width="100">
          <template slot-scope="{ row }">
            {{ row.platformType === 0 ? '自营' : row.platformType === 1 ? '第三方' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="handleEdit(row)"><!-- v-hasPermi="['platform:yyt:category:edit']" -->编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt10 text-right">
        <el-pagination
          :current-page="searchForm.pageNum"
          :page-size="searchForm.pageSize"
          :page-sizes="[10,20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @current-change="pageChange"
          @size-change="sizeChange"
        />
      </div>
    </el-card>
    <!-- 编辑分类弹窗 -->
    <el-dialog title="编辑分类" :visible.sync="editDialogVisible" width="500px">
      <el-form ref="editForm" :model="editForm" label-width="100px">
        <el-form-item label="分类名称：">
          <span>{{ editForm.name }}</span>
        </el-form-item>
        <el-form-item label="图标：">
          <div class="upLoadPicBox" @click="modalPicTap">
            <div v-if="editForm.icon" class="pictrue">
              <img :src="editForm.icon" />
            </div>
            <div v-else class="upLoad">
              <i class="el-icon-camera cameraIconfont" />
            </div>
            <div class="from-tips">建议尺寸(180*180)</div>
          </div>
        </el-form-item>
        <el-form-item label="排序：">
          <el-input-number v-model.trim="editForm.sort" controls-position="right" :min="0" size="small" />
        </el-form-item>
        <el-form-item label="是否显示：">
          <el-switch :width="40" v-model="editForm.isShow" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="层级：">
          <span>{{ editForm.level === 1 ? '一级' : editForm.level === 2 ? '二级' : '三级' }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { GetIntegrateCategoryList, GetIntegrateCategoryDetail, EditIntegrateCategory } from '@/api/yytapi';
// import { checkPermi } from '@/utils/permission';

export default {
  name: 'YytCategory',
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      searchForm: {
        pageNum: 1,
        pageSize: 10,
        name: '',
      },
      editDialogVisible: false,
      editForm: {
        id: '0',
        name: '',
        sort: 0,
        isShow: 1,
      },
      submitLoading: false,
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    // checkPermi,
    async getList() {
      this.loading = true;
      try {
        const res = await GetIntegrateCategoryList(this.searchForm);
        console.log('分类列表', res);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally {
        this.loading = false;
      }
    },
    pageChange(val) {
      this.searchForm.pageNum = val;
      this.getList();
    },
    sizeChange(val) {
      this.searchForm.pageSize = val;
      this.searchForm.pageNum = 1;
      this.getList();
    },
    resetForm() {
      this.searchForm = {
        pageNum: 1,
        pageSize: 10,
        name: '',
      };
      this.getList();
    },
    async handleEdit(row) {
      try {
        const res = await GetIntegrateCategoryDetail(row.id);
        console.log('分类详情', res);
        this.editForm = {
          id: res.id,
          name: res.name,
          sort: res.sort,
          isShow: res.isShow,
          pid: res.pid,
          icon: res.icon,
          platformType: res.platformType,
          level: res.level,
          subId: res.subId,
        };
        this.editDialogVisible = true;
      } catch (e) {
        this.$message.error('获取分类详情失败');
      }
    },
    async handleSubmit() {
      this.submitLoading = true;
      try {
        await EditIntegrateCategory(this.editForm);
        this.$message.success('修改成功');
        this.editDialogVisible = false;
        this.getList();
      } catch (e) {
        this.$message.error('修改失败');
      } finally {
        this.submitLoading = false;
      }
    },
    modalPicTap() {
      const _this = this;
      this.$modalUpload(
        function (img) {
          if (!img) return;
          _this.editForm.icon = img[0].sattDir;
        },
        false,
        'store'
      );
    },
    // // 懒加载子分类
    // async loadChildren(tree, treeNode, resolve) {
    //   const parentLevel = tree.level + 1;
    //   try {
    //     const res = await GetIntegrateCategoryList({ pid: tree.id, level: parentLevel });
    //     console.log(`加载${parentLevel === 2 ? '二级' : '三级'}分类`, res);
    //     const children = (res || []).map((item) => ({
    //       ...item,
    //       level: parentLevel,
    //       hasChildren: parentLevel < 3, // 三级以下不再有子节点
    //     }));
    //     resolve(children);
    //   } catch (e) {
    //     console.error('加载子分类失败', e);
    //     resolve([]);
    //   }
    // },
  },
};
</script>
<style scoped>
.upLoadPicBox {
  position: relative;
  width: 80px;
  height: 80px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}
.upLoadPicBox .pictrue {
  width: 100%;
  height: 100%;
}
.upLoadPicBox .pictrue img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upLoadPicBox .upLoad {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.upLoadPicBox .cameraIconfont {
  font-size: 24px;
  color: #999;
}
.upLoadPicBox .from-tips {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: 10px;
  color: #999;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
}
</style>
