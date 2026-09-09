<template>
  <div class="divBox share-settings-page">
    <!--
      分销设置：把「区域代理 → 团长 → 消费者」这条链路的第一步配起来。
      代理能选哪些商品发到团长群、团长能分享哪些商品、开通条件与分享关系，都在这一页。
      商品的利润分成比例不在这里配，那是「分销商品」页的单品覆盖（团长比例 / 代理比例）。
    -->
    <el-card shadow="never" :bordered="false" class="section-card" v-loading="loading">
      <div class="section-title">分享商品设置</div>
      <el-tabs v-model="activeRole" @tab-click="onRoleChange">
        <el-tab-pane label="团长" name="LEADER" />
        <el-tab-pane label="区域代理" name="AGENT" />
      </el-tabs>

      <el-form label-width="130px" size="small" class="section-form">
        <el-form-item :label="`${roleName}分享商品`">
          <el-button type="primary" plain icon="el-icon-plus" @click="pickerVisible = true">
            从分销商品选择
          </el-button>
          <!-- 一件件点叉在池子几十件时很折磨；这里只清「已退出分销」的，
               不碰其它商品，所以做成一个按钮而不是全选反选那一套 -->
          <el-button
            v-if="outOfDistributionCount"
            type="danger"
            plain
            icon="el-icon-delete"
            @click="removeOutOfDistribution"
          >
            移除已退出分销（{{ outOfDistributionCount }}）
          </el-button>
          <span class="form-tip">{{ pickTip }}</span>

          <div class="product-box">
            <div v-if="!form.products.length" class="empty">暂未选择商品</div>
            <div v-for="item in form.products" :key="item.productId" class="product-item">
              <el-image v-if="item.image" :src="item.image" fit="cover" class="product-image" />
              <div class="product-meta">
                <div class="product-name" :title="item.productName">{{ item.productName || '商品' }}</div>
                <div class="product-id">ID：{{ item.productId }}</div>
                <!-- 商户后来退出分销时池子里的旧记录不会自动消失，标出来让运营自己决定撤不撤 -->
                <el-tag v-if="isOutOfDistribution(item.productId)" size="mini" type="danger">已退出分销</el-tag>
              </div>
              <i class="el-icon-close remove" @click="removeProduct(item.productId)" />
            </div>
          </div>
        </el-form-item>

        <el-form-item :label="`${roleName}分享卡券`">
          <el-input
            v-model.trim="form.shareCoupon"
            class="text-input"
            placeholder="多个卡券 ID 用英文逗号分隔"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :bordered="false" class="section-card">
      <div class="section-title">开通条件</div>
      <el-tabs v-model="activeRole" @tab-click="onRoleChange">
        <el-tab-pane label="团长" name="LEADER" />
        <el-tab-pane label="区域代理" name="AGENT" />
      </el-tabs>

      <el-form label-width="130px" size="small" class="section-form">
        <el-form-item label="开通方式">
          <el-radio-group v-model="form.openMode">
            <el-radio-button label="FREE">免费开通</el-radio-button>
            <el-radio-button label="PAID">付费开通</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="`${roleName}开通卡券`">
          <el-input
            v-model.trim="form.openCoupon"
            class="text-input"
            placeholder="多个卡券 ID 用英文逗号分隔"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" :bordered="false" class="section-card">
      <div class="section-title">分享关系设置</div>
      <el-form label-width="130px" size="small" class="section-form">
        <el-form-item label="分享关系">
          <el-radio-group v-model="form.relationMode">
            <el-radio label="LIFELONG">终身分享，新用户邀请即绑定</el-radio>
            <el-radio label="PROTECT">保护期内绑定，到期后可被其他团长改绑</el-radio>
          </el-radio-group>
          <div class="form-tip block">
            保护期天数在「联盟配置」的 leader.bind.protect.days 里调整。
          </div>
        </el-form-item>

        <el-form-item label="代理利润分成归属">
          <el-radio-group v-model="form.agentAttributionMode">
            <el-radio label="CHAIN">按分享链路：谁发展的团长，谁拿代理分成</el-radio>
            <el-radio label="REGION">按收货地：货发到谁的辖区，谁拿代理分成</el-radio>
            <el-radio label="SPLIT">跨区拆分：收货地代理与招募代理共分代理比例</el-radio>
          </el-radio-group>
          <div class="form-tip block">
            默认「按分享链路」，与「区域代理把商品发给名下团长、团长分发到消费者群」一致：
            消费者成交后团长拿团长分成，团长的所属代理拿代理分成，与收货地无关。
            改这里只影响之后的新订单，历史订单按下单当时的归因快照结算，不回溯。
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="footer-bar">
      <el-button type="primary" :loading="saving" @click="save">保存设置</el-button>
      <el-button @click="load">重置</el-button>
    </div>

    <!-- 只能从「已加入分销且分销中」的商品里选：分享链路是靠佣金驱动的，
         放一个没配奖励的商品进池子，团长发出去、消费者下了单，结算时才发现一分钱没有 -->
    <el-dialog
      title="选择分销商品"
      :visible.sync="pickerVisible"
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      @open="loadPicker(1)"
    >
      <div class="picker-tip">
        只列出商户已加入分销、且当前分销中的商品。想放别的商品出去，先让商户在「分销设置」里配置奖励。
      </div>
      <el-form inline size="small" @submit.native.prevent>
        <el-form-item label="商品名称">
          <el-input
            v-model.trim="pickerQuery.keywords"
            clearable
            placeholder="商品名称"
            @keyup.enter.native="loadPicker(1)"
          />
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
        height="380"
        @selection-change="onPickerSelect"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column label="商品" min-width="240">
          <template slot-scope="{ row }">
            <div class="product-cell">
              <el-image v-if="row.image" :src="row.image" fit="cover" class="picker-image" />
              <div>
                <div>{{ row.productName || '商品' }}</div>
                <div class="product-id">商品ID：{{ row.productId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商户" min-width="120">
          <template slot-scope="{ row }">{{ row.merName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="price" label="售价(元)" width="95" />
        <el-table-column label="奖励" min-width="150">
          <template slot-scope="{ row }">
            <div>团长 {{ rewardText(row.partnerRewardType, row.partnerRewardValue) }}</div>
            <div>代理 {{ rewardText(row.shareRewardType, row.shareRewardValue) }}</div>
          </template>
        </el-table-column>
      </el-table>
      <div class="picker-footer">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :current-page="pickerQuery.page"
          :page-size="pickerQuery.limit"
          :total="pickerTotal"
          @current-change="loadPicker"
        />
        <div>
          <el-button size="small" @click="pickerVisible = false">取消</el-button>
          <el-button size="small" type="primary" :disabled="!pickerSelected.length" @click="confirmPick">
            添加 {{ pickerSelected.length ? pickerSelected.length + ' 件' : '' }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
/**
 * 分销设置（平台端）。
 *
 * 两个 tab 共用同一个 activeRole：商品池与开通条件按角色分开存，
 * 分享关系与归因口径是全局一份，切 tab 时不会变。
 */
import {
  getShareSettings,
  saveShareSettings,
  getPlatformDistributionProducts,
} from '@/api/alliance';

export default {
  name: 'AllianceShareSettings',
  data() {
    return {
      loading: false,
      saving: false,
      pickerVisible: false,
      pickerLoading: false,
      pickerList: [],
      pickerTotal: 0,
      pickerSelected: [],
      pickerQuery: { page: 1, limit: 10, keywords: '' },
      // 当前分销中的商品 id，用来标出池子里已经退出分销的旧记录
      distributableIds: [],
      activeRole: 'LEADER',
      form: {
        targetRole: 'LEADER',
        products: [],
        openMode: 'FREE',
        openCoupon: '',
        shareCoupon: '',
        relationMode: 'LIFELONG',
        agentAttributionMode: 'CHAIN',
      },
    };
  },
  computed: {
    roleName() {
      return this.activeRole === 'AGENT' ? '区域代理' : '团长';
    },
    /** 池子里已经退出分销的商品数。为 0 时清理按钮不出现，免得给一个点了没反应的键 */
    outOfDistributionCount() {
      return this.form.products.filter((item) => this.isOutOfDistribution(item.productId)).length;
    },
    pickTip() {
      return this.activeRole === 'AGENT'
        ? '支持批量勾选，选中后区域代理可在代理端从中挑选，再分发到名下团长群'
        : '支持批量勾选，选中后可在团长中心推广分享';
    },
  },
  created() {
    this.load();
    this.loadDistributableIds();
  },
  methods: {
    load() {
      this.loading = true;
      getShareSettings(this.activeRole)
        .then((res) => {
          const data = res || {};
          this.form = {
            targetRole: this.activeRole,
            products: (data.products || []).map((item) => ({
              productId: Number(item.productId),
              productName: item.productName || '',
              image: item.image || '',
              price: item.price || 0,
              sort: item.sort || 0,
            })),
            openMode: data.openMode || 'FREE',
            openCoupon: data.openCoupon || '',
            shareCoupon: data.shareCoupon || '',
            relationMode: data.relationMode || 'LIFELONG',
            agentAttributionMode: data.agentAttributionMode || 'CHAIN',
          };
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 切 tab 换的是另一份商品池与开通条件，直接重新拉取；本 tab 未保存的改动会丢失
    onRoleChange() {
      this.load();
    },
    /**
     * 选品弹窗的数据源是「全平台分销商品」，不是商品库 ——
     * 后端保存时也会拦一遍没配分销的商品，这里只是不让运营先选了再被拒。
     */
    loadPicker(page) {
      this.pickerQuery.page = page || 1;
      this.pickerLoading = true;
      getPlatformDistributionProducts({
        page: this.pickerQuery.page,
        limit: this.pickerQuery.limit,
        keywords: this.pickerQuery.keywords || undefined,
      })
        .then((res) => {
          const data = (res && res.data !== undefined ? res.data : res) || {};
          const rows = data.list || data.records || [];
          // 强制关闭的配置不给选：选了后端也会拒
          this.pickerList = rows.map(this.normalizePickerRow).filter((row) => row.commissionOpen === 1);
          this.pickerTotal = Number(data.total || 0);
        })
        .catch(() => {
          this.pickerList = [];
          this.pickerTotal = 0;
        })
        .finally(() => {
          this.pickerLoading = false;
        });
    },
    /** 后端这个查询回的是 Map，键是 SQL 列名（下划线），这里统一成一套字段名 */
    normalizePickerRow(row) {
      const pick = (...keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
        }
        return '';
      };
      return {
        productId: Number(pick('productId', 'product_id') || 0),
        productName: pick('productName', 'product_name'),
        image: pick('image'),
        price: pick('price'),
        merName: pick('merName', 'mer_name'),
        shareRewardType: pick('shareRewardType', 'share_reward_type'),
        shareRewardValue: pick('shareRewardValue', 'share_reward_value'),
        partnerRewardType: pick('partnerRewardType', 'partner_reward_type'),
        partnerRewardValue: pick('partnerRewardValue', 'partner_reward_value'),
        commissionOpen: Number(pick('commissionOpen', 'commission_open') || 0),
      };
    },
    /** 奖励口径：1-佣金(元) 2-积分 3-佣金(%)，与商户端「分销设置」弹窗一致 */
    rewardText(type, value) {
      const n = Number(value || 0);
      if (!n) return '不发放';
      if (Number(type) === 2) return n + ' 积分';
      return Number(type) === 3 ? n.toFixed(2) + '%' : '¥' + n.toFixed(2);
    },
    onPickerSelect(rows) {
      this.pickerSelected = rows || [];
    },
    confirmPick() {
      const exists = new Set(this.form.products.map((item) => item.productId));
      this.pickerSelected.forEach((row) => {
        if (!row.productId || exists.has(row.productId)) return;
        exists.add(row.productId);
        this.form.products.push({
          productId: row.productId,
          productName: row.productName || '',
          image: row.image || '',
          price: row.price || 0,
          sort: 0,
        });
      });
      this.pickerSelected = [];
      this.pickerVisible = false;
      this.loadDistributableIds();
    },
    /**
     * 当前分销中的商品 id 全量。只用来给池子里的旧记录打「已退出分销」标记，
     * 所以一次多拉一些，不做分页 —— 这个页面本身就不是高频访问的。
     */
    loadDistributableIds() {
      getPlatformDistributionProducts({ page: 1, limit: 500 })
        .then((res) => {
          const data = (res && res.data !== undefined ? res.data : res) || {};
          const rows = (data.list || data.records || []).map(this.normalizePickerRow);
          this.distributableIds = rows.filter((row) => row.commissionOpen === 1).map((row) => row.productId);
        })
        .catch(() => {
          // 拉不到就不标记，总比把在售商品误标成「已退出分销」强
          this.distributableIds = [];
        });
    },
    /**
     * 一键清掉池子里已退出分销的商品。
     *
     * 只改本地清单，仍要点「保存」才落库 —— 与手动点叉的行为一致，
     * 误点了还能直接刷新页面退回去。
     */
    removeOutOfDistribution() {
      const stale = this.form.products.filter((item) => this.isOutOfDistribution(item.productId));
      if (!stale.length) return;
      this.$confirm(
        `将从${this.roleName}分享池里移除 ${stale.length} 件已退出分销的商品，保存后生效。继续？`,
        '提示',
        { type: 'warning' },
      )
        .then(() => {
          this.form.products = this.form.products.filter(
            (item) => !this.isOutOfDistribution(item.productId),
          );
          this.$message.success(`已移除 ${stale.length} 件，记得点「保存」`);
        })
        .catch(() => {});
    },
    isOutOfDistribution(productId) {
      if (!this.distributableIds.length) return false;
      return this.distributableIds.indexOf(Number(productId)) === -1;
    },
    removeProduct(productId) {
      this.form.products = this.form.products.filter((item) => item.productId !== productId);
    },
    save() {
      this.saving = true;
      saveShareSettings({ ...this.form, targetRole: this.activeRole })
        .then(() => {
          this.$message.success('保存成功');
          this.load();
        })
        .finally(() => {
          this.saving = false;
        });
    },
  },
};
</script>

<style scoped lang="scss">
.share-settings-page {
  padding-bottom: 70px;
}
.picker-tip {
  margin-bottom: 12px;
  padding: 8px 12px;
  color: #666;
  font-size: 12px;
  line-height: 1.6;
  background: #f8f8f9;
  border-radius: 4px;
}
.picker-image {
  width: 40px;
  height: 40px;
  margin-right: 8px;
  border-radius: 4px;
}
.product-cell {
  display: flex;
  align-items: center;
}
.product-id {
  color: #999;
  font-size: 12px;
}
.picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.section-card {
  margin-bottom: 16px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  border-left: 3px solid #1890ff;
  padding-left: 8px;
  margin-bottom: 12px;
}
.section-form {
  margin-top: 12px;
  background: #fafbfc;
  padding: 20px 0 4px;
}
.form-tip {
  color: #909399;
  font-size: 12px;
  margin-left: 12px;
  &.block {
    display: block;
    margin-left: 0;
    line-height: 20px;
  }
}
.text-input {
  max-width: 560px;
}
.product-box {
  margin-top: 10px;
  min-height: 120px;
  max-width: 750px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  .empty {
    width: 100%;
    text-align: center;
    color: #c0c4cc;
    line-height: 96px;
  }
}
.product-item {
  position: relative;
  width: 210px;
  display: flex;
  align-items: center;
  padding: 6px;
  margin: 0 10px 10px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  .product-image {
    width: 42px;
    height: 42px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .product-meta {
    margin-left: 8px;
    overflow: hidden;
  }
  .product-name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .product-id {
    color: #909399;
    font-size: 12px;
  }
  .remove {
    position: absolute;
    top: 2px;
    right: 4px;
    color: #c0c4cc;
    cursor: pointer;
    &:hover {
      color: #f56c6c;
    }
  }
}
.footer-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 210px;
  padding: 12px 30px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  z-index: 10;
}
</style>
