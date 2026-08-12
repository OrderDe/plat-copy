<template>
  <div class="app-container rec-config" v-loading="loading">
    <div class="page-header">
      <div class="page-title">猜你喜欢 · 推荐设置</div>
      <div class="page-sub">
        在这里告诉系统：顾客做了什么动作，就该给他推什么商品。改完点保存，几分钟内全店生效。
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <!-- ==================== ① 顾客喜好怎么判断 ==================== -->
      <el-tab-pane label="① 顾客喜好怎么判断" name="behavior">
        <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
          <template slot="title">
            💡 系统会观察顾客在店里的每个动作，来猜他喜欢什么。<b>下面每一行就是一个动作</b>，你只需要决定：这个动作说明顾客有多喜欢，以及这份喜好该记多久。
            比如「下单买了」当然比「随便看了一眼」更能说明喜好，所以它的档位更高、记得更久。
          </template>
        </el-alert>

        <el-card shadow="never" style="margin-bottom: 12px;">
          <div slot="header" class="card-head">
            <span><i class="el-icon-magic-stick"></i> 先选一个整体风格</span>
            <span class="card-head-tip">不确定怎么填？直接选一个，下面的档位会自动配好，之后想微调再单独改。</span>
          </div>
          <el-row :gutter="12">
            <el-col v-for="p in view.presetOptions" :key="p.code" :span="8">
              <div
                class="preset"
                :class="{ on: view.preset === p.code }"
                @click="onApplyPreset(p)">
                <div class="preset-title">
                  {{ p.label }}
                  <el-tag v-if="p.code === 'BALANCED'" size="mini" type="success">推荐</el-tag>
                  <span v-if="view.preset === p.code" class="preset-pick">✓ 已选</span>
                </div>
                <div class="preset-desc">{{ p.desc }}</div>
              </div>
            </el-col>
          </el-row>
          <div v-if="view.preset === 'CUSTOM'" class="preset-custom-tip">
            当前是<b>自定义</b>配置（你手工调整过），点上面任意一个模板可以重新铺一遍。
          </div>
        </el-card>

        <el-card shadow="never">
          <div slot="header" class="card-head">
            <span><i class="el-icon-s-operation"></i> 顾客动作明细</span>
            <span class="card-head-tip">关掉开关 = 系统完全不看这个动作。</span>
          </div>

          <div class="brow brow-head">
            <div class="bcol-switch">启用</div>
            <div class="bcol-main">顾客动作</div>
            <div class="bcol-level">说明他有多喜欢</div>
            <div class="bcol-memo">这份喜好记多久</div>
          </div>

          <div v-for="row in view.behaviors" :key="row.actionType" class="brow">
            <div class="bcol-switch">
              <el-switch v-model="row.enabled" />
            </div>
            <div class="bcol-main">
              <div class="bname">
                <span class="bicon">{{ row.icon }}</span>
                {{ row.actionName }}
                <el-select
                  v-if="supportThreshold(row)"
                  v-model="row.triggerThreshold"
                  size="mini"
                  class="threshold-select">
                  <el-option v-for="s in thresholdOptions" :key="s" :label="s + ' 秒'" :value="s" />
                </el-select>
              </div>
              <div class="bhelp">{{ row.actionHelp }}</div>
            </div>
            <div class="bcol-level">
              <el-radio-group v-model="row.interestLevel" size="mini" :disabled="!row.enabled">
                <el-radio-button
                  v-for="l in levelOptionsOf(row)"
                  :key="l.code"
                  :label="l.code">
                  {{ l.label }}
                </el-radio-button>
              </el-radio-group>
            </div>
            <div class="bcol-memo">
              <el-select v-model="row.memoryDuration" size="mini" :disabled="!row.enabled" style="width: 100%;">
                <el-option v-for="m in view.memoryOptions" :key="m.code" :label="m.label" :value="m.code" />
              </el-select>
            </div>
          </div>

          <div class="foot-bar">
            <span class="foot-tip">{{ view.lastChangeTip }}</span>
            <el-button size="small" @click="reload">还原上次保存</el-button>
            <el-button type="primary" size="small" :loading="saving" @click="onSaveBehaviors">保存并生效</el-button>
          </div>
        </el-card>

        <el-card shadow="never" style="margin-top: 12px;">
          <div slot="header" class="card-head">
            <span><i class="el-icon-mobile-phone"></i> 改完什么样？拿一位真实顾客试试</span>
          </div>
          <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
            <template slot="title">
              💡 填一个顾客 ID，按<b>当前已生效的配置</b>跑一遍真实召回，看看他现在打开首页会被推什么。
              走的是和线上完全同一条逻辑，唯一的区别是试算不会计入曝光，不影响这位顾客后续看到的内容。
              <br />
              ⚠️ 刚点过「保存并生效」的话，配置最多 30 秒后才全量生效，试算结果可能还是上一版。
            </template>
          </el-alert>

          <div class="preview-bar">
            <el-input
              v-model.trim="previewUserId"
              size="small"
              placeholder="顾客 ID"
              style="width: 180px;"
              @keyup.enter.native="onPreview" />
            <el-select v-model="previewLimit" size="small" style="width: 120px; margin-left: 8px;">
              <el-option v-for="n in [10, 20, 50]" :key="n" :label="`看 ${n} 条`" :value="n" />
            </el-select>
            <el-button
              type="primary"
              size="small"
              style="margin-left: 8px;"
              :loading="previewLoading"
              @click="onPreview">
              试算
            </el-button>
          </div>

          <el-table
            v-if="previewed"
            :data="previewList"
            size="small"
            v-loading="previewLoading"
            empty-text="没有召回到任何商品。可能是这位顾客把大部分商品都买过了，或者过滤规则配得太严"
            style="margin-top: 12px;">
            <el-table-column label="#" type="index" width="50" />
            <el-table-column label="商品" min-width="260">
              <template slot-scope="{ row }">
                <div class="preview-goods">
                  <el-image v-if="row.image" :src="row.image" fit="cover" class="preview-img" />
                  <span class="preview-name">{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="价格" width="100">
              <template slot-scope="{ row }">￥{{ row.price }}</template>
            </el-table-column>
            <el-table-column label="销量" prop="sales" width="90" />
            <el-table-column label="库存" prop="stock" width="90" />
            <el-table-column label="类目ID" prop="cateId" width="90" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ==================== ② 哪些商品不要推 ==================== -->
      <el-tab-pane label="② 哪些商品不要推" name="filter">
        <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
          <template slot="title">
            💡 这一页是「刹车」。把不该出现的商品挡掉，比推得多更影响顾客体验。
          </template>
        </el-alert>

        <el-card shadow="never">
          <div slot="header" class="card-head">
            <span><i class="el-icon-remove-outline"></i> 不要推这些</span>
            <span class="card-head-tip">建议全部保持开启。</span>
          </div>

          <div v-for="rule in view.filterRules" :key="rule.ruleCode" class="rule-row">
            <el-switch v-model="rule.enabled" />
            <div class="rule-body">
              <div class="rule-name">
                {{ ruleNameBefore(rule) }}
                <el-select
                  v-if="ruleValueOptions(rule).length"
                  v-model="rule.ruleValue"
                  size="mini"
                  class="rule-select"
                  :disabled="!rule.enabled">
                  <el-option v-for="v in ruleValueOptions(rule)" :key="v" :label="v" :value="v" />
                </el-select>
                {{ ruleNameAfter(rule) }}
              </div>
              <div class="rule-desc">{{ rule.ruleDesc }}</div>

              <!-- 黑名单是唯一一条要挑具体商品/类目的规则，单独给一块编辑区 -->
              <div v-if="rule.ruleCode === 'blacklist'" class="black-box">
                <div class="black-line">
                  <span class="black-label">指定商品</span>
                  <el-button size="mini" :disabled="!rule.enabled" @click="openProductPicker">
                    + 选择商品
                  </el-button>
                  <span v-if="!blackProducts.length" class="black-empty">还没有选，这一项为空表示不按商品屏蔽</span>
                  <el-tag
                    v-for="p in blackProducts"
                    :key="p.id"
                    size="small"
                    closable
                    :disable-transitions="true"
                    class="black-tag"
                    @close="removeBlackProduct(p.id)">
                    {{ p.name || ('#' + p.id) }}
                  </el-tag>
                </div>

                <div class="black-line">
                  <span class="black-label">指定类目</span>
                  <el-cascader
                    v-model="blackCateIds"
                    size="mini"
                    class="black-cascader"
                    :options="categoryList"
                    :props="cateProps"
                    :disabled="!rule.enabled"
                    collapse-tags
                    filterable
                    clearable
                    @change="syncBlacklistValue" />
                  <span class="black-empty">选了类目，这个类目下所有商品都不再推荐</span>
                </div>
              </div>
            </div>
          </div>

          <div class="foot-bar">
            <span class="foot-tip">{{ view.lastChangeTip }}</span>
            <el-button size="small" @click="reload">还原上次保存</el-button>
            <el-button type="primary" size="small" :loading="saving" @click="onSaveFilters">保存并生效</el-button>
          </div>
        </el-card>

        <el-card shadow="never" style="margin-top: 12px;">
          <div slot="header" class="card-head">
            <span><i class="el-icon-user"></i> 新顾客第一次来，推什么？</span>
            <span class="card-head-tip">这类顾客还没有任何浏览记录，系统猜不出喜好，需要你指定一个兜底方案。</span>
          </div>
          <el-select v-model="view.coldStartMode" size="small" style="width: 260px;">
            <el-option v-for="c in view.coldStartOptions" :key="c.code" :label="c.label" :value="c.code" />
          </el-select>
          <el-button type="primary" size="small" :loading="saving" style="margin-left: 12px;" @click="onSaveSetting">
            保存
          </el-button>
        </el-card>
      </el-tab-pane>

      <!-- ==================== ③ 推荐位开关 ==================== -->
      <el-tab-pane label="③ 推荐位开关" name="scene">
        <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
          <template slot="title">
            💡 App 里有好几个地方会出现推荐商品，你可以分别控制开关和数量。
          </template>
        </el-alert>

        <el-card shadow="never">
          <el-table :data="view.scenes" size="small">
            <el-table-column label="开关" width="80">
              <template slot-scope="{ row }">
                <el-switch v-model="row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="出现的位置">
              <template slot-scope="{ row }">
                <div class="scene-name">{{ row.sceneName }}</div>
                <div class="scene-desc">{{ row.sceneDesc }}</div>
              </template>
            </el-table-column>
            <el-table-column label="显示几个" width="150">
              <template slot-scope="{ row }">
                <el-input-number
                  v-model="row.showCount"
                  size="mini"
                  :min="0"
                  :max="100"
                  controls-position="right"
                  style="width: 110px;" />
              </template>
            </el-table-column>
            <el-table-column label="对比测试" width="180">
              <template slot-scope="{ row }">
                <el-switch v-model="row.abEnabled" />
                <span v-if="row.abEnabled && row.abStartTime" class="ab-days">
                  已跑 {{ abDays(row.abStartTime) }} 天
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template slot-scope="{ row }">
                <el-tag v-if="row.enabled" size="mini" type="success">正常</el-tag>
                <el-tag v-else size="mini" type="info">已关闭</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="foot-bar">
            <span class="foot-tip">显示条数填 0 表示不限（无限下滑）。</span>
            <el-button size="small" @click="reload">还原上次保存</el-button>
            <el-button type="primary" size="small" :loading="saving" @click="onSaveScenes">保存并生效</el-button>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ==================== ④ 改动记录 ==================== -->
      <el-tab-pane label="④ 改动记录" name="log">
        <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
          <template slot="title">
            💡 谁在什么时候改了什么。推荐效果突然变差时，先来这里看看最近改过什么。
          </template>
        </el-alert>

        <el-card shadow="never">
          <div slot="header" class="card-head">
            <span><i class="el-icon-time"></i> 最近的改动</span>
            <span class="card-head-tip">
              当前生效配置版本：<b>v{{ view.version }}</b>
              <el-button type="text" size="mini" style="margin-left: 12px;" @click="onPublish">
                重新下发到推荐引擎
              </el-button>
            </span>
          </div>
          <el-table :data="logs" size="small" empty-text="还没有人改过配置">
            <el-table-column label="时间" prop="createTime" width="180" />
            <el-table-column label="操作人" prop="operator" width="140" />
            <el-table-column label="改了什么" prop="content" show-overflow-tooltip />
            <el-table-column label="版本" width="90">
              <template slot-scope="{ row }">v{{ row.version }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card shadow="never" style="margin-top: 12px;">
          <div slot="header" class="card-head">
            <span><i class="el-icon-data-line"></i> 效果看板</span>
            <span class="card-head-tip">
              <el-date-picker
                v-model="statRange"
                type="daterange"
                size="mini"
                unlink-panels
                value-format="yyyy-MM-dd"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="loadStats"
              />
            </span>
          </div>
          <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
            <template slot="title">
              💡 数据来自顾客行为流水，每个推荐位分开统计。
              「其他入口」是没有标记推荐位的行为，包括加这个统计口径之前的历史数据。
            </template>
          </el-alert>
          <el-table :data="totalStats" size="small" v-loading="statLoading" empty-text="这段时间还没有行为数据">
            <el-table-column label="推荐位" prop="sceneName" min-width="200" />
            <el-table-column label="曝光" prop="exposeCount" width="100" />
            <el-table-column label="点击" prop="clickCount" width="100" />
            <el-table-column label="点击率" width="100">
              <template slot-scope="{ row }">{{ row.clickRate }}%</template>
            </el-table-column>
            <el-table-column label="加购" prop="cartCount" width="100" />
            <el-table-column label="成交" prop="buyCount" width="100" />
            <el-table-column label="点击后成交率" width="120">
              <template slot-scope="{ row }">{{ row.buyRate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 只有真的开着对比测试才显示这块，否则两组数字并排放着容易被误读成"效果差异" -->
        <el-card v-if="abStats.length" shadow="never" style="margin-top: 12px;">
          <div slot="header" class="card-head">
            <span><i class="el-icon-data-analysis"></i> 对比测试结果</span>
            <span class="card-head-tip">实验组走个性化，对照组走通用排序，各占一半顾客。</span>
          </div>
          <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
            <template slot="title">
              💡 顾客按账号固定分组，同一个人每次看到的都是同一组，不会来回横跳。
              未登录顾客算进实验组（他们本来就没有喜好数据可用）。
              <b>看点击率和成交率，不要看绝对条数</b>——两组人数不一定完全相等。
            </template>
          </el-alert>
          <el-table :data="abStats" size="small" v-loading="statLoading">
            <el-table-column label="推荐位" prop="sceneName" min-width="180" />
            <el-table-column label="分组" prop="abGroupName" width="160" />
            <el-table-column label="曝光" prop="exposeCount" width="100" />
            <el-table-column label="点击" prop="clickCount" width="100" />
            <el-table-column label="点击率" width="100">
              <template slot-scope="{ row }">{{ row.clickRate }}%</template>
            </el-table-column>
            <el-table-column label="成交" prop="buyCount" width="100" />
            <el-table-column label="点击后成交率" width="120">
              <template slot-scope="{ row }">{{ row.buyRate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 商品选择弹窗，复用商品营销那套现成的列表组件 -->
    <el-dialog
      title="选择不再推荐的商品"
      :visible.sync="productPickerVisible"
      width="896px"
      append-to-body
      class="dialog-bottom"
      :close-on-click-modal="false">
      <good-list
        v-if="productPickerVisible"
        handle-num="many"
        :checked="blackProducts"
        @getStoreItem="onProductsPicked"
        @closeDialog="productPickerVisible = false" />
    </el-dialog>
  </div>
</template>

<script>
import {
  getRecommendView,
  saveBehaviors,
  applyPreset,
  saveFilterRules,
  saveScenes,
  saveSetting,
  getConfigLogs,
  publishConfig,
  getSceneStats,
  previewRecommend,
} from '@/api/recommendConfig';
import store from '@/store';
import GoodList from '@/components/goodList/index.vue';

export default {
  name: 'RecommendConfig',
  components: { GoodList },
  data() {
    return {
      loading: false,
      saving: false,
      activeTab: 'behavior',
      // 触发门槛只给几个常用值，让运营从里面挑，别开放任意输入
      thresholdOptions: [2, 5, 10, 30],
      logs: [],
      // 效果看板默认看最近 7 天，区间由后端兜底，这里不传也能出数
      statRange: [],
      stats: [],
      statLoading: false,
      // ── 顾客试算用 ──
      previewUserId: '',
      previewLimit: 10,
      previewLoading: false,
      // 只有真的点过试算才显示结果表，否则一进来就是个"没有数据"的空表，看着像坏了
      previewed: false,
      previewList: [],
      // ── 黑名单编辑用 ──
      // 后端存的是一串 "1001,1002,cate:35"，页面上拆成商品和类目两块分别编辑，
      // 保存前再拼回同样的格式。商品要展示名称，所以存的是 {id, name} 而不是裸 ID。
      productPickerVisible: false,
      blackProducts: [],
      blackCateIds: [],
      categoryList: [],
      cateProps: {
        value: 'id',
        label: 'name',
        children: 'childList',
        expandTrigger: 'hover',
        emitPath: false,
        multiple: true,
      },
      view: {
        behaviors: [],
        filterRules: [],
        scenes: [],
        presetOptions: [],
        coldStartOptions: [],
        levelOptions: [],
        negativeLevelOptions: [],
        memoryOptions: [],
        preset: '',
        coldStartMode: '',
        version: 0,
        lastChangeTip: '',
      },
    };
  },
  computed: {
    /** 看板主表：后端返回的合计行（abGroup 为空的那些） */
    totalStats() {
      return this.stats.filter((s) => !s.abGroup);
    },

    /**
     * 对比测试明细：只保留那些「确实开着对比测试」的推荐位的分组行。
     * 后端对所有推荐位都算了分组数据，但没开测试的推荐位两组走的是同一套逻辑，
     * 把它们列出来只会让运营以为在做实验。
     */
    abStats() {
      const testing = (this.view.scenes || []).filter((s) => s.abEnabled).map((s) => s.sceneCode);
      if (!testing.length) return [];
      return this.stats.filter((s) => s.abGroup && testing.indexOf(s.sceneCode) >= 0);
    },
  },
  created() {
    this.reload();
    // 类目树是全局缓存的，没拉过才去拉一次
    if (!store.getters.merPlatProductClassify.length) {
      store.dispatch('product/getAdminProductClassify').then(() => {
        this.categoryList = store.getters.merPlatProductClassify;
      });
    } else {
      this.categoryList = store.getters.merPlatProductClassify;
    }
  },
  methods: {
    reload() {
      this.loading = true;
      getRecommendView()
        .then((res) => {
          this.view = res;
          this.parseBlacklist();
          this.loading = false;
          this.loadLogs();
          this.loadStats();
        })
        .catch(() => {
          this.loading = false;
        });
    },

    loadLogs() {
      getConfigLogs(20)
        .then((res) => {
          this.logs = res || [];
        })
        .catch(() => {});
    },

    loadStats() {
      this.statLoading = true;
      const [start, end] = this.statRange || [];
      getSceneStats(start, end)
        .then((res) => {
          this.stats = res || [];
          this.statLoading = false;
        })
        .catch(() => {
          this.statLoading = false;
        });
    },

    // 后端保存接口统一返回刷新后的整页数据，直接替换即可
    applyResult(res, message) {
      this.view = res;
      this.saving = false;
      this.$message.success(message || '已保存，推荐配置已下发');
      this.loadLogs();
    },

    onError() {
      this.saving = false;
    },

    onApplyPreset(preset) {
      if (this.view.preset === preset.code) return;
      this.$confirm(
        `套用「${preset.label}」会覆盖所有动作当前的档位和记忆时长，确定吗？`,
        '切换整体风格',
        { type: 'warning' },
      )
        .then(() => {
          this.saving = true;
          applyPreset(preset.code)
            .then((res) => this.applyResult(res, `已套用「${preset.label}」`))
            .catch(this.onError);
        })
        .catch(() => {});
    },

    onSaveBehaviors() {
      this.saving = true;
      const payload = this.view.behaviors.map((b) => ({
        actionType: b.actionType,
        enabled: b.enabled,
        interestLevel: b.interestLevel,
        memoryDuration: b.memoryDuration,
        triggerThreshold: b.triggerThreshold,
      }));
      saveBehaviors(payload)
        .then((res) => this.applyResult(res))
        .catch(this.onError);
    },

    onPreview() {
      const userId = Number(this.previewUserId);
      if (!userId || userId <= 0) {
        this.$message.warning('请填写要试算的顾客 ID');
        return;
      }
      this.previewLoading = true;
      previewRecommend(userId, this.previewLimit)
        .then((res) => {
          this.previewList = res || [];
          this.previewed = true;
          this.previewLoading = false;
        })
        .catch(() => {
          // 具体错误信息由 request 的响应拦截器统一弹，这里只把表清干净
          this.previewList = [];
          this.previewed = true;
          this.previewLoading = false;
        });
    },

    // ── 黑名单编辑 ────────────────────────────────
    // 存储格式由后端定：逗号分隔，带 cate: 前缀的是类目，例 "1001,1002,cate:35"

    /** 从 rule_value 还原成页面上的两个列表。商品名这里拿不到，先用 #ID 占位 */
    parseBlacklist() {
      const rule = (this.view.filterRules || []).find((r) => r.ruleCode === 'blacklist');
      const raw = rule && rule.ruleValue ? String(rule.ruleValue) : '';
      const products = [];
      const cates = [];
      raw.split(',').forEach((token) => {
        const item = token.trim();
        if (!item) return;
        if (item.indexOf('cate:') === 0) {
          const id = Number(item.slice(5));
          if (id) cates.push(id);
        } else {
          // 已保存过的商品只剩 ID，名称要重新选一次才有；这里不额外发请求去补，
          // 运营看到 #ID 也知道是哪条，真要改直接删掉重选即可
          products.push({ id: item, name: '' });
        }
      });
      this.blackProducts = products;
      this.blackCateIds = cates;
    },

    /** 把两个列表拼回 rule_value，每次改动都同步一次，保存时直接取 view 里的值 */
    syncBlacklistValue() {
      const rule = (this.view.filterRules || []).find((r) => r.ruleCode === 'blacklist');
      if (!rule) return;
      const parts = this.blackProducts
        .map((p) => String(p.id))
        .concat(this.blackCateIds.map((id) => `cate:${id}`));
      this.$set(rule, 'ruleValue', parts.join(','));
    },

    openProductPicker() {
      this.productPickerVisible = true;
    },

    onProductsPicked(rows) {
      const picked = Array.isArray(rows) ? rows : [rows];
      const merged = this.blackProducts.slice();
      picked.forEach((row) => {
        if (!row || !row.id) return;
        if (!merged.some((p) => String(p.id) === String(row.id))) {
          merged.push({ id: row.id, name: row.name });
        }
      });
      this.blackProducts = merged;
      this.productPickerVisible = false;
      this.syncBlacklistValue();
    },

    removeBlackProduct(id) {
      this.blackProducts = this.blackProducts.filter((p) => String(p.id) !== String(id));
      this.syncBlacklistValue();
    },

    onSaveFilters() {
      this.syncBlacklistValue();
      this.saving = true;
      const payload = this.view.filterRules.map((r) => ({
        ruleCode: r.ruleCode,
        enabled: r.enabled,
        ruleValue: r.ruleValue,
      }));
      saveFilterRules(payload)
        .then((res) => this.applyResult(res))
        .catch(this.onError);
    },

    onSaveScenes() {
      this.saving = true;
      const payload = this.view.scenes.map((s) => ({
        sceneCode: s.sceneCode,
        enabled: s.enabled,
        showCount: s.showCount,
        abEnabled: s.abEnabled,
      }));
      saveScenes(payload)
        .then((res) => this.applyResult(res))
        .catch(this.onError);
    },

    onSaveSetting() {
      this.saving = true;
      saveSetting({ coldStartMode: this.view.coldStartMode })
        .then((res) => this.applyResult(res))
        .catch(this.onError);
    },

    onPublish() {
      publishConfig().then(() => {
        this.$message.success('已重新下发到推荐引擎');
        this.reload();
      });
    },

    // 负反馈动作只能选减少类档位，跟后端的校验保持一致
    levelOptionsOf(row) {
      return row.negative ? this.view.negativeLevelOptions : this.view.levelOptions;
    },

    // 只有曝光、停留这类动作才需要「看够几秒才算」
    supportThreshold(row) {
      return row.actionType === 'view' || row.actionType === 'stay';
    },

    // 规则名称里的 N 是可选参数，拆成前后两段把下拉框嵌进句子中间
    ruleNameBefore(rule) {
      const idx = rule.ruleName.indexOf('N');
      return idx < 0 ? rule.ruleName : rule.ruleName.substring(0, idx);
    },

    ruleNameAfter(rule) {
      const idx = rule.ruleName.indexOf('N');
      return idx < 0 ? '' : rule.ruleName.substring(idx + 1);
    },

    ruleValueOptions(rule) {
      return rule.valueOptions ? rule.valueOptions.split(',').filter((v) => v) : [];
    },

    abDays(startTime) {
      const start = new Date(String(startTime).replace(/-/g, '/')).getTime();
      if (!start) return 0;
      return Math.max(0, Math.floor((Date.now() - start) / 86400000));
    },
  },
};
</script>

<style lang="scss" scoped>
.rec-config {
  .page-header {
    margin-bottom: 16px;
  }
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #1f2329;
  }
  .page-sub {
    font-size: 13px;
    color: #86909c;
    margin-top: 4px;
  }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 15px;
    font-weight: 500;
  }
  .card-head-tip {
    font-size: 12px;
    color: #86909c;
    font-weight: 400;
  }

  /* 整体风格模板 */
  .preset {
    border: 2px solid #e5e6eb;
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: 0.15s;
    height: 100%;
    &:hover {
      border-color: #a3c4ff;
    }
    &.on {
      border-color: #1890ff;
      background: #f7faff;
    }
  }
  .preset-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .preset-pick {
    float: right;
    color: #1890ff;
    font-size: 13px;
  }
  .preset-desc {
    font-size: 12.5px;
    color: #86909c;
    line-height: 1.6;
  }
  .preset-custom-tip {
    margin-top: 12px;
    font-size: 12.5px;
    color: #d46b08;
  }

  /* 顾客动作明细 */
  .brow {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid #f2f3f5;
    &:last-child {
      border-bottom: none;
    }
  }
  .brow-head {
    padding: 0 0 8px;
    font-size: 12px;
    color: #a9aeb8;
    border-bottom: 1px solid #e5e6eb;
  }
  .bcol-switch {
    width: 50px;
    flex-shrink: 0;
  }
  .bcol-main {
    flex: 1;
    min-width: 200px;
  }
  .bcol-level {
    flex-shrink: 0;
  }
  .bcol-memo {
    width: 150px;
    flex-shrink: 0;
  }
  .bicon {
    margin-right: 4px;
  }
  .bname {
    font-size: 14px;
    color: #1f2329;
  }
  .bhelp {
    font-size: 12.5px;
    color: #86909c;
    margin-top: 2px;
  }
  .threshold-select {
    width: 90px;
    margin: 0 4px;
  }

  /* 过滤规则 */
  .rule-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 15px 0;
    border-bottom: 1px solid #f2f3f5;
    &:last-child {
      border-bottom: none;
    }
  }
  .rule-body {
    flex: 1;
  }
  .rule-name {
    font-size: 14px;
    color: #1f2329;
  }
  .rule-desc {
    font-size: 12.5px;
    color: #86909c;
    margin-top: 3px;
  }
  .rule-select {
    width: 90px;
    margin: 0 4px;
  }

  /* 顾客试算 */
  .preview-bar {
    display: flex;
    align-items: center;
  }
  .preview-goods {
    display: flex;
    align-items: center;
  }
  .preview-img {
    width: 36px;
    height: 36px;
    border-radius: 3px;
    margin-right: 8px;
    flex-shrink: 0;
  }
  .preview-name {
    font-size: 13px;
    color: #1f2329;
  }

  /* 黑名单编辑区 */
  .black-box {
    margin-top: 10px;
    padding: 10px 12px;
    background: #fafbfc;
    border: 1px solid #ebeef5;
    border-radius: 4px;
  }
  .black-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
  .black-label {
    width: 62px;
    font-size: 13px;
    color: #4e5969;
  }
  .black-cascader {
    width: 320px;
    margin-right: 10px;
  }
  .black-tag {
    margin: 3px 0 3px 6px;
  }
  .black-empty {
    margin-left: 10px;
    font-size: 12.5px;
    color: #a8abb2;
  }

  /* 推荐位 */
  .scene-name {
    font-size: 14px;
  }
  .scene-desc {
    font-size: 12.5px;
    color: #86909c;
  }
  .ab-days {
    font-size: 12px;
    color: #d46b08;
    margin-left: 8px;
  }

  .foot-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid #f2f3f5;
  }
  .foot-tip {
    margin-right: auto;
    font-size: 12.5px;
    color: #86909c;
  }
}
</style>
