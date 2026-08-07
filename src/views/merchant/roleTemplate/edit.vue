<template>
  <div class="role-template-edit">
    <div class="role-template-edit__body">
      <el-form ref="pram" :model="pram" label-width="75px" @submit.native.prevent>
      <el-form-item
        label="模板名称："
        prop="name"
        :rules="[{ required: true, message: '请填写模板名称', trigger: ['blur', 'change'] }]"
      >
        <el-input v-model.trim="pram.name" placeholder="模板名称" />
      </el-form-item>
      <el-form-item label="备注：">
        <el-input v-model.trim="pram.remark" placeholder="备注" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="状态：">
        <el-switch
          v-model="pram.status"
          active-text="启用"
          inactive-text="停用"
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>
      <el-form-item label="菜单权限：">
        <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')">展开/折叠</el-checkbox>
        <el-checkbox v-model="menuCheckStrictly" @change="handleCheckedTreeConnect($event, 'menu')">父子联动</el-checkbox>
        <el-tree
          class="tree-border"
          :data="menuOptions"
          show-checkbox
          ref="menu"
          node-key="id"
          :default-expand-all="expandAll"
          :check-strictly="!menuCheckStrictly"
          empty-text="加载中，请稍候"
          :props="defaultProps"
        ></el-tree>
      </el-form-item>
    </el-form>
    </div>
    <div class="role-template-edit__footer">
      <el-button @click="close">取消</el-button>
      <el-button
        :loading="loading"
        type="primary"
        @click="handlerSubmit('pram')"
        >{{ isCreate === 0 ? '确定' : '更新' }}</el-button>
        <!-- v-hasPermi="['platform:admin:roleTemplate:update', 'platform:admin:roleTemplate:save']" -->
    </div>
  </div>
</template>

<script>

import * as roleTemplateApi from '@/api/roleTemplate.js';
import { menuMerListApi } from '@/api/merchant';
import { handleTree } from '@/utils/parsing';
import { Debounce } from '@/utils/validate';
export default {
  name: 'roleTemplateEdit',
  props: {
    isCreate: {
      type: Number,
      required: true,
    },
    editData: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      expandAll: false,
      pram: {
        name: null,
        remark: '',
        status: 1,
        id: null,
        rules: '',
      },
      menuExpand: false,
      menuNodeAll: false,
      menuOptions: [],
      menuCheckStrictly: true,
      currentNodeId: [],
      defaultProps: {
        children: 'children',
        label: 'name',
      },
      menuIds: [],
    };
  },
  mounted() {
    this.getCacheMenu().then(() => {
      this.initEditData();
    });
  },
  methods: {
    close() {
      this.$emit('hideEditDialog');
    },
    // 加载菜单树（过滤隐藏菜单）
    getCacheMenu() {
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
      });
      return menuMerListApi({}).then((res) => {
        // 过滤隐藏的菜单项
        let visibleList = res
        // .filter((item) => item.isShow !== false);
        // 设置 parentId 字段供 handleTree 使用
        visibleList.forEach((item) => {
          item.parentId = item.pid;
        });
        console.log(visibleList,'visibleList')
        let menuOptions = handleTree(visibleList, 'id', 'parentId', 'children');
        this.menuOptions = menuOptions.filter((item) => item.isShow !== false);
        console.log(this.menuOptions,'menuOptions')
        loading.close();
      });
    },
    // 编辑时初始化数据
    initEditData() {
      if (this.isCreate !== 1) return;
      const { name, remark, status, id } = this.editData;
      this.pram.name = name;
      this.pram.remark = remark;
      this.pram.status = status;
      this.pram.id = id;
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
      });
      roleTemplateApi.getRoleTemplateInfo(id).then((res) => {
        loading.close();
        if (res.rules) {
          const ids = res.rules.split(',').map((id) => Number(id));
          this.$nextTick(() => {
            ids.forEach((id) => {
              const node = this.$refs.menu.getNode(id);
              if (node && node.isLeaf) {
                this.$refs.menu.setChecked(node, true);
              }
            });
          });
        }
      });
    },
    handlerSubmit: Debounce(function (form) {
      this.$refs[form].validate((valid) => {
        if (!valid) return;
        let roles = this.getMenuAllCheckedKeys().toString();
        this.pram.rules = roles;
        if (this.isCreate === 0) {
          this.handlerSave();
        } else {
          this.handlerEdit();
        }
      });
    }),
    handlerSave() {
      this.loading = true;
      roleTemplateApi.addRoleTemplate(this.pram).then(() => {
        this.$message.success('创建角色模板成功');
        this.$emit('hideEditDialog');
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    handlerEdit() {
      this.loading = true;
      roleTemplateApi.updateRoleTemplate(this.pram).then(() => {
        this.$message.success('更新角色模板成功');
        this.$emit('hideEditDialog');
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    // 树权限（展开/折叠）
    handleCheckedTreeExpand(value, type) {
      this.expandAll = this.menuExpand ? true : false;
      if (type == 'menu') {
        let treeList = this.menuOptions;
        for (let i = 0; i < treeList.length; i++) {
          this.$refs.menu.store.nodesMap[treeList[i].id].expanded = value;
        }
      }
    },
    // 树权限（父子联动）
    handleCheckedTreeConnect(value, type) {
      if (type == 'menu') {
        this.menuCheckStrictly = value ? true : false;
      }
    },
    // 所有菜单节点数据
    getMenuAllCheckedKeys() {
      let checkedKeys = this.$refs.menu.getCheckedKeys();
      let halfCheckedKeys = this.$refs.menu.getHalfCheckedKeys();
      checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
      return checkedKeys;
    },
  },
};
</script>

<style scoped>
.role-template-edit__body {
  padding-bottom: 10px;
}
.role-template-edit__footer {
  position: sticky;
  bottom: 0;
  padding: 12px 0 16px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
  text-align: right;
  z-index: 1;
}
</style>
