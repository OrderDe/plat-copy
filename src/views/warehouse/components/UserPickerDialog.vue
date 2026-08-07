<template>
  <el-dialog title="选择申请人" :visible.sync="visible" width="720px" append-to-body @open="onOpen">
    <el-form :inline="true" size="small">
      <el-form-item label="关键字">
        <el-input v-model="keyword" placeholder="昵称 / 手机号" clearable @keyup.enter.native="onSearch" style="width:220px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">搜索</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list" border size="small" highlight-current-row @row-click="pick">
      <el-table-column label="选择" width="60" align="center">
        <template slot-scope="{row}">
          <el-radio v-model="selectedKey" :label="rowKey(row)">{{ '' }}</el-radio>
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" min-width="160" />
      <el-table-column prop="phone" label="手机号" width="160" />
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
      <el-button type="primary" size="small" :disabled="!selectedUser" @click="confirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { userListApi } from '@/api/user';

export default {
  name: 'UserPickerDialog',
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
      selectedUser: null,
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
        this.selectedUser = null;
        this.visible = true;
      });
    },
    onOpen() { this.load(); },
    onSearch() { this.page = 1; this.load(); },
    rowKey(row) { return row.uid != null ? row.uid : row.id; },
    async load() {
      this.loading = true;
      try {
        const res = await userListApi({ page: this.page, limit: this.limit, keywords: this.keyword, nickname: this.keyword });
        this.list = (res && res.list) || (res && res.records) || [];
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    pick(row) {
      this.selectedKey = this.rowKey(row);
      this.selectedUser = row;
    },
    confirm() {
      if (!this.selectedUser) return;
      if (this.resolver) this.resolver(this.selectedUser);
      this.resolver = null;
      this.visible = false;
    },
  },
  beforeDestroy() {
    if (this.resolver) { this.resolver(null); this.resolver = null; }
  },
};
</script>
