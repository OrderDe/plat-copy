<template>
  <el-dialog title="商品列表" :visible.sync="visible" width="900px" append-to-body @open="onOpen">
    <el-form :inline="true" size="small">
      <el-form-item label="商户">
        <el-select v-model="merId" filterable clearable placeholder="请选择" style="width:200px">
          <el-option v-for="m in merchantList" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品搜索">
        <el-input v-model="keyword" placeholder="请输入商品名称" clearable style="width:220px" @keyup.enter.native="onSearch" />
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
      <el-table-column prop="price" label="价格" width="80" />
      <el-table-column label="审核" width="90">
        <template slot-scope="{row}">
          <el-tag size="mini" :type="row.auditStatus === 2 ? 'success' : 'info'">
            {{ auditMap[row.auditStatus] || '已审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="现有库存" width="90">
        <template slot-scope="{row}">
          <!-- 只有「必须有货才能操作」的场景才标红：入库方向库存为 0 是常态，
               标红会让操作员以为该商品不能选 -->
          <span :class="{ 'text-danger': requireStock && !row.stock }">{{ row.stock == null ? '-' : row.stock }}</span>
        </template>
      </el-table-column>
    </el-table>
    <p class="list-tips">
      仅展示<b>已纳入仓储管理</b>且<b>已审核</b>的商品（无需审核 / 审核成功）；未纳管、待审核、审核拒绝的不可选。
      商品未纳管时，请先在「商品列表」里对它执行「纳入仓储管理」。
      未上架的已审核商品（如<b>待入仓</b>）同样可选，入库后会自动上架。
      <span v-if="warehouseId" class="text-danger">本单从当前仓取货，只列该仓有可用库存的商品。</span>
      <span v-else-if="requireStock" class="text-danger">本单需要从仓内取货，现有库存为 0 的商品无法完成作业。</span>
      <span v-else>本单是入库方向，<b>现有库存为 0 的商品可以正常选择</b>——入库正是给它加库存。</span>
    </p>
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
      <div ref="skuSection" v-loading="skuLoading">
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
            <!-- 不提供表头“全选”，避免误点后把所有规格一次性带回明细；仍可逐项勾选多个规格 -->
            <el-table-column type="selection" width="55" :render-header="renderSkuSelectionHeader" />
            <el-table-column prop="sku" label="规格" min-width="160" show-overflow-tooltip>
              <template slot-scope="{row}">{{ row.sku || '默认' }}</template>
            </el-table-column>
            <el-table-column prop="barCode" label="条码" width="140" show-overflow-tooltip />
            <el-table-column prop="cost" label="成本价" width="90" />
            <el-table-column prop="price" label="售价" width="90" />
            <el-table-column label="现有库存" width="90">
              <template slot-scope="{row}">
                <span :class="{ 'text-danger': requireStock && !row.stock }">{{ row.stock == null ? '-' : row.stock }}</span>
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
      <!-- 不置灰：规格区在弹窗下方，容易被滚动挡住，点了没反应会让人以为「确定」坏了。
           这里改成点击后给出明确提示并把规格区滚进视野。 -->
      <el-button type="primary" size="small" @click="confirm">确定</el-button>
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
      skuRequestId: 0,
      resolver: null,
      // 后端只会返回 0/2 两种（见 wmsSelectable 口径），1/3 列出来只是为了兜底不显示空白
      auditMap: { 0: '无需审核', 1: '待审核', 2: '审核成功', 3: '审核拒绝' },
      // 由调用方声明：true = 出库/移库/质检等需要仓内有货的单据，0 库存标红提醒；
      // false = 入库、采购发货、批次、盘点，0 库存是常态，不做视觉警告
      requireStock: false,
      // 由调用方传入：库内作业/出库/质检等「搬仓内已有的货」的单据传本仓ID，
      // 只列该仓有可用库存的商品；入库方向不传
      warehouseId: null,
    };
  },
  methods: {
    renderSkuSelectionHeader(h) {
      return h('span', '选择');
    },
    async open({ merId = null, requireStock = false, warehouseId = null } = {}) {
      return new Promise((resolve) => {
        this.resolver = resolve;
        this.keyword = '';
        this.merId = merId;
        this.requireStock = requireStock;
        this.warehouseId = warehouseId;
        this.page = 1;
        this.selectedId = null;
        this.selectedProduct = null;
        this.skuList = [];
        this.selectedSkus = [];
        this.skuRequestId += 1;
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
        // wmsSelectable：仓储选品口径 —— 只要「已审核」(无需审核/审核成功)，不看上架状态。
        // type 仍需传（后端 @NotNull 校验），但有 wmsSelectable 时后端会跳过 type 的上架条件。
        const params = { page: this.page, limit: this.limit, type: 1, wmsSelectable: true, keywords: this.keyword };
        if (this.merId) params.merId = this.merId;
        if (this.warehouseId) params.warehouseId = this.warehouseId;
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
      // 规格区在商品列表下方，不主动滚过去操作员看不到，会以为选完商品就能确定
      this.scrollToSku();
    },
    async loadSkus(productId) {
      const requestId = ++this.skuRequestId;
      this.skuList = [];
      this.selectedSkus = [];
      this.skuLoading = true;
      try {
        const res = await productDetailApi(productId);
        // 快速切换商品时，旧请求不能覆盖当前商品的规格。
        if (requestId !== this.skuRequestId || this.selectedId !== productId) return;
        this.skuList = this.uniqueSkus((res && res.attrValueList) || []);
        // 单规格没有选择余地，直接选中；多规格等用户勾选
        if (this.skuList.length === 1) {
          this.selectedSkus = [this.skuList[0]];
        }
      } catch (e) {
        if (requestId === this.skuRequestId) this.$message.error('加载商品规格失败');
      } finally {
        if (requestId === this.skuRequestId) this.skuLoading = false;
      }
    },
    onSkuSelectionChange(rows) {
      this.selectedSkus = this.uniqueSkus(rows);
    },
    uniqueSkus(skus) {
      const seen = new Set();
      return (skus || []).filter((sku) => {
        if (!sku) return false;
        const key = sku.id != null
          ? `id:${sku.id}`
          : `sku:${sku.sku || ''}|barCode:${sku.barCode || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    scrollToSku() {
      this.$nextTick(() => {
        const el = this.$refs.skuSection;
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    confirm() {
      if (!this.selectedId) return this.$message.warning('请先选择商品');
      if (this.skuLoading) return this.$message.warning('规格加载中，请稍候');
      if (!this.skuList.length) {
        this.scrollToSku();
        return this.$message.warning('该商品没有可用规格，请先在商品管理中维护规格');
      }
      if (!this.selectedSkus.length) {
        this.scrollToSku();
        return this.$message.warning('请在下方「规格（SKU）」中勾选至少一个规格');
      }
      const p = this.selectedProduct || this.list.find((x) => x.id === this.selectedId);
      if (this.resolver) this.resolver({ product: p, skus: this.uniqueSkus(this.selectedSkus) });
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
.list-tips { margin: 8px 0 0; font-size: 12px; color: #909399; line-height: 1.6; }
</style>
