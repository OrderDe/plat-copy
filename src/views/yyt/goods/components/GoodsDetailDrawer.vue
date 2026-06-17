<template>
  <el-drawer
    :title="'商品详情'"
    :visible.sync="visible"
    size="720px"
    direction="rtl"
    :before-close="handleClose"
  >
    <div v-loading="loading" class="drawer-body">
      <template v-if="spuInfo">
        <!-- 基本信息 -->
        <el-card shadow="never" class="mb15">
          <div slot="header"><span class="card-title">基本信息</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="SPU ID">{{ spuInfo.spuId }}</el-descriptions-item>
            <el-descriptions-item label="商品名称">{{ spuInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="商品状态">
              <el-tag :type="spuInfo.status == 0 ? 'success' : 'info'" size="mini">
                {{ spuInfo.status == 0 ? '上架' : '下架' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="一级分类">{{ spuInfo.categoryName1 }}</el-descriptions-item>
            <el-descriptions-item label="二级分类">{{ spuInfo.categoryName2 }}</el-descriptions-item>
            <el-descriptions-item label="三级分类">{{ spuInfo.categoryName3 }}</el-descriptions-item>
            <el-descriptions-item label="品牌">{{ spuInfo.brandName }}</el-descriptions-item>
            <el-descriptions-item label="商品库">{{ spuInfo.libName }}</el-descriptions-item>
            <el-descriptions-item label="是否限售区域">
              <span :style="{ color: spuInfo.isLimitArea === 'Y' ? '#E6A23C' : '#67C23A' }">
                {{ spuInfo.isLimitArea === 'Y' ? '是' : '否' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="包邮">
              <el-tag :type="spuInfo.freeExpress == 1 ? 'success' : 'info'" size="mini">
                {{ spuInfo.freeExpress == 1 ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- SKU规格列表 -->
        <el-card shadow="never">
          <div slot="header"><span class="card-title">SKU规格明细</span></div>
          <el-table :data="skuList" border size="mini">
            <el-table-column prop="skuId" label="SKU ID" width="120" />
            <el-table-column prop="skuPicUrl" label="SKU图片" width="80">
              <template slot-scope="{ row }">
                <el-image v-if="row.skuPicUrl" :src="row.skuPicUrl" style="width:50px;height:50px" fit="cover" :preview-src-list="[row.skuPicUrl]" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template slot-scope="{ row }">
                <el-tag :type="row.status == 0 ? 'success' : 'info'" size="mini">
                  {{ row.status == 0 ? '上架' : '下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="80" align="center" />
            <el-table-column prop="buyStartQty" label="起购数量" width="80" align="center" />
            <el-table-column prop="basePrice" label="采购价" width="90" align="right">
              <template slot-scope="{ row }">
                <span class="price-text">¥{{ row.basePrice }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="officialDistriPrice" label="官方分销价" width="110" align="right">
              <template slot-scope="{ row }">
                <span class="price-text">¥{{ row.officialDistriPrice }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="suggestPrice" label="建议零售价" width="110" align="right">
              <template slot-scope="{ row }">
                <span class="price-text">¥{{ row.suggestPrice }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 可配送区域 -->
        <el-card v-if="deliveryInfo" shadow="never" class="mt15">
          <div slot="header"><span class="card-title">配送信息</span></div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="是否可配送">
              <el-tag :type="deliveryInfo.deliverable ? 'success' : 'danger'" size="mini">
                {{ deliveryInfo.deliverable ? '可配送' : '不可配送' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="模板名称">{{ deliveryInfo.templateName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="模板类型">{{ deliveryInfo.templateType === 0 ? '全国可用' : '部分区域' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="deliveryInfo.deliverableProvinces && deliveryInfo.deliverableProvinces.length > 0" class="area-list mt10">
            <span class="area-label">可配送省份：</span>
            <el-tag v-for="province in deliveryInfo.deliverableProvinces" :key="province" size="mini" class="area-tag">{{ province }}</el-tag>
          </div>
        </el-card>
      </template>
    </div>
  </el-drawer>
</template>

<script>
import { GetSpuDetail, CheckDeliveryArea } from '@/api/yytapi';

export default {
  name: 'GoodsDetailDrawer',
  data() {
    return {
      visible: false,
      loading: false,
      spuInfo: null,
      skuList: [],
      deliveryInfo: null,
    };
  },
  methods: {
    open(spuId) {
      this.visible = true;
      this.spuInfo = null;
      this.skuList = [];
      this.deliveryInfo = null;
      this.loading = true;
      GetSpuDetail({ spuId })
        .then((res) => {
          console.log('商品详情', res);
          this.spuInfo = (res && res.spuInfo) || {};
          this.skuList = (res && res.skuList) || [];
          // 查询配送区域
          this.loadDelivery(spuId);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 加载配送区域信息
    loadDelivery(spuId) {
      CheckDeliveryArea({ spuId: spuId })
        .then((res) => {
          console.log('配送区域', res);
          this.deliveryInfo = (res && res.data) || null;
        })
        .catch((e) => {
          console.error('获取配送区域失败', e);
        });
    },
    handleClose() {
      this.visible = false;
    },
  },
};
</script>

<style scoped>
.drawer-body { padding: 20px; }
.card-title { font-weight: 600; font-size: 14px; }
.price-text { color: #f56c6c; font-weight: 600; }
.area-list { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.area-label { font-weight: 500; color: #606266; }
.area-tag { margin: 2px; }
</style>
