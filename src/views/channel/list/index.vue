<template>
  <div class="divBox">
    <el-card shadow="never" :bordered="false">
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="渠道"><el-input v-model.trim="query.keyword" clearable placeholder="名称或编码" @keyup.enter.native="loadList(1)" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="query.status" clearable placeholder="全部" @change="loadList(1)"><el-option label="启用" :value="1" /><el-option label="停用" :value="0" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="loadList(1)">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" :bordered="false" class="mt14">
      <el-button type="primary" size="small" @click="openEdit()" v-hasPermi="['platform:channel:save']">新增渠道</el-button>
      <el-table v-loading="loading" :data="list" border size="small" class="mt20">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="code" label="渠道编码" width="150" />
        <el-table-column prop="name" label="渠道名称" min-width="160" />
        <el-table-column prop="merId" label="货权商户 ID" width="110" />
        <el-table-column label="对接人" min-width="150"><template slot-scope="scope">{{ scope.row.contactName || '-' }} {{ scope.row.contactPhone || '' }}</template></el-table-column>
        <el-table-column label="状态" width="80"><template slot-scope="scope"><el-tag size="mini" :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="130" fixed="right"><template slot-scope="scope"><el-button type="text" size="small" @click="openEdit(scope.row)" v-hasPermi="['platform:channel:save']">编辑</el-button><el-button type="text" size="small" class="danger" @click="remove(scope.row)" v-hasPermi="['platform:channel:delete']">删除</el-button></template></el-table-column>
      </el-table>
      <div class="pagination"><el-pagination background layout="total, sizes, prev, pager, next, jumper" :current-page="query.page" :page-size="query.limit" :page-sizes="[10,20,50]" :total="total" @size-change="changeSize" @current-change="loadList" /></div>
    </el-card>
    <el-dialog :title="form.id ? '编辑渠道' : '新增渠道'" :visible.sync="visible" width="520px">
      <el-form ref="form" :model="form" :rules="rules" label-width="90px" size="small">
        <el-form-item label="渠道编码" prop="code"><el-input v-model.trim="form.code" /></el-form-item>
        <el-form-item label="渠道名称" prop="name"><el-input v-model.trim="form.name" /></el-form-item>
        <el-form-item label="货权商户 ID"><el-input-number v-model="form.merId" :min="0" controls-position="right" /></el-form-item>
        <el-form-item label="对接人"><el-input v-model.trim="form.contactName" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model.trim="form.contactPhone" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="备注"><el-input v-model.trim="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer"><el-button @click="visible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></div>
    </el-dialog>
  </div>
</template>

<script>
import { channelListApi, channelSaveApi, channelDeleteApi } from '@/api/channel';
export default {
  name: 'ChannelList',
  data() { return { loading: false, saving: false, visible: false, list: [], total: 0, query: { page: 1, limit: 20, keyword: '', status: null }, form: { id: null, code: '', name: '', merId: 0, contactName: '', contactPhone: '', status: 1, remark: '' }, rules: { code: [{ required: true, message: '请输入渠道编码', trigger: 'blur' }], name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }] } }; },
  created() { this.loadList(1); },
  methods: {
    loadList(page) { if (page) this.query.page = page; this.loading = true; channelListApi(this.query).then((res) => { this.list = (res && (res.list || res.records)) || []; this.total = Number((res && res.total) || 0); }).finally(() => { this.loading = false; }); },
    changeSize(size) { this.query.limit = size; this.loadList(1); },
    reset() { this.query = { page: 1, limit: 20, keyword: '', status: null }; this.loadList(1); },
    openEdit(row) { this.form = row ? { ...row } : { id: null, code: '', name: '', merId: 0, contactName: '', contactPhone: '', status: 1, remark: '' }; this.visible = true; },
    save() { this.$refs.form.validate((valid) => { if (!valid) return; this.saving = true; channelSaveApi(this.form).then(() => { this.$message.success('保存成功'); this.visible = false; this.loadList(); }).finally(() => { this.saving = false; }); }); },
    remove(row) { this.$confirm(`确认删除渠道“${row.name}”？`, '提示', { type: 'warning' }).then(() => channelDeleteApi(row.id)).then(() => { this.$message.success('删除成功'); this.loadList(); }).catch(() => {}); },
  },
};
</script>

<style scoped>
.pagination { text-align: right; margin-top: 20px; }
.danger { color: #f56c6c; }
</style>
