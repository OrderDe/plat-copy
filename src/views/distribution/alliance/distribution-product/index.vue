<template>
  <div class="divBox distribution-product-page">
    <el-card shadow="never" :bordered="false" class="filter-card">
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="商品搜索">
          <el-input
            v-model.trim="query.keywords"
            clearable
            placeholder="商品名称"
            class="keyword-input"
            @keyup.enter.native="load(1)"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="load(1)">查询</el-button>
          <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
          <el-button type="success" icon="el-icon-plus" @click="openCreate">添加分销商品</el-button>
        </el-form-item>
      </el-form>
      <div class="page-tip">加入并启用后，商品会出现在 App 的“分销商品”专区；商品下架或关闭 App 展示后会自动隐藏。</div>
    </el-card>

    <el-card shadow="never" :bordered="false" class="table-card">
      <el-table v-loading="loading" :data="list" border size="small">
        <el-table-column prop="id" label="配置ID" width="75" />
        <el-table-column label="商品" min-width="300">
          <template slot-scope="{ row }">
            <div class="product-cell">
              <el-image v-if="row.image" :src="row.image" fit="cover" class="product-image" />
              <div class="product-meta">
                <div class="product-name" :title="displayName(row)">{{ displayName(row) }}</div>
                <div class="product-id">商品ID：{{ row.productId || row.product_id }}<span v-if="row.merId || row.mer_id"> · 商户：{{ row.merId || row.mer_id }}</span></div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价（元）" width="105" />
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column label="团长比例" width="105">
          <template slot-scope="{ row }">{{ ratio(row, 'leaderRatio', 'leader_ratio', 'l1Ratio', 'l1_ratio') }}</template>
        </el-table-column>
        <el-table-column label="代理比例" width="105">
          <template slot-scope="{ row }">{{ ratio(row, 'agentRatio', 'agent_ratio', 'l2Ratio', 'l2_ratio') }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column label="分销状态" width="100">
          <template slot-scope="{ row }">
            <el-switch
              v-model="row.commissionOpen"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="停用"
              @change="toggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="125" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="text" size="small" class="danger-text" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="query.limit"
        :current-page="query.page"
        :total="total"
        @size-change="onSizeChange"
        @current-change="load"
      />
    </el-card>

    <el-dialog :title="form.id ? '编辑分销商品' : '添加分销商品'" :visible.sync="dialogVisible" width="560px" @close="closeDialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="115px" size="small">
        <el-form-item label="商品" prop="productId">
          <div class="selected-product" v-if="selectedProduct">
            <el-image v-if="selectedProduct.image" :src="selectedProduct.image" fit="cover" class="product-image" />
            <div class="product-meta">
              <div class="product-name">{{ selectedProduct.name }}</div>
              <div class="product-id">商品ID：{{ selectedProduct.id }} · 售价：{{ selectedProduct.price }}</div>
            </div>
          </div>
          <el-button icon="el-icon-search" @click="openPicker">选择商品</el-button>
          <span class="field-tip" v-if="form.productId">已选 ID {{ form.productId }}</span>
          <span class="field-tip" v-if="bulkProducts.length > 1">已选 {{ bulkProducts.length }} 件商品，将批量创建</span>
        </el-form-item>
        <el-form-item label="团长分成比例" prop="leaderRatio">
          <el-input-number v-model="form.leaderRatio" :min="0" :max="100" :precision="2" :step="0.1" controls-position="right" />
          <span class="field-tip">百分比，0 表示使用全局规则</span>
        </el-form-item>
        <el-form-item label="代理分成比例" prop="agentRatio">
          <el-input-number v-model="form.agentRatio" :min="0" :max="100" :precision="2" :step="0.1" controls-position="right" />
          <span class="field-tip">百分比，0 表示使用全局规则</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999999" controls-position="right" />
        </el-form-item>
        <el-form-item label="分销状态">
          <el-switch v-model="form.commissionOpen" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="submit">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog title="选择商品" :visible.sync="pickerVisible" width="900px" append-to-body>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="商品搜索">
          <el-input v-model.trim="pickerQuery.keywords" clearable placeholder="商品名称关键字" @keyup.enter.native="loadPicker(1)" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="loadPicker(1)">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table
        ref="pickerTable"
        v-loading="pickerLoading"
        :data="pickerList"
        border
        size="small"
        @selection-change="onPickerSelection"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="商品图" width="70">
          <template slot-scope="{ row }"><el-image v-if="row.image" :src="row.image" fit="cover" class="picker-image" /></template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="商品名称" min-width="280" show-overflow-tooltip />
        <el-table-column prop="price" label="售价" width="100" />
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }"><el-tag size="mini" type="success">{{ row.isShow === true || row.isShow === 1 ? '已上架' : '未上架' }}</el-tag></template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="pickerQuery.page"
        :page-size="pickerQuery.limit"
        :total="pickerTotal"
        @current-change="loadPicker"
      />
      <div slot="footer">
        <el-button size="small" @click="pickerVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="confirmPicker">确定选择</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { GetIntegrateProductPage } from '@/api/product';
