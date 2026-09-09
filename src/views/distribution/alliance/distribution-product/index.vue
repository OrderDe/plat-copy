<template>
  <div class="divBox">
    <el-card shadow="never" :bordered="false">
      <div class="tips">
        全平台在售的分销商品。奖励由各商户自己承担、自己配置，平台不代配也不审核 ——
        这里只用来看全平台放了哪些商品出来、奖励开到多少，发现异常配置时可以强制关闭。
      </div>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="商户">
          <el-select
            v-model="query.merId"
            clearable
            filterable
            placeholder="全部商户"
            class="selWidth"
            @change="load(1)"
          >
            <el-option
              v-for="m in merchants"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input
            v-model.trim="query.keywords"
            clearable
            placeholder="商品名称"
            class="selWidth"
            @keyup.enter.native="load(1)"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="load(1)">查询</el-button>
          <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 奖励金额是商户的成本结构，露给消费者容易被反推成「这商品贵了 5 元」，
           所以给平台一个开关。关掉只影响 App 分销专区的展示，佣金照常计算与发放 -->
      <div class="zone-switch">
        <span class="zone-switch-label">App 分销专区展示奖励金额</span>
        <el-switch
          v-model="zoneRewardShow"
          :active-value="1"
          :inactive-value="0"
          :disabled="configSaving"
          @change="saveZoneRewardShow"
        />
        <span class="sub">
          关闭后用户看不到「团长 ¥5 / 代理 ¥3」这类标签，佣金仍按配置正常计算与发放
        </span>
      </div>

      <el-table v-loading="loading" :data="list" border size="small">
        <el-table-column prop="id" label="配置ID" width="80" />
        <el-table-column label="商户" min-width="140">
          <template slot-scope="{ row }">
            <div>{{ row.merName || '-' }}</div>
            <div class="sub">ID：{{ row.merId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="260">
          <template slot-scope="{ row }">
            <div class="product-cell">
              <el-image v-if="row.image" :src="row.image" fit="cover" class="product-image" />
              <div>
                <div class="product-name" :title="row.productName">{{ row.productName }}</div>
                <div class="sub">商品ID：{{ row.productId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="参加规格" width="105">
          <template slot-scope="{ row }">
            <span v-if="!row.scopeCount" class="sub">全部规格</span>
            <el-tag v-else size="mini" type="warning">{{ row.scopeCount }} 个规格</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价(元)" width="95" />
        <el-table-column prop="sales" label="销量" width="70" />
        <el-table-column prop="stock" label="库存" width="70" />
        <el-table-column label="代理奖励" width="105">
          <template slot-scope="{ row }">{{ rewardText(row.shareRewardType, row.shareRewardValue) }}</template>
        </el-table-column>
        <el-table-column label="团长奖励" width="105">
          <template slot-scope="{ row }">{{ rewardText(row.partnerRewardType, row.partnerRewardValue) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.commissionOpen === 1 ? 'success' : 'info'">
              {{ row.commissionOpen === 1 ? '分销中' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="加入时间" min-width="150" />
        <el-table-column label="操作" width="110" fixed="right">
          <template slot-scope="{ row }">
            <el-button
              type="text"
              size="small"
              :class="{ 'danger-text': row.commissionOpen === 1 }"
              @click="toggle(row)"
            >{{ row.commissionOpen === 1 ? '强制关闭' : '重新开启' }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="block">
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
      </div>
    </el-card>
  </div>
</template>

<script>
import {
  getPlatformDistributionProducts,
  togglePlatformDistributionProduct,
  getDistributionConfig,
  saveDistributionConfig,
} from '@/api/alliance';
import { merchantListApi } from '@/api/merchant';

export default {
  name: 'AllianceDistributionProduct',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      merchants: [],
      query: { page: 1, limit: 20, merId: null, keywords: '' },
      // 平台级分销配置（mer_id=0）。保存要整条回传，所以原样留着读回来的对象
      config: null,
      zoneRewardShow: 1,
      configSaving: false,
    };
  },
  created() {
    this.loadMerchants();
    this.loadConfig();
    this.load(1);
  },
  methods: {
    /** 平台级分销配置。没配过时后端回 null，按「展示」处理，与加开关之前的行为一致 */
    loadConfig() {
      getDistributionConfig(0)
        .then((res) => {
          const data = (res && res.data !== undefined ? res.data : res) || null;
          this.config = data;
          this.zoneRewardShow = data && Number(data.zoneRewardShow) === 0 ? 0 : 1;
        })
        .catch(() => {});
    },
    /** 开关是即时生效的，不额外放一个「保存」按钮 —— 一个开关配一个保存键太重 */
    saveZoneRewardShow(value) {
      this.configSaving = true;
      const payload = { ...(this.config || { merId: 0 }), merId: 0, zoneRewardShow: value };
      saveDistributionConfig(payload)
        .then(() => {
          this.config = payload;
          this.$message.success(value === 1 ? '已开启奖励金额展示' : '已关闭奖励金额展示');
        })
        .catch(() => {
          // 存失败就把开关拨回去，不然界面显示的是一个并没有生效的状态
          this.zoneRewardShow = value === 1 ? 0 : 1;
        })
        .finally(() => {
          this.configSaving = false;
        });
    },
    /**
     * 商户下拉。一次拉够而不是做远程搜索：这个下拉只是个筛选器，
     * 商户数量在可预见的规模内都装得下，做成远程搜索反而每次点开都要等一次请求。
     */
    loadMerchants() {
      merchantListApi({ page: 1, limit: 200 })
        .then((res) => {
          this.merchants = (res.list || res.records || []).map((m) => ({ id: m.id, name: m.name }));
        })
        .catch(() => {});
    },
    load(page) {
      if (page) this.query.page = page;
      this.loading = true;
      getPlatformDistributionProducts(this.query)
        .then((res) => {
          this.list = (res.list || res.records || []).map(this.normalize);
          this.total = Number(res.total || 0);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    /**
     * 归一化列名。
     *
     * 后端这个查询的 resultType 是 Map，返回的键是 SQL 里的列名（下划线），
     * mybatis 的 map-underscore-to-camel-case 只作用于 POJO 映射，对 Map 不生效。
     * 商户端 distribution/goods 页里那些 `row.productId || row.product_id`
     * 就是同一个坑。集中转一次，模板里只认一套字段名。
     */
    normalize(row) {
      const pick = (...keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
        }
        return '';
      };
      return {
        id: pick('id'),
        merId: pick('merId', 'mer_id'),
        merName: pick('merName', 'mer_name'),
        productId: pick('productId', 'product_id'),
        productName: pick('productName', 'product_name'),
        image: pick('image'),
        price: pick('price'),
        sales: pick('sales') || 0,
        stock: pick('stock') || 0,
        shareRewardType: pick('shareRewardType', 'share_reward_type'),
        shareRewardValue: pick('shareRewardValue', 'share_reward_value'),
        partnerRewardType: pick('partnerRewardType', 'partner_reward_type'),
        partnerRewardValue: pick('partnerRewardValue', 'partner_reward_value'),
        commissionOpen: Number(pick('commissionOpen', 'commission_open') || 0),
        createTime: pick('createTime', 'create_time'),
        // 限定了几个规格；0 表示整品参加
        scopeCount: (() => {
          const scope = pick('attrValueIds', 'attr_value_ids');
          return scope ? String(scope).split(',').filter((v) => v.trim()).length : 0;
        })(),
      };
    },
    onSizeChange(size) {
      this.query.limit = size;
      this.load(1);
    },
    reset() {
      this.query = { page: 1, limit: this.query.limit, merId: null, keywords: '' };
      this.load(1);
    },
    /**
     * 单品奖励。type：1-佣金(元) 2-积分 3-佣金(%)（见 DistributionProduct 的 shareRewardType）。
     * 命中这一层后 CommissionRuleService 直接返回，不再往下取全局比例。
     * 比例口径存的是百分比，结算时才按佣金基数折算，所以这里只能显示百分比本身。
     */
    rewardText(type, value) {
      const n = Number(value || 0);
      if (!n) return '-';
      if (Number(type) === 2) return n + ' 积分';
      return Number(type) === 3 ? n.toFixed(2) + '%' : '¥' + n.toFixed(2);
    },
    toggle(row) {
      const open = row.commissionOpen === 1 ? 0 : 1;
      const action = open === 1 ? '重新开启' : '强制关闭';
      this.$confirm(
        `确定${action}「${row.merName || row.merId}」的商品「${row.productName}」的分销吗？`,
        '提示',
        { type: 'warning' },
      )
        .then(() => togglePlatformDistributionProduct(row.id, open))
        .then(() => {
          this.$message.success(action + '成功');
          this.load();
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped lang="scss">
.tips {
  margin-bottom: 12px;
  padding: 8px 12px;
  color: #666;
  font-size: 12px;
  line-height: 1.6;
  background: #f8f8f9;
  border-radius: 4px;
}
.sub {
  color: #999;
  font-size: 12px;
}
.zone-switch {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;

  .zone-switch-label {
    margin-right: 10px;
    font-size: 13px;
    color: #333;
  }
  .sub {
    margin-left: 10px;
  }
}
.product-cell {
  display: flex;
  align-items: center;
}
.product-image {
  width: 40px;
  height: 40px;
  margin-right: 8px;
  flex-shrink: 0;
  border-radius: 4px;
}
.product-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.block {
  margin-top: 14px;
  text-align: right;
}
</style>
