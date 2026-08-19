<template>
  <commodity-group-style
    :active-item="activeItem"
    :extra-choose-options="[{ label: 3, text: '推荐策略' }]"
    @update="onChildUpdate"
  >
    <template v-slot:choose-extra="{ chooseGoods }">
      <div v-if="chooseGoods == 3" class="strategy-box">
        <el-radio-group v-model="strategy" class="strategy-group" @change="updateStrategy($event, 'strategy')">
          <el-radio class="strategy-label" :label="1">销量优先：从高到低</el-radio>
          <el-radio class="strategy-label" :label="2">价格从高到低</el-radio>
          <el-radio class="strategy-label" :label="3">价格从低到高</el-radio>
          <el-radio class="strategy-label" :label="4">新品优先：商品创建时间倒序</el-radio>
          <el-radio class="strategy-label" :label="5">评价优先：评论从多到少</el-radio>
        </el-radio-group>

        <div class="number-row">
          <div class="number-label">显示条数</div>
          <div class="number-ctrl">
            <el-slider v-model="displayNumber" style="width: 165px" :min="1" :max="21" @change="updateStrategy($event, 'displayNumber')" />
            <el-input v-model="displayNumber" type="number" :min="1" :max="21" size="mini" class="number-ipt" @input="updateStrategy($event, 'displayNumber')">
              <template slot="append">个</template>
            </el-input>
          </div>
        </div>
      </div>
    </template>
  </commodity-group-style>
</template>

<script>
/**
 * 推荐策略商品组 —— 属性面板。迁移自 PHP common/commodity-strategy-group/style.php
 *
 * 比 commodity-group 多一种取数方式：chooseGoods == 3「推荐策略」，
 * 配置写入 data.strategyData = { strategy, displayNumber }，由 App 端按策略取数。
 */
import { deepClone } from '../../controls/utils';

export default {
  name: 'CommodityStrategyGroupStyle',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      result: {},
      strategy: 1,
      displayNumber: 1,
    };
  },
  created() {
    this.result = deepClone(this.activeItem);
    if (!this.result.data) this.$set(this.result, 'data', {});
    const strategyData = this.result.data.strategyData || {};
    this.strategy = strategyData.strategy || 1;
    this.displayNumber = strategyData.displayNumber || 1;
  },
  methods: {
    updateStrategy(value, key) {
      const data = Object.assign({ strategy: 1, displayNumber: 1 }, this.result.data.strategyData || {}, {
        [key]: Number(value),
      });
      this.$set(this.result.data, 'strategyData', data);
      this.$emit('update', this.result);
    },
    // 子面板改的是同一个画布项，合并后整体上抛
    onChildUpdate(item) {
      this.result = Object.assign({}, this.result, item, {
        data: Object.assign({}, item.data, { strategyData: (this.result.data || {}).strategyData }),
      });
      this.$emit('update', this.result);
    },
  },
};
</script>

<style scoped lang="scss">
.strategy-box {
  padding: 10px;
  background: #f4f3f7;
  border-radius: 4px;
}
.strategy-group {
  display: flex;
  flex-direction: column;
}
.strategy-label {
  margin-bottom: 8px;
}
.number-row {
  display: flex;
  align-items: center;
  padding-top: 6px;
}
.number-label {
  width: 60px;
  flex-shrink: 0;
  color: #999;
}
.number-ctrl {
  display: flex;
  align-items: center;
}
.number-ipt {
  width: 100px;
  margin-left: 12px;
}
</style>
