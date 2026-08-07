<template>
  <div class="app-container">
    <el-card shadow="never">
      <div slot="header"><b>智能分仓试算</b> <span style="color:#909399;font-size:12px;margin-left:8px">根据收货地址、库存分布、仓库层级自动决定从哪些仓发货</span></div>
      <el-form :model="form" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="6"><el-form-item label="业务单号"><el-input v-model="form.bizCode" placeholder="订单号（选填）" /></el-form-item></el-col>
          <el-col :span="10">
            <el-form-item label="收货地区">
              <el-cascader v-model="regionSel" :options="cityOptions" :props="cascaderProps"
                           placeholder="请选择省/市" clearable style="width:100%" @change="onRegionChange" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分仓策略">
              <el-select v-model="form.strategy" style="width:100%">
                <el-option label="优先整单一仓发（推荐）" :value="0" />
                <el-option label="优先就近发货" :value="1" />
                <el-option label="优先库存充足仓" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="允许拆单">
          <el-switch v-model="form.allowSplit" />
          <span style="margin-left:8px;color:#909399;font-size:12px">关闭后若无单仓可整单满足则直接返回失败</span>
        </el-form-item>

        <el-divider content-position="left">商品明细</el-divider>
        <el-button size="mini" icon="el-icon-plus" @click="addLine">添加行</el-button>
        <el-table :data="form.lines" border size="mini" style="margin-top:8px">
          <el-table-column type="index" width="45" />
          <el-table-column label="商品" min-width="220">
            <template slot-scope="{row}">
              <el-input v-model="row.goodsName" size="mini" readonly placeholder="点击选择商品">
                <el-button slot="append" size="mini" icon="el-icon-search" @click="pickProduct(row)" />
              </el-input>
            </template>
          </el-table-column>
          <el-table-column label="规格" min-width="140">
            <template slot-scope="{row}">
              <el-tag v-if="row.sku" size="mini" type="info">{{ row.sku }}</el-tag>
              <span v-else-if="row.productId" class="sku-missing">未选规格</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="商品ID" width="110">
            <template slot-scope="{row}"><el-input v-model="row.productId" size="mini" readonly /></template>
          </el-table-column>
          <el-table-column label="数量" width="130">
            <template slot-scope="{row}"><el-input-number v-model="row.num" :min="1" size="mini" controls-position="right" style="width:110px" /></template>
          </el-table-column>
          <el-table-column label="操作" width="70">
            <template slot-scope="{$index}"><el-button type="text" class="danger-text" @click="form.lines.splice($index,1)">删除</el-button></template>
          </el-table-column>
        </el-table>

        <div style="margin-top:16px">
          <el-button type="primary" :loading="calcing" @click="onPreview">开始试算</el-button>
          <el-button type="success" :disabled="!result || !result.parcels || !result.parcels.length" :loading="creating" @click="onCreate">
            生成出库单
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 结果 -->
    <el-card v-if="result" shadow="never" style="margin-top:16px">
      <div slot="header">
        <b>分仓结果</b>
        <el-tag :type="result.fullyAllocated ? 'success' : 'danger'" size="mini" style="margin-left:8px">
          {{ result.fullyAllocated ? '可完全满足' : '存在缺货' }}
        </el-tag>
        <span style="margin-left:12px;color:#909399;font-size:12px">{{ result.decisionLog }}</span>
      </div>

      <div v-if="!result.parcels.length" style="color:#909399;text-align:center;padding:20px">无可分配仓库</div>

      <el-card v-for="(p, i) in result.parcels" :key="p.warehouseId" shadow="never" class="parcel">
        <div slot="header">
          <el-tag type="primary" size="mini">包裹 {{ i + 1 }}</el-tag>
          <b style="margin-left:8px">{{ p.warehouseCode }} / {{ p.warehouseName }}</b>
          <el-tag size="mini" style="margin-left:8px">{{ levelMap[p.level] || '区域仓' }}</el-tag>
          <el-tag v-if="p.coverMatched" type="success" size="mini" style="margin-left:6px">地址覆盖</el-tag>
          <el-tag v-else type="info" size="mini" style="margin-left:6px">跨区发货</el-tag>
          <span style="margin-left:8px;color:#909399;font-size:12px">优先级 {{ p.priority || 0 }}</span>
        </div>
        <el-table :data="p.lines" border size="mini">
          <el-table-column prop="productId" label="商品ID" width="110" />
          <el-table-column prop="goodsName" label="商品名称" min-width="200" />
          <el-table-column prop="sku" label="规格" min-width="130" show-overflow-tooltip />
          <el-table-column label="发货数量" width="110">
            <template slot-scope="{row}"><b class="qty">{{ row.num }}</b></template>
          </el-table-column>
          <el-table-column label="该仓可用" width="110">
            <template slot-scope="{row}">{{ row.availableInWarehouse }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <template v-if="result.shortages && result.shortages.length">
        <el-divider content-position="left"><span style="color:#f56c6c">缺货明细</span></el-divider>
        <el-table :data="result.shortages" border size="mini">
          <el-table-column prop="productId" label="商品ID" width="110" />
          <el-table-column prop="goodsName" label="商品名称" min-width="200" />
          <el-table-column prop="sku" label="规格" min-width="130" show-overflow-tooltip />
          <el-table-column prop="needNum" label="需求" width="90" />
          <el-table-column prop="totalAvailable" label="全网可用" width="100" />
          <el-table-column label="缺口" width="90">
            <template slot-scope="{row}"><b class="danger">{{ row.lackNum }}</b></template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>

    <product-picker-dialog ref="productPicker" />
  </div>
</template>

<script>
import { allocateApi } from '@/api/warehouse';
import request from '@/utils/request';
import ProductPickerDialog from '../components/ProductPickerDialog.vue';

const cityListTree = () => request({ url: '/admin/merchant/city/region/city/tree', method: 'get' });

export default {
  name: 'WarehouseAllocate',
  components: { ProductPickerDialog },
  data() {
    return {
      calcing: false, creating: false,
      form: { bizCode: '', provinceCode: '', cityCode: '', province: '', city: '', strategy: 0, allowSplit: true, lines: [] },
      regionSel: [],
      cityOptions: [],
      cascaderProps: { value: 'id', label: 'name', children: 'child', checkStrictly: true, emitPath: true },
      result: null,
      levelMap: { 0: '总仓', 1: '区域仓', 2: '前置仓' },
    };
  },
  created() { this.loadCityTree(); this.addLine(); },
  methods: {
    async loadCityTree() {
      try {
        const res = await cityListTree();
        const list = Array.isArray(res) ? res : (res && res.list) || [];
        this.cityOptions = this.normalizeTree(list, 2);
      } catch (e) { /* ignore */ }
    },
    normalizeTree(list, maxDepth, depth = 1) {
      if (!Array.isArray(list)) return [];
      return list.map(n => {
        const item = { id: n.regionId != null ? n.regionId : n.id, name: n.regionName || n.name };
        const children = n.child || n.children;
        if (depth < maxDepth && Array.isArray(children) && children.length) {
          item.child = this.normalizeTree(children, maxDepth, depth + 1);
        }
        return item;
      });
    },
    onRegionChange() {
      const cascader = this.$children.find(c => c.$options && c.$options.name === 'ElCascader');
      // 直接从 regionSel 取 id，label 通过遍历 options 找
      const [pid, cid] = this.regionSel || [];
      this.form.provinceCode = pid != null ? String(pid) : '';
      this.form.cityCode = cid != null ? String(cid) : '';
      const prov = this.cityOptions.find(x => x.id === pid);
      this.form.province = prov ? prov.name : '';
      const city = prov && prov.child ? prov.child.find(x => x.id === cid) : null;
      this.form.city = city ? city.name : '';
    },
    addLine() { this.form.lines.push({ productId: null, attrValueId: null, sku: '', platformType: 0, goodsName: '', num: 1 }); },
    /**
     * 分仓按 SKU 算可用量，多选规格时展开成多行——
     * 试算一单里同一商品的几个规格是常见场景。
     */
    async pickProduct(row) {
      const res = await this.$refs.productPicker.open();
      if (!res || !res.product) return;
      const list = res.skus && res.skus.length ? res.skus : [null];
      this.applyLineSku(row, res.product, list[0]);
      if (list.length > 1) {
        const idx = this.form.lines.indexOf(row);
        const extras = list.slice(1).map((sku) => {
          const clone = { ...row };
          this.applyLineSku(clone, res.product, sku);
          return clone;
        });
        this.form.lines.splice(idx < 0 ? this.form.lines.length : idx + 1, 0, ...extras);
      }
    },
    applyLineSku(row, product, sku) {
      this.$set(row, 'productId', product.id);
      this.$set(row, 'goodsName', product.name);
      this.$set(row, 'attrValueId', sku ? sku.id : null);
      this.$set(row, 'sku', sku ? sku.sku : '');
    },
    validate() {
      const lines = this.form.lines.filter(l => l.productId && l.num > 0);
      if (!lines.length) { this.$message.warning('请至少添加一行有效商品'); return null; }
      // 分仓按 SKU 查可用库存，没有 attrValueId 会全部算成 0
      if (lines.some(l => !l.attrValueId)) { this.$message.warning('请为每行指定规格'); return null; }
      return { ...this.form, lines };
    },
    async onPreview() {
      const payload = this.validate();
      if (!payload) return;
      this.calcing = true;
      try { this.result = await allocateApi.preview(payload); }
      finally { this.calcing = false; }
    },
    async onCreate() {
      const payload = this.validate();
      if (!payload) return;
      if (!this.result.fullyAllocated) {
        await this.$confirm('存在缺货，将只按可满足部分生成出库单，继续?', '提示', { type: 'warning' });
      }
      this.creating = true;
      try {
        const ids = await allocateApi.createOutbounds(payload);
        this.$message.success(`已生成出库单 ID: ${ids}，请到"出库管理"处理`);
      } finally { this.creating = false; }
    },
  },
};
</script>

<style scoped>
.danger-text { color: #f56c6c; }
.sku-missing { color: #f56c6c; font-size: 12px; }
.danger { color: #f56c6c; }
.qty { color: #67c23a; }
.parcel { margin-bottom: 12px; border: 1px solid #ebeef5; }
</style>
