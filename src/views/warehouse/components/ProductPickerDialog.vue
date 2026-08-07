<template>
  <el-dialog title="商品列表" :visible.sync="visible" width="900px" append-to-body @open="onOpen">
    <el-form :inline="true" size="small">
      <el-form-item label="商品搜索">
        <el-input v-model="keyword" placeholder="请输入商品名称" clearable style="width:220px" @keyup.enter.native="onSearch" />
      </el-form-item>
      <el-form-item label="商户">
        <el-select v-model="merId" filterable clearable placeholder="请选择" style="width:200px">
          <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list" border size="small" highlight-current-row @row-click="pick">
      <el-table-column label="选择" width="60">
        <template slot-scope="{row}">
          <!-- 走 pick 而不是直接赋值 selectedId：否则 radio 的 change 先于 row-click 触发，
               pick 里的同 id 判空会直接 return，规格列表永远加载不出来 -->
          <el-radio :value="selectedId" :label="row.id" @change="pick(row)">{{ '' }}</el-radio>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="商品图" width="70">
        <template slot-scope="{row}">
          <el-image v-if="row.image" :src="row.image" style="width:40px;height:40px" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="220" show-overflow-tooltip />
      <el-table-column label="商户" width="150" show-overflow-tooltip>
        <template slot-scope="{row}">{{ getMerName(row) }}</template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="90" />
      <el-table-column label="库存" width="80">
        <template slot-scope="{row}">
          <span :class="{ 'text-danger': !row.stock }">{{ row.stock == null ? '-' : row.stock }}</span>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      style="margin-top:12px;text-align:right"
      :current-page.sync="page"
      :page-size="limit"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="load"
    />

    <!--
      规格区：仓储按 SKU 记账，选到商品还不够。
      单规格商品自动选中并折叠提示，不打扰操作员；多规格才需要人工勾选。
    -->
    <template v-if="selectedId">
      <el-divider content-position="left">规格（SKU）</el-divider>
      <div v-loading="skuLoading">
        <el-alert
          v-if="!skuLoading && skuList.length === 1"
          type="success"
          :closable="false"
          show-icon
          :title="`单规格商品，已自动选中：${skuList[0].sku || '默认规格'}`"
        />
        <template v-else-if="!skuLoading && skuList.length > 1">
          <p class="sku-tips">可勾选多个规格，确定后会为每个规格各生成一行明细。</p>
          <el-table
            ref="skuTable"
            :data="skuList"
            border
            size="mini"
            max-height="240"
            @selection-change="onSkuSelectionChange"
          >
            <el-table-column type="selection" width="45" />
            <el-table-column prop="sku" label="规格" min-width="160" show-overflow-tooltip>
              <template slot-scope="{row}">{{ row.sku || '默认' }}</template>
            </el-table-column>
            <el-table-column prop="barCode" label="条码" width="140" show-overflow-tooltip />
            <el-table-column prop="cost" label="成本价" width="90" />
            <el-table-column prop="price" label="售价" width="90" />
            <el-table-column label="现有库存" width="90">
              <template slot-scope="{row}">
                <span :class="{ 'text-danger': !row.stock }">{{ row.stock == null ? '-' : row.stock }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <el-alert
          v-else-if="!skuLoading"
          type="warning"
          :closable="false"
          show-icon
          title="该商品没有可用规格，无法入库。请先在商品管理中维护规格。"
        />
      </div>
    </template>

    <div slot="footer">
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button type="primary" size="small" :disabled="!canConfirm" @click="confirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { productLstApi, productDetailApi } from '@/api/product';
import { merchantListApi } from '@/api/merchant';

export default {
  name: 'ProductPickerDialog',
  data() {
    return {
      visible: false,
      keyword: '',
      merId: null,
      page: 1,
      limit: 10,
      total: 0,
      list: [],
      merchantList: [],
      loading: false,
      selectedId: null,
      selectedProduct: null,
      skuList: [],
      selectedSkus: [],
      skuLoading: false,
      resolver: null,
    };
  },
  computed: {
    // 没有规格的商品不允许入库：仓储按 SKU 记账，attrValueId 缺失会让库存挂在兜底行上
    canConfirm() {
      return !!this.selectedId && this.selectedSkus.length > 0;
    },
  },
  methods: {
    async open({ merId = null } = {}) {
      return new Promise((resolve) => {
        this.resolver = resolve;
        this.keyword = '';
        this.merId = merId;
        this.page = 1;
        this.selectedId = null;
        this.selectedProduct = null;
        this.skuList = [];
        this.selectedSkus = [];
        this.visible = true;
      });
    },
    async onOpen() {
      if (!this.merchantList.length) {
        try {
          const res = await merchantListApi({ page: 1, limit: 999 });
          this.merchantList = (res && res.list) || (res && res.records) || [];
        } catch (e) { /* ignore */ }
      }
      this.load();
    },
    onSearch() { this.page = 1; this.load(); },
    async load() {
      this.loading = true;
      try {
        const params = { page: this.page, limit: this.limit, type: 1, keywords: this.keyword };
        if (this.merId) params.merId = this.merId;
        const res = await productLstApi(params);
        const rawList = (res && res.list) || (res && res.records) || [];
        // 构建商户ID->名称映射，补全merName
        const merMap = {};
        this.merchantList.forEach(m => { merMap[m.id] = m.name; });
        rawList.forEach(item => {
          if (!item.merchantName && !item.merName && item.merId) {
            item.merName = merMap[item.merId] || '';
          }
        });
        this.list = rawList;
        this.total = (res && res.total) || 0;
      } finally { this.loading = false; }
    },
    getMerName(row) {
      // 平台商品列表接口返回的是 merchantName，部分接口才有 merName / merId
      if (row.merchantName) return row.merchantName;
      if (row.merName) return row.merName;
      if (row.merId) {
        const m = this.merchantList.find(x => x.id === row.merId);
        return m ? m.name : '';
      }
      return row.isSelf ? '平台自营' : '';
    },
    pick(row) {
      if (this.selectedId === row.id) return;
      this.selectedId = row.id;
      this.selectedProduct = row;
      this.loadSkus(row.id);
    },
    async loadSkus(productId) {
      this.skuList = [];
      this.selectedSkus = [];
      this.skuLoading = true;
      try {
        const res = await productDetailApi(productId);
        this.skuList = (res && res.attrValueList) || [];
        // 单规格没有选择余地，直接选中；多规格等用户勾选
        if (this.skuList.length === 1) {
          this.selectedSkus = [this.skuList[0]];
        }
      } catch (e) {
        this.$message.error('加载商品规格失败');
      } finally {
        this.skuLoading = false;
      }
    },
    onSkuSelectionChange(rows) {
      this.selectedSkus = rows || [];
    },
    confirm() {
      const p = this.selectedProduct || this.list.find((x) => x.id === this.selectedId);
      if (this.resolver) this.resolver({ product: p, skus: this.selectedSkus });
      this.resolver = null;
      this.visible = false;
    },
  },
  beforeDestroy() {
    if (this.resolver) { this.resolver(null); this.resolver = null; }
  },
};
</script>

<style scoped>
.text-danger { color: #f56c6c; }
.sku-tips { margin: 0 0 8px; font-size: 12px; color: #909399; }
</style>
