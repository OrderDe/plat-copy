<template>
  <el-dialog :title="title" :visible.sync="visible" width="720px" append-to-body @open="onOpen">
    <el-form :inline="true" size="small">
      <el-form-item label="关键字">
        <el-input v-model="keyword" placeholder="姓名" clearable style="width:220px" @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">搜索</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list" border size="small" highlight-current-row @row-click="pick">
      <el-table-column label="选择" width="60" align="center">
        <template slot-scope="{row}">
          <el-radio v-model="selectedKey" :label="row.id">{{ '' }}</el-radio>
        </template>
      </el-table-column>
      <el-table-column prop="realName" label="姓名" min-width="140" />
      <el-table-column prop="account" label="账号" min-width="140" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="roleNames" label="身份" min-width="120" />
    </el-table>
    <el-pagination
      style="margin-top:12px;text-align:right"
      :current-page.sync="page"
      :page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="load"
    />
    <div slot="footer">
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button type="primary" size="small" :disabled="!selected" @click="confirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { adminList } from '@/api/systemadmin';

export default {
  name: 'AdminPickerDialog',
  props: {
    title: { type: String, default: '选择管理员' },
  },
  data() {
    return {
      visible: false,
      keyword: '',
      page: 1,
      limit: 10,
      total: 0,
      list: [],
      loading: false,
      selectedKey: null,
      selected: null,
      resolver: null,
    };
  },
  methods: {
    open() {
      return new Promise((resolve) => {
        this.resolver = resolve;
        this.keyword = '';
        this.page = 1;
        this.selectedKey = null;
        this.selected = null;
        this.visible = true;
      });
    },
    onOpen() { this.load(); },
    onSearch() { this.page = 1; this.load(); },
    async load() {
      this.loading = true;
      try {
        // 只列有效管理员，避免选到已停用账号
        const res = await adminList({ page: this.page, limit: this.limit, realName: this.keyword, status: true });
        this.list = (res && res.list) || (res && res.records) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    pick(row) {
      this.selectedKey = row.id;
      this.selected = row;
    },
    confirm() {
      if (!this.selected) return;
      if (this.resolver) this.resolver(this.selected);
      this.resolver = null;
      this.visible = false;
    },
  },
  beforeDestroy() {
    if (this.resolver) { this.resolver(null); this.resolver = null; }
  },
};
</script>
