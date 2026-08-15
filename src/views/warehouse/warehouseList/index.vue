<template>
  <div class="app-container">
    <!-- 搜索栏-->
    <el-form :inline="true" :model="query" size="small" class="filter-container">
      <el-form-item label="仓库名称">
        <el-input v-model="query.name" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="仓库编码">
        <el-input v-model="query.code" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" clearable placeholder="全部" style="width:120px">
          <el-option label="实体仓" :value="0" />
          <el-option label="虚拟仓" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width:120px">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
        <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div style="margin-bottom:12px">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="openDialog()">新增仓库</el-button>
    </div>

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="code" label="仓库编码" width="140" />
      <el-table-column prop="name" label="仓库名称" min-width="150" />
      <el-table-column label="类型" width="90">
        <template slot-scope="{row}">
          <el-tag size="mini">{{ typeText(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contactName" label="联系人" width="100" />
      <el-table-column prop="contactPhone" label="电话" width="130" />
      <el-table-column label="地址" min-width="200" show-overflow-tooltip>
        <template slot-scope="{row}">
          {{ [row.province, row.city, row.region, row.detailAddress, row.building, row.floor].filter(Boolean).join('') }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template slot-scope="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="mini">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template slot-scope="{row}">
          <el-button type="text" @click="openDialog(row)">编辑</el-button>
          <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;text-align:right"
      :current-page.sync="query.page"
      :page-size.sync="query.limit"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadPage"
      @current-change="loadPage"
    />

    <!-- 新增/编辑对话框-->
    <el-dialog :title="form.id ? '编辑仓库' : '新增仓库'" :visible.sync="dialogVisible" width="640px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="仓库编码" prop="code">
          <el-input v-model="form.code" placeholder="唯一编码" :readonly="!form.id" />
        </el-form-item>
        <el-form-item label="仓库名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="实体仓" :value="0" />
            <el-option label="虚拟仓" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" maxlength="11" />
        </el-form-item>
        <el-form-item label="所在地区" prop="regionIds">
          <el-cascader
            v-model="form.regionIds"
            :options="cityOptions"
            :props="cascaderProps"
            style="width:100%"
            placeholder="请选择省/市/区"
            clearable
            @change="onRegionChange"
          />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="form.detailAddress" type="textarea" :rows="2" />
          <!-- 复核完成后系统按这里的联系人和地址向京东取运单号，面单上的寄件人就是它 -->
          <div class="form-tip">
            联系人、电话、所在地区、详细地址会作为<b>面单寄件人</b>，缺一项就取不到运单号，
            只能在出库交接时手工录入。
          </div>
        </el-form-item>
        <el-form-item label="栋">
          <el-input v-model="form.building" maxlength="64" placeholder="如：A栋" />
        </el-form-item>
        <el-form-item label="层">
          <el-input v-model="form.floor" maxlength="64" placeholder="如：3层" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="onSubmit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { warehouseApi } from '@/api/warehouse';
import request from '@/utils/request';
import { validatePhone } from '@/utils/toolsValidate';

const cityListTree = () => request({ url: '/admin/merchant/city/region/city/tree', method: 'get' });

export default {
  name: 'WarehouseList',
  data() {
    return {
      loading: false,
      saving: false,
      total: 0,
      tableData: [],
      query: { page: 1, limit: 20, name: '', code: '', type: null, status: null },
      dialogVisible: false,
      form: this.emptyForm(),
      cityOptions: [],
      cascaderProps: { value: 'id', label: 'name', children: 'child', checkStrictly: false, emitPath: true },
      rules: {
        code: [{ required: true, message: '请输入结算库编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入结算库名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择类型', trigger: 'change' }],
        contactPhone: [{ validator: this.validateContactPhone, trigger: 'blur' }],
      },
    };
  },
  created() {
    this.loadPage();
    // 存下 promise：编辑弹窗可能在树加载完成前打开，届时直接 await 它而不是重复请求
    this.cityTreeReady = this.loadCityTree();
  },
  methods: {
    emptyForm() {
      return { id: null, code: '', name: '', type: 0, contactName: '', contactPhone: '',
        province: '', city: '', region: '', regionIds: [], detailAddress: '', building: '', floor: '', status: 1, remark: '' };
    },
    typeText(t) {
      return ({ 0: '实体仓', 1: '虚拟仓' })[t] || '-';
    },
    genWarehouseCode() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      return `W${ts}${rand}`;
    },
    validateContactPhone(rule, value, callback) {
      if (!value) return callback();
      validatePhone(rule, value, callback);
    },
    async loadCityTree() {
      try {
        const res = await cityListTree();
        const list = Array.isArray(res) ? res : (res && res.list) || [];
        this.cityOptions = this.normalizeTree(list);
      } catch (e) { /* ignore */ }
    },
    /**
     * 只保留省/市/区三级。接口的城市树带第四级（街道/乡镇），
     * 而级联选择器是 checkStrictly:false —— 非叶子节点选不中，
     * 区级下面若还挂着子节点，选到区就只是高亮展开、输入框还是空的。
     */
    normalizeTree(list, depth = 1) {
      if (!Array.isArray(list)) return [];
      return list.map(n => {
        const children = n.child || n.children;
        const item = { id: n.regionId != null ? n.regionId : n.id, name: n.regionName || n.name };
        if (depth < 3 && Array.isArray(children) && children.length) {
          item.child = this.normalizeTree(children, depth + 1);
        }
        return item;
      });
    },
    async loadPage() {
      this.loading = true;
      try {
        const res = await warehouseApi.page(this.query);
        this.tableData = (res && res.list) || [];
        this.total = (res && res.total) || 0;
      } finally {
        this.loading = false;
      }
    },
    onSearch() {
      this.query.page = 1;
      this.loadPage();
    },
    onReset() {
      this.query = { page: 1, limit: 20, name: '', code: '', type: null, status: null };
      this.loadPage();
    },
    async openDialog(row) {
      if (row) {
        this.form = { ...this.emptyForm(), ...row, regionIds: [] };
        // 库里只存了省市区名称、没存行政区ID，编辑时要按名称反查出级联路径，
        // 否则「所在地区」永远是空的，一保存就把原地区清掉了
        if (!this.cityOptions.length) await (this.cityTreeReady || this.loadCityTree());
        this.form.regionIds = this.resolveRegionIds(row.province, row.city, row.region);
      } else {
        this.form = this.emptyForm();
        this.form.code = this.genWarehouseCode();
      }
      this.dialogVisible = true;
    },
    /**
     * 按省/市/区名称在城市树里逐层反查出 ID 路径。
     * 匹配到哪层就返回到哪层——名称对不上时给出部分路径，好过整个落空。
     */
    resolveRegionIds(province, city, region) {
      const ids = [];
      const p = this.matchRegion(this.cityOptions, province);
      if (!p) return ids;
      ids.push(p.id);
      const c = this.matchRegion(p.child, city);
      if (!c) return ids;
      ids.push(c.id);
      const r = this.matchRegion(c.child, region);
      if (r) ids.push(r.id);
      return ids;
    },
    /**
     * 三层匹配，逐级放宽：
     *  1. 名称完全相同
     *  2. 去掉行政区后缀后相同 —— 容忍「北京」与「北京市」
     *  3. 互相包含 —— 容忍「北京市市辖区」与「市辖区」
     * 只在同一父节点的子集里比较，放宽到 includes 也不易误命中。
     */
    matchRegion(nodes, name) {
      if (!Array.isArray(nodes) || !name) return null;
      const target = String(name).trim();
      if (!target) return null;

      const exact = nodes.find(n => n.name === target);
      if (exact) return exact;

      const strip = (s) => String(s || '').replace(/(省|市|区|县|自治区|自治州|特别行政区|市辖区)$/g, '');
      const key = strip(target);
      if (key) {
        const stripped = nodes.find(n => strip(n.name) === key);
        if (stripped) return stripped;
      }

      return nodes.find(n => {
        const nm = String(n.name || '');
        return nm && (nm.includes(target) || target.includes(nm));
      }) || null;
    },
    onRegionChange(ids) {
      const cascader = this.findCascader();
      if (cascader) {
        const nodes = cascader.getCheckedNodes();
        if (nodes && nodes.length) {
          const path = nodes[0].pathLabels || [];
          this.form.province = path[0] || '';
          this.form.city = path[1] || '';
          this.form.region = path[2] || '';
          return;
        }
      }
      this.form.province = '';
      this.form.city = '';
      this.form.region = '';
    },
    findCascader() {
      const walk = (children) => {
        for (const c of children) {
          if (c.$options && c.$options.name === 'ElCascader') return c;
          if (c.$children && c.$children.length) {
            const r = walk(c.$children);
            if (r) return r;
          }
        }
        return null;
      };
      return this.$refs.formRef ? walk(this.$refs.formRef.$children) : null;
    },
    resetForm() {
      this.$refs.formRef && this.$refs.formRef.resetFields();
      this.form = this.emptyForm();
    },
    async onSubmit() {
      await this.$refs.formRef.validate();
      this.saving = true;
      try {
        const payload = { ...this.form };
        delete payload.regionIds;
        if (payload.id) {
          await warehouseApi.edit(payload);
        } else {
          await warehouseApi.add(payload);
        }
        this.$message.success('保存成功');
        this.dialogVisible = false;
        this.loadPage();
      } finally {
        this.saving = false;
      }
    },
    onDelete(row) {
      this.$confirm(`确认畾删除仓库「${row.name}」`, '提示', { type: 'warning' })
        .then(async () => {
          await warehouseApi.del(row.id);
          this.$message.success('删除成功');
          this.loadPage();
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.form-tip { color: #909399; font-size: 12px; line-height: 1.5; margin-top: 4px; }
</style>
