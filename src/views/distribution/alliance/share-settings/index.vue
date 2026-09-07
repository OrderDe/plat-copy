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
            从商品库选择
          </el-button>
          <span class="form-tip">{{ pickTip }}</span>

          <div class="product-box">
            <div v-if="!form.products.length" class="empty">暂未选择商品</div>
            <div v-for="item in form.products" :key="item.productId" class="product-item">
              <el-image v-if="item.image" :src="item.image" fit="cover" class="product-image" />
              <div class="product-meta">
                <div class="product-name" :title="item.productName">{{ item.productName || '商品' }}</div>
                <div class="product-id">ID：{{ item.productId }}</div>
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

    <el-dialog title="选择商品" :visible.sync="pickerVisible" width="960px" append-to-body :close-on-click-modal="false">
      <good-list v-if="pickerVisible" handle-num="many" :checked="checkedProducts" @getStoreItem="onPicked" />
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
import goodList from '@/components/goodList';
import { getShareSettings, saveShareSettings } from '@/api/alliance';

export default {
  name: 'AllianceShareSettings',
  components: { goodList },
  data() {
    return {
      loading: false,
      saving: false,
      pickerVisible: false,
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
    pickTip() {
      return this.activeRole === 'AGENT'
        ? '支持批量勾选，选中后区域代理可在代理端从中挑选，再分发到名下团长群'
        : '支持批量勾选，选中后可在团长中心推广分享';
    },
    // goodList 组件按商品 id 回显勾选状态
    checkedProducts() {
      return this.form.products.map((item) => ({ id: item.productId, image: item.image }));
    },
  },
  created() {
    this.load();
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
    onPicked(rows) {
      const list = Array.isArray(rows) ? rows : [rows];
      const exists = new Set(this.form.products.map((item) => item.productId));
      list
        .filter((row) => row && row.id)
        .forEach((row) => {
          if (exists.has(Number(row.id))) return;
          exists.add(Number(row.id));
          this.form.products.push({
            productId: Number(row.id),
            productName: row.name || row.storeName || '',
            image: row.image || row.src || '',
            price: row.price || 0,
            sort: 0,
          });
        });
      this.pickerVisible = false;
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
