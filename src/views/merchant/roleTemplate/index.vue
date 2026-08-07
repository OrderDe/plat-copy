<template>
  <div class="divBox">
    <el-card class="box-card" :bordered="false" shadow="never" :body-style="{ padding: 0 }">
      <div class="padding-add">
        <el-form inline size="small" @submit.native.prevent>
          <el-form-item label="角色模板名称：">
            <el-input
              v-model.trim="listPram.name"
              @keyup.enter.native="handleGetList"
              placeholder="请输入角色模板名称"
              clearable
              class="selWidth"
            />
          </el-form-item>
          <el-form-item>
            <el-button size="mini" type="primary" @click.native="handleGetList">查询</el-button>
            <el-button size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-card class="box-card mt14" :body-style="{ padding: '20px' }" shadow="never" :bordered="false">
      <el-form inline @submit.native.prevent>
        <el-form-item>
          <el-button
            size="mini"
            type="primary"
            @click="handlerOpenEdit(0)"
            >添加角色模板</el-button>
            <!-- v-hasPermi="['platform:admin:roleTemplate:save']" -->
        </el-form-item>
      </el-form>
      <el-table :data="listData.records" size="small" v-loading="listLoading">
        <el-table-column label="角色模板编号" prop="id" width="120"></el-table-column>
        <el-table-column label="角色模板名称" prop="name" min-width="130" />
        <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" fixed="right" min-width="100">
          <template slot-scope="scope">
            <el-switch
              v-if="checkPermi(['platform:admin:roleTemplate:updateStatus'])"
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="停用"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
            <div v-else>{{ scope.row.status == 1 ? '启用' : '停用' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="scope">
            <a @click="handlerOpenEdit(1, scope.row)" >编辑</a>
            <!-- v-hasPermi="['platform:admin:roleTemplate:update']" -->
            <el-divider direction="vertical"></el-divider>
            <a @click="handlerOpenDel(scope.row)" >删除</a>
            <!-- v-hasPermi="['platform:admin:roleTemplate:delete']" -->
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        :current-page="listPram.pageNum"
        :page-sizes="constants.page.limit"
        :layout="constants.page.layout"
        :total="listData.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
    <el-dialog
      :visible.sync="editDialogConfig.visible"
      :title="editDialogConfig.isCreate === 0 ? '创建角色模板' : '编辑角色模板'"
      destroy-on-close
      :close-on-click-modal="false"
      width="500px"
      class="dialog-bottom"
    >
      <edit
        v-if="editDialogConfig.visible"
        :is-create="editDialogConfig.isCreate"
        :edit-data="editDialogConfig.editData"
        @hideEditDialog="hideEditDialog"
        ref="editForm"
      />
    </el-dialog>
  </div>
</template>

<script>

import * as roleTemplateApi from '@/api/roleTemplate.js';
import edit from './edit';
import { checkPermi } from '@/utils/permission'; // 权限判断函数
export default {
  components: { edit },
  data() {
    return {
      constants: this.$constants,
      listData: { records: [], total: 0 },
      listLoading: false,
      listPram: {
        name: '',
        status: '',
        pageNum: 1,
        pageSize: this.$constants.page.limit[0],
      },
      editDialogConfig: {
        visible: false,
        isCreate: 0, // 0=创建，1=编辑
        editData: {},
      },
    };
  },
  mounted() {
      // if (checkPermi(['platform:admin:roleTemplate:list'])) 
    this.handleGetList();
  },
  methods: {
    checkPermi,
    handlerOpenDel(rowData) {
      this.$modalSure('确认删除当前数据').then(() => {
        roleTemplateApi.deleteRoleTemplate(rowData.id).then(() => {
          this.$message.success('删除数据成功');
          this.handleGetList();
        });
      });
    },
    handleGetList() {
    //   if (!checkPermi(['platform:admin:roleTemplate:list'])) return;
      this.listLoading = true;
      roleTemplateApi.getRoleTemplatePage(this.listPram).then((data) => {
        console.log(data, 'data');
        this.listData = { ...data, total: Number(data.total) };
        this.listLoading = false;
      }).catch(() => {
        this.listLoading = false;
      });
    },
    handlerOpenEdit(isCreate, editDate) {
      isCreate === 1 ? (this.editDialogConfig.editData = editDate) : (this.editDialogConfig.editData = {});
      this.editDialogConfig.isCreate = isCreate;
      this.editDialogConfig.visible = true;
    },
    hideEditDialog() {
      this.editDialogConfig.visible = false;
      this.handleGetList();
    },
    handleSizeChange(val) {
      this.listPram.pageSize = val;
      this.handleGetList();
    },
    handleCurrentChange(val) {
      this.listPram.pageNum = val;
      this.handleGetList();
    },
    // 修改状态
    handleStatusChange(row) {
      roleTemplateApi.updateRoleTemplateStatus({ id: row.id, status: row.status }).then(() => {
        this.$message.success('更新状态成功');
        this.handleGetList();
      });
    },
    resetQuery() {
      this.listPram = {
        name: '',
        status: '',
        pageNum: 1,
        pageSize: this.$constants.page.limit[0],
      };
      this.handleGetList();
    },
  },
};
</script>

<style scoped lang="scss"></style>