import {
  distributionProductListApi,
  distributionProductSaveApi,
  distributionProductToggleApi,
  distributionProductDeleteApi,
} from '@/api/distributionProduct';

export default {
  name: 'DistributionProduct',
  data() {
    return {
      loading: false,
      saving: false,
      list: [],
      total: 0,
      query: { page: 1, limit: 20, keywords: '' },
      dialogVisible: false,
      form: this.emptyForm(),
      selectedProduct: null,
      bulkProducts: [],
      pickerVisible: false,
      pickerLoading: false,
      pickerList: [],
      pickerTotal: 0,
      pickerQuery: { page: 1, limit: 10, keywords: '' },
      pickerSelection: [],
      rules: {
        productId: [{ required: true, message: '请选择商品', trigger: 'change' }],
        leaderRatio: [{ required: true, message: '请输入团长比例', trigger: 'change' }],
        agentRatio: [{ required: true, message: '请输入代理比例', trigger: 'change' }],
      },
    };
  },
  created() {
    this.load(1);
  },
  watch: {
    pickerVisible(value) {
      if (value) this.loadPicker(1);
    },
  },
  methods: {
    emptyForm() {
      return { id: null, merId: 0, productId: null, productName: '', image: '', leaderRatio: 0, agentRatio: 0, levelDiffRatio: 0, commissionOpen: 1, sort: 0 };
    },
    normalizePage(res) {
      const data = res && res.data !== undefined ? res.data : res;
      return data || {};
    },
    load(page) {
      if (page) this.query.page = page;
      this.loading = true;
      distributionProductListApi(this.query)
        .then((res) => {
          const data = this.normalizePage(res);
          this.list = (data.list || data.records || []).map((row) => ({
            ...row,
            productId: row.productId !== undefined ? row.productId : row.product_id,
            merId: row.merId !== undefined ? row.merId : row.mer_id,
            commissionOpen: Number(row.commissionOpen !== undefined ? row.commissionOpen : row.commission_open) === 1 ? 1 : 0,
          }));
          this.total = Number(data.total) || 0;
        })
        .finally(() => { this.loading = false; });
    },
    reset() {
      this.query = { page: 1, limit: 20, keywords: '' };
      this.load(1);
    },
    onSizeChange(limit) {
      this.query.limit = limit;
      this.load(1);
    },
    displayName(row) {
      return row.productName || row.product_name || row.name || '未命名商品';
    },
    ratio(row, ...keys) {
      for (let i = 0; i < keys.length; i += 1) {
        if (row[keys[i]] !== undefined && row[keys[i]] !== null) return `${row[keys[i]]}%`;
      }
      return '全局规则';
    },
    openCreate() {
      this.form = this.emptyForm();
      this.selectedProduct = null;
      this.bulkProducts = [];
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
    },
    openEdit(row) {
      this.form = {
        id: row.id,
        merId: Number(row.merId || row.mer_id || 0),
        productId: Number(row.productId || row.product_id),
        productName: this.displayName(row),
        image: row.image || '',
        leaderRatio: Number(row.leaderRatio || row.leader_ratio || row.l1Ratio || row.l1_ratio || 0),
        agentRatio: Number(row.agentRatio || row.agent_ratio || row.l2Ratio || row.l2_ratio || 0),
        levelDiffRatio: Number(row.levelDiffRatio || row.level_diff_ratio || 0),
        commissionOpen: Number(row.commissionOpen !== undefined ? row.commissionOpen : row.commission_open) === 1 ? 1 : 0,
        sort: Number(row.sort) || 0,
      };
      this.bulkProducts = [];
      this.selectedProduct = { id: this.form.productId, name: this.form.productName, image: this.form.image, price: row.price };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate());
    },
    closeDialog() {
      this.selectedProduct = null;
      this.bulkProducts = [];
    },
    openPicker() {
      this.pickerSelection = [];
      this.pickerVisible = true;
    },
    loadPicker(page) {
      if (page) this.pickerQuery.page = page;
      this.pickerLoading = true;
      GetIntegrateProductPage({
        pageNum: this.pickerQuery.page,
        pageSize: this.pickerQuery.limit,
        name: this.pickerQuery.keywords || '',
        deleted: 0,
      })
        .then((res) => {
          // 商品库接口在不同网关版本下可能直接返回分页对象，也可能包在 data 中；
          // 与主列表保持同一套归一化逻辑，确保“选择商品”弹窗能正常展示商品库数据。
          const data = this.normalizePage(res);
          this.pickerList = (data.list || data.records || []).map((row) => ({
            ...row,
            // 商品库是整合宽表，id 为 sourceType_originalId 复合主键；
            // 分销配置关联商城主表商品，必须使用 originalId。
            id: row.originalId !== undefined ? row.originalId : (row.productId || row.id),
            merId: row.merId !== undefined ? row.merId : row.mer_id,
            name: row.name || row.productName || row.product_name || '未命名商品',
            image: row.image || row.imageUrl || row.productImage || '',
          }));
          this.pickerTotal = Number(data.total || data.count) || 0;
        })
        .finally(() => { this.pickerLoading = false; });
    },
    onPickerSelection(rows) {
      this.pickerSelection = rows || [];
    },
    confirmPicker() {
      if (!this.pickerSelection.length) {
        this.$message.warning('请至少勾选一个商品');
        return;
      }
      const rows = this.pickerSelection.slice();
      const first = rows[0];
      this.form.productId = Number(first.id);
      this.form.merId = Number(first.merId || first.mer_id || 0);
      this.form.productName = first.name || '';
      this.form.image = first.image || '';
      this.selectedProduct = first;
      this.bulkProducts = rows;
      this.pickerVisible = false;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate('productId'));
    },
    selectProduct(row) {
      this.form.productId = Number(row.id);
      this.form.merId = Number(row.merId || row.mer_id || 0);
      this.form.productName = row.name || '';
      this.form.image = row.image || '';
      this.selectedProduct = row;
      this.bulkProducts = [];
      this.pickerVisible = false;
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate('productId'));
    },
    submit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.saving = true;
        const products = this.form.id ? [this.selectedProduct] : (this.bulkProducts.length ? this.bulkProducts : [this.selectedProduct]);
        const requests = products.filter(Boolean).map((product) => distributionProductSaveApi({
          ...this.form,
          id: this.form.id || null,
          productId: Number(product.id),
          productName: product.name || this.form.productName || '',
          image: product.image || this.form.image || '',
          merId: Number(product.merId || product.mer_id || this.form.merId) || 0,
        }));
        Promise.all(requests).then(() => {
            this.$message.success(requests.length > 1 ? `已批量添加 ${requests.length} 件商品` : '保存成功');
            this.dialogVisible = false;
            this.load(1);
          })
          .finally(() => { this.saving = false; });
      });
    },
    toggle(row) {
      const open = Number(row.commissionOpen) === 1 ? 1 : 0;
      distributionProductToggleApi(row.id, open)
        .then(() => this.$message.success(open ? '已启用分销' : '已停用分销'))
        .catch(() => { row.commissionOpen = open ? 0 : 1; });
    },
    remove(row) {
      this.$confirm(`确定删除“${this.displayName(row)}”的分销配置吗？`, '提示', { type: 'warning' })
        .then(() => distributionProductDeleteApi(row.id))
        .then(() => { this.$message.success('删除成功'); this.load(); })
        .catch(() => {});
    },
  },
};
</script>

<style scoped lang="scss">
.filter-card { margin-bottom: 14px; }
.table-card { min-height: 460px; }
.keyword-input { width: 240px; }
.page-tip { color: #909399; font-size: 12px; line-height: 20px; }
.product-cell,
.selected-product { display: flex; align-items: center; min-width: 0; }
.product-image,
.picker-image { width: 48px; height: 48px; flex: 0 0 auto; border-radius: 4px; background: #f5f7fa; }
.picker-image { width: 40px; height: 40px; }
.product-meta { min-width: 0; margin-left: 10px; }
.product-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #303133; }
.product-id,
.field-tip { color: #909399; font-size: 12px; line-height: 20px; }
.field-tip { margin-left: 10px; }
.danger-text { color: #f56c6c; }
.el-pagination { margin-top: 14px; text-align: right; }
</style>
