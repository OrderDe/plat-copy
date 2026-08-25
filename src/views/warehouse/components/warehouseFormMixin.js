import { warehouseApi } from '@/api/warehouse';
import { merchantListApi } from '@/api/merchant';
import AdminPickerDialog from './AdminPickerDialog.vue';
import ProductPickerDialog from './ProductPickerDialog.vue';

/**
 * 仓储单据表单公用逻辑：仓库/店铺下拉；申请人与商品选择走弹窗选择器。
 */
export default {
  components: { AdminPickerDialog, ProductPickerDialog },
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
    /*
     * 比较前统一转字符串。
     *
     * 后端的 Long 主键序列化成 JSON 是字符串（"4"），而页面里从
     * warehouse_ids 这类逗号串解析出来的是数字（map(Number)），
     * 严格相等永远匹配不上 —— 表现就是本该显示「测试仓库」的地方
     * 直接掉成了仓库ID「4」。商户名同理。
     */
    warehouseText(id) {
      const w = this.warehouseList.find((x) => String(x.id) === String(id));
      return w ? `${w.code} / ${w.name}` : id || '-';
    },
    merchantName(id) {
      const m = this.merchantList.find((x) => String(x.id) === String(id));
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
    /** 申请人是仓库内部作业人员，选后台管理员而不是商城会员 */
    async pickApplyUser() {
      const u = await this.$refs.adminPicker.open();
      if (!u) return;
      this.$set(this.form, 'applyUserId', u.id);
      this.$set(this.form, 'applyUserName', u.realName || u.account || '');
      this.$set(this.form, 'applyUserPhone', u.phone || '');
      // 输入框绑的是 applyUserName，改 applyUserId 不会触发它的校验，手动清一次报错
      this.$nextTick(() => {
        if (this.$refs.formRef && this.$refs.formRef.clearValidate) {
          this.$refs.formRef.clearValidate('applyUserId');
        }
      });
    },
    /**
     * 选商品 → 选规格。仓储按 SKU 记账，一行明细对应一个 attrValueId。
     * 勾选了多个规格时，第一个填回当前行，其余在它下面各插一行，
     * 免得操作员为同一商品的 5 个规格手点 5 次「添加行 + 选商品」。
     */
    async pickProduct(row) {
      // productPickerRequireStock 由使用本 mixin 的页面自行声明：
      // 出库方向(出库单、报损、领用、调拨、退库)要从仓里取货，现有库存 0 会做不下去；
      // 入库方向(入库单、采购发货单)和盘点则相反，0 库存是常态，不该标红吓人。
      // 从仓里取货的单据还要按本仓过滤：别的仓的货搬不动，列出来只会选错
      const fromWarehouseId = this.form.warehouseId || this.form.fromWarehouseId || null;
      if (this.productPickerRequireStock === true && !fromWarehouseId) {
        this.$message.warning('请先选择仓库，再选择商品');
        return;
      }
      const res = await this.$refs.productPicker.open({
        merId: row.merId,
        requireStock: this.productPickerRequireStock === true,
        warehouseId: this.productPickerRequireStock === true ? fromWarehouseId : null,
      });
      if (!res || !res.product) return;
      const { product, skus } = res;
      // 弹窗已去重，这里再按规格主键防御一次，避免重复 SKU 生成重复明细。
      const seenSkuIds = new Set();
      const uniqueSkus = (skus || []).filter((sku) => {
        if (!sku) return false;
        const key = sku.id != null
          ? `id:${sku.id}`
          : `sku:${sku.sku || ''}|barCode:${sku.barCode || ''}`;
        if (seenSkuIds.has(key)) return false;
        seenSkuIds.add(key);
        return true;
      });
      const list = uniqueSkus.length ? uniqueSkus : [null];

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
