<template>
  <div class="app-container">
    <el-tabs v-model="tab">
      <!-- ============ 补货建议 ============ -->
      <el-tab-pane label="补货建议" name="suggestion">
        <el-form :inline="true" size="small" class="filter-container">
          <el-form-item label="仓库">
            <el-select v-model="sq.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="loadSuggestion">
              <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="sq.status" clearable placeholder="全部" style="width:130px" @change="loadSuggestion">
              <el-option label="待处理" :value="0" />
              <el-option label="已建单" :value="1" />
              <el-option label="已忽略" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadSuggestion">查询</el-button>
            <el-button type="success" icon="el-icon-refresh" :loading="scanning" @click="onScan">立即扫描</el-button>
          </el-form-item>
        </el-form>

        <div style="margin-bottom:10px">
          <el-button type="primary" size="small" :disabled="!selected.length" @click="onConvert">
            转补货单 ({{ selected.length }})
          </el-button>
          <el-button size="small" :disabled="!selected.length" @click="onIgnore">忽略</el-button>
          <span style="margin-left:12px;color:#909399;font-size:12px">
            系统每 30 分钟自动扫描一次；也可点"立即扫描"手动触发
          </span>
        </div>

        <el-table v-loading="sLoading" :data="suggestions" border stripe @selection-change="s => selected = s">
          <el-table-column type="selection" width="45" :selectable="r => r.status === 0 && r.fromLocationId" />
          <el-table-column prop="ruleName" label="规则" width="140" show-overflow-tooltip />
          <el-table-column prop="productId" label="商品ID" width="90" />
          <el-table-column label="补入库位" width="150">
            <template slot-scope="{row}"><b class="to">{{ row.toLocationCode || '-' }}</b></template>
          </el-table-column>
          <el-table-column label="当前/阈值" width="110">
            <template slot-scope="{row}">
              <span class="danger">{{ row.currentQty }}</span> / {{ row.minQty }}
            </template>
          </el-table-column>
          <el-table-column label="建议补货" width="100">
            <template slot-scope="{row}"><b class="qty">{{ row.suggestQty }}</b></template>
          </el-table-column>
          <el-table-column label="取货来源" min-width="200">
            <template slot-scope="{row}">
              <template v-if="row.fromLocationCode">
                <b class="from">{{ row.fromLocationCode }}</b>
                <el-tag v-if="row.fromBatchNo" size="mini" style="margin-left:6px">{{ row.fromBatchNo }}</el-tag>
              </template>
              <el-tag v-else type="danger" size="mini">无货可补</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template slot-scope="{row}">
              <el-tag :type="({0:'warning',1:'success',2:'info'})[row.status]" size="mini">
                {{ ({0:'待处理', 1:'已建单', 2:'已忽略'})[row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="relocateCode" label="补货单号" width="160" />
          <el-table-column label="生成时间" width="160">
              <template slot-scope="{row}">{{ row.createTime ? row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
            </el-table-column>
        </el-table>

        <el-pagination
          style="margin-top:16px;text-align:right"
          :current-page.sync="sq.page" :page-size.sync="sq.limit" :total="sTotal"
          layout="total, prev, pager, next" @current-change="loadSuggestion"
        />
      </el-tab-pane>

      <!-- ============ 补货规则 ============ -->
      <el-tab-pane label="补货规则" name="rule">
        <el-form :inline="true" size="small" class="filter-container">
          <el-form-item label="仓库">
            <el-select v-model="rq.warehouseId" filterable clearable placeholder="全部" style="width:200px" @change="loadRule">
              <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
            </el-select>
          </el-form-item>
          <el-form-item><el-button type="primary" @click="loadRule">查询</el-button></el-form-item>
          <el-form-item><el-button type="primary" icon="el-icon-plus" @click="openRule()">新增规则</el-button></el-form-item>
        </el-form>

        <el-table v-loading="rLoading" :data="rules" border stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="规则名称" min-width="150" />
          <el-table-column label="仓库" width="180"><template slot-scope="{row}">{{ warehouseText(row.warehouseId) }}</template></el-table-column>
          <el-table-column label="拣货区货架" width="130"><template slot-scope="{row}">{{ shelfText(row.pickShelfId) }}</template></el-table-column>
          <el-table-column label="存储区货架" width="130">
            <template slot-scope="{row}">{{ row.storageShelfId ? shelfText(row.storageShelfId) : '全仓' }}</template>
          </el-table-column>
          <el-table-column prop="productId" label="限定商品" width="100">
            <template slot-scope="{row}">{{ row.productId || '全部' }}</template>
          </el-table-column>
          <el-table-column label="阈值 → 目标" width="130">
            <template slot-scope="{row}"><span class="danger">{{ row.minQty }}</span> → <b class="qty">{{ row.maxQty }}</b></template>
          </el-table-column>
          <el-table-column label="策略" width="80"><template slot-scope="{row}">{{ row.strategy === 1 ? 'FEFO' : 'FIFO' }}</template></el-table-column>
          <el-table-column label="自动建单" width="90">
            <template slot-scope="{row}"><el-tag :type="row.autoCreate===1?'success':'info'" size="mini">{{ row.autoCreate===1?'是':'否' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template slot-scope="{row}"><el-tag :type="row.status===1?'success':'info'" size="mini">{{ row.status===1?'启用':'停用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template slot-scope="{row}">
              <el-button type="text" @click="openRule(row)">编辑</el-button>
              <el-button type="text" class="danger-text" @click="onDeleteRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          style="margin-top:16px;text-align:right"
          :current-page.sync="rq.page" :page-size.sync="rq.limit" :total="rTotal"
          layout="total, prev, pager, next" @current-change="loadRule"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 规则编辑 -->
    <el-dialog :title="ruleForm.id?'编辑补货规则':'新增补货规则'" :visible.sync="ruleVisible" width="620px">
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="ruleRules" label-width="120px" size="small">
        <el-form-item label="规则名称" prop="name"><el-input v-model="ruleForm.name" /></el-form-item>
        <el-form-item label="仓库" prop="warehouseId">
          <el-select v-model="ruleForm.warehouseId" filterable style="width:100%" @change="loadShelvesFor">
            <el-option v-for="w in warehouseList" :key="w.id" :label="`${w.code} / ${w.name}`" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="拣货区货架" prop="pickShelfId">
          <el-select v-model="ruleForm.pickShelfId" filterable style="width:100%" placeholder="被补货的目标货架">
            <el-option v-for="s in shelfList" :key="s.id" :label="`${s.code} (${s.name})`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储区货架">
          <el-select v-model="ruleForm.storageShelfId" filterable clearable style="width:100%" placeholder="留空 = 全仓其他库位">
            <el-option v-for="s in shelfList" :key="s.id" :label="`${s.code} (${s.name})`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="限定商品ID">
          <el-input v-model.number="ruleForm.productId" type="number" placeholder="留空 = 该货架所有商品" />
        </el-form-item>
        <el-row :gutter="8">
          <el-col :span="12">
            <el-form-item label="触发阈值" prop="minQty">
              <el-input-number v-model="ruleForm.minQty" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="补货目标量" prop="maxQty">
              <el-input-number v-model="ruleForm.maxQty" :min="1" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="hint">当拣货区可用库存 ≤ {{ ruleForm.minQty }} 时，从存储区补到 {{ ruleForm.maxQty }}</div>
        <el-form-item label="取货策略">
          <el-radio-group v-model="ruleForm.strategy">
            <el-radio :label="0">FIFO (先入先出)</el-radio>
            <el-radio :label="1">FEFO (先到期先出)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="自动建单">
          <el-switch v-model="ruleForm.autoCreate" :active-value="1" :inactive-value="0" />
          <span style="margin-left:8px;color:#909399;font-size:12px">开启后扫描时直接生成补货单，无需人工确认</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="ruleForm.status">
            <el-radio :label="1">启用</el-radio><el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="ruleForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="ruleVisible=false">取消</el-button>
        <el-button type="primary" size="small" @click="onSubmitRule">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { replenishApi, warehouseApi, shelfApi } from '@/api/warehouse';

export default {
  name: 'WarehouseReplenish',
  data() {
    return {
      tab: 'suggestion',
      warehouseList: [], shelfList: [], shelfAll: [],
      // 建议
      sLoading: false, scanning: false, suggestions: [], sTotal: 0, selected: [],
      sq: { page: 1, limit: 20, warehouseId: null, status: 0 },
      // 规则
      rLoading: false, rules: [], rTotal: 0,
      rq: { page: 1, limit: 20, warehouseId: null },
      ruleVisible: false, ruleForm: this.emptyRule(),
      ruleRules: {
        name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
        pickShelfId: [{ required: true, message: '请选择拣货区货架', trigger: 'change' }],
        maxQty: [{ required: true, message: '请输入补货目标量', trigger: 'blur' }],
      },
    };
  },
  created() { this.loadWarehouses(); this.loadAllShelves(); this.loadSuggestion(); this.loadRule(); },
  methods: {
    emptyRule() {
      return { id: null, name: '', warehouseId: null, pickShelfId: null, storageShelfId: null, productId: null,
        minQty: 10, maxQty: 100, strategy: 0, autoCreate: 0, status: 1, remark: '' };
    },
    warehouseText(id) { const w = this.warehouseList.find(x => x.id === id); return w ? `${w.code} / ${w.name}` : id || '-'; },
    shelfText(id) { const s = this.shelfAll.find(x => x.id === id); return s ? s.code : id || '-'; },
    async loadWarehouses() { try { const r = await warehouseApi.page({ page: 1, limit: 999 }); this.warehouseList = (r && r.list) || []; } catch (e) {} },
    async loadAllShelves() { try { const r = await shelfApi.page({ page: 1, limit: 999 }); this.shelfAll = (r && r.list) || []; } catch (e) {} },
    async loadShelvesFor() {
      this.shelfList = [];
      if (!this.ruleForm.warehouseId) return;
      try { const r = await shelfApi.page({ page: 1, limit: 999, warehouseId: this.ruleForm.warehouseId, status: 1 }); this.shelfList = (r && r.list) || []; } catch (e) {}
    },
    /* 建议 */
    async loadSuggestion() {
      this.sLoading = true;
      try { const r = await replenishApi.suggestionPage(this.sq); this.suggestions = (r && r.list) || []; this.sTotal = (r && r.total) || 0; }
      finally { this.sLoading = false; }
    },
    async onScan() {
      this.scanning = true;
      try {
        const n = await replenishApi.scan({ warehouseId: this.sq.warehouseId });
        this.$message.success(n > 0 ? `已生成 ${n} 条补货建议` : '当前无需要补货的库位');
        this.loadSuggestion();
      } finally { this.scanning = false; }
    },
    async onConvert() {
      await this.$confirm(`将选中的 ${this.selected.length} 条建议合并生成一张补货单（草稿），继续?`, '确认', { type: 'warning' });
      const id = await replenishApi.convert(this.selected.map(x => x.id));
      this.$message.success(`已生成补货单 ID=${id}，请到"上架/移库/补货"页提交生效`);
      this.selected = [];
      this.loadSuggestion();
    },
    async onIgnore() {
      await this.$confirm(`忽略选中的?${this.selected.length} 条建议`, '提示', { type: 'warning' });
      await replenishApi.ignore(this.selected.map(x => x.id));
      this.$message.success('已忽略');
      this.selected = [];
      this.loadSuggestion();
    },
    /* 规则 */
    async loadRule() {
      this.rLoading = true;
      try { const r = await replenishApi.rulePage(this.rq); this.rules = (r && r.list) || []; this.rTotal = (r && r.total) || 0; }
      finally { this.rLoading = false; }
    },
    async openRule(row) {
      this.ruleForm = row ? { ...row } : this.emptyRule();
      await this.loadShelvesFor();
      this.ruleVisible = true;
    },
    async onSubmitRule() {
      await this.$refs.ruleFormRef.validate();
      if (this.ruleForm.maxQty <= this.ruleForm.minQty) return this.$message.warning('补货目标量必须大于触发阈值');
      await replenishApi.ruleSave(this.ruleForm);
      this.$message.success('已保存');
      this.ruleVisible = false;
      this.loadRule();
    },
    onDeleteRule(row) {
      this.$confirm(`删除规则「{row.name}」`, '提示', { type: 'warning' })
        .then(async () => { await replenishApi.ruleDel(row.id); this.$message.success('已删除'); this.loadRule(); }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.filter-container { margin-bottom: 12px; }
.danger-text { color: #f56c6c; }
.danger { color: #f56c6c; font-weight: bold; }
.qty { color: #67c23a; }
.to { color: #409eff; }
.from { color: #e6a23c; }
.hint { color: #909399; font-size: 12px; padding-left: 120px; margin-bottom: 12px; }
</style>
