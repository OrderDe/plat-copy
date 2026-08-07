import { warehouseApi } from '@/api/warehouse';
import { merchantListApi } from '@/api/merchant';
import UserPickerDialog from './UserPickerDialog.vue';
import ProductPickerDialog from './ProductPickerDialog.vue';

/**
 * 仓储单据表单公用逻辑：仓库/店铺下拉；申请人与商品选择走弹窗选择器。
 */
export default {
  components: { UserPickerDialog, ProductPickerDialog },
  data() {
    return {
      warehouseList: [],
      merchantList: [],
    };
  },
  created() {
    this.loadWarehouses();
    this.loadMerchants();
  },
  methods: {
    warehouseText(id) {
      const w = this.warehouseList.find((x) => x.id === id);
      return w ? `${w.code} / ${w.name}` : id || '-';
    },
    merchantName(id) {
      const m = this.merchantList.find((x) => x.id === id);
      return m ? m.name : id || '';
    },
    async loadWarehouses() {
      try {
        const res = await warehouseApi.page({ page: 1, limit: 999 });
        this.warehouseList = (res && res.list) || [];
      } catch (e) { /* ignore */ }
    },
    async loadMerchants() {
      try {
        const res = await merchantListApi({ page: 1, limit: 999 });
        this.merchantList = (res && res.list) || (res && res.records) || [];
      } catch (e) { /* ignore */ }
    },
    async pickApplyUser() {
      const u = await this.$refs.userPicker.open();
      if (!u) return;
      this.$set(this.form, 'applyUserId', u.uid != null ? u.uid : u.id);
      this.$set(this.form, 'applyUserName', u.nickname || u.username || u.phone || '');
      this.$set(this.form, 'applyUserPhone', u.phone || '');
    },
    /**
     * 选商品 → 选规格。仓储按 SKU 记账，一行明细对应一个 attrValueId。
     * 勾选了多个规格时，第一个填回当前行，其余在它下面各插一行，
     * 免得操作员为同一商品的 5 个规格手点 5 次「添加行 + 选商品」。
     */
    async pickProduct(row) {
      const res = await this.$refs.productPicker.open({ merId: row.merId });
      if (!res || !res.product) return;
      const { product, skus } = res;
      const list = skus && skus.length ? skus : [null];

      this.applySku(row, product, list[0]);

      // 盘点单的明细数组叫 details，其余单据叫 items
      const items = this.form && (this.form.items || this.form.details);
      if (items && list.length > 1) {
        const idx = items.indexOf(row);
        const extras = list.slice(1).map((sku) => {
          // 以当前行为模板复制，保留已填的仓库/货架等上下文
          const clone = JSON.parse(JSON.stringify(row));
          this.applySku(clone, product, sku);
          return clone;
        });
        items.splice(idx < 0 ? items.length : idx + 1, 0, ...extras);
      }
    },
    /**
     * 把商品 + 规格写回明细行。
     * 用 $set 而不是直接赋值：各单据页面的 addItem 初始字段不一致，
     * 直接赋值给未声明过的属性在 Vue 2 里不会触发视图更新。
     */
    applySku(row, product, sku) {
      this.$set(row, 'productId', product.id);
      this.$set(row, 'goodsName', product.name);
      if (product.merId != null) this.$set(row, 'merId', product.merId);
      this.$set(row, 'platformType', 0);
      this.$set(row, 'attrValueId', sku ? sku.id : null);
      this.$set(row, 'sku', sku ? sku.sku : '');
      this.$set(row, 'barCode', sku ? sku.barCode : '');
      // 成本价留空时用 SKU 上维护的成本兜底，操作员仍可改
      if (sku && sku.cost != null && !row.unitCost) this.$set(row, 'unitCost', sku.cost);
    },
    onShopChange(row) {
      row.productId = null;
      row.goodsName = '';
      row.attrValueId = null;
      row.sku = '';
      row.barCode = '';
      row.platformType = 0;
    },
    stripItemMeta(items) {
      return (items || []).map(({ _options, _loading, ...rest }) => rest);
    },
  },
};
