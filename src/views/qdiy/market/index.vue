<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="container">
        <el-form :inline="true" size="small" @submit.native.prevent>
          <el-form-item label="模板名称：">
            <el-input
              v-model="tableFrom.title"
              placeholder="请输入模板名称"
              clearable
              style="width: 200px"
              @keyup.enter.native="handleSearch"
            />
          </el-form-item>
          <el-form-item label="页面类型：">
            <el-select v-model="tableFrom.template" placeholder="全部" clearable style="width: 160px">
              <el-option v-for="item in templateOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <!-- 平台自己维护模板库：下架的也要能查出来，否则一下架就再也找不回来 -->
          <el-form-item label="上架状态：">
            <el-select v-model="tableFrom.isOnSale" placeholder="全部" clearable style="width: 120px">
              <el-option label="已上架" :value="1" />
              <el-option label="未上架" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['platform:qdiy:market:save']"
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="handleAdd"
            >
              新增模板
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="listLoading" class="template-grid">
        <div v-for="item in tableData.data" :key="item.id" class="template-card">
          <div class="cover">
            <el-image v-if="item.cover" :src="item.cover" fit="cover" :preview-src-list="[item.cover]" />
            <div v-else class="no-cover">暂无预览图</div>
            <el-tag v-if="item.isOnSale !== 1" class="off-sale" size="mini" type="info">未上架</el-tag>
          </div>
          <div class="info">
            <div class="title" :title="item.title">{{ item.title }}</div>
            <div class="meta">{{ templateName(item.template) }}<span v-if="item.cateName"> · {{ item.cateName }}</span></div>
          </div>
          <div class="ops">
            <el-button
              v-hasPermi="['platform:qdiy:market:receive']"
              type="text"
              size="small"
              :disabled="item.isOnSale !== 1"
              @click="handleReceive(item)"
            >
              领取
            </el-button>
            <el-button v-hasPermi="['platform:qdiy:market:save']" type="text" size="small" @click="handleEdit(item)">
              编辑
            </el-button>
            <el-button v-hasPermi="['platform:qdiy:market:save']" type="text" size="small" @click="handleDecorate(item)">
              装修
            </el-button>
            <el-button v-hasPermi="['platform:qdiy:market:save']" type="text" size="small" @click="handleOnSale(item)">
              {{ item.isOnSale === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button
              v-hasPermi="['platform:qdiy:market:delete']"
              type="text"
              size="small"
              class="danger-text"
              @click="handleDelete(item)"
            >
              删除
            </el-button>
          </div>
        </div>
        <div v-if="!listLoading && !tableData.data.length" class="empty">暂无模板</div>
      </div>

      <div class="block">
        <el-pagination
          background
          :page-sizes="[20, 40, 60, 80]"
          :page-size="tableFrom.limit"
          :current-page="tableFrom.page"
          layout="total, sizes, prev, pager, next, jumper"
          :total="tableData.total"
          @current-change="pageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      :title="templateForm.id ? '编辑模板' : '新增模板'"
      :visible.sync="dialogVisible"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form ref="templateForm" :model="templateForm" :rules="templateRules" label-width="90px" size="small">
        <el-form-item label="模板名称" prop="title">
          <el-input v-model="templateForm.title" placeholder="请输入模板名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="页面类型" prop="template">
          <el-select v-model="templateForm.template" placeholder="请选择页面类型" style="width: 100%">
            <el-option v-for="item in templateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="行业分类">
          <el-input v-model="templateForm.cateName" placeholder="如：食品、美妆，用于模板市场分类展示" maxlength="20" />
        </el-form-item>
        <el-form-item label="预览图">
          <div
            class="upload-box"
            :class="{ readonly: !!templateForm.id }"
            :title="templateForm.id ? '预览图由装修内容生成' : '选择预览图'"
            @click="handleOpenCoverPicker"
          >
            <img v-if="templateForm.cover" :src="templateForm.cover" class="pic" />
            <i v-else class="el-icon-plus" />
            <span v-if="templateForm.id" class="cover-lock"><i class="el-icon-lock" /></span>
          </div>
          <span class="tip-text" style="margin-left: 0">也可在「装修」页点【生成预览图】，按模板实际内容自动截图</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model.number="templateForm.sort" :min="0" controls-position="right" />
          <span class="tip-text">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="是否上架">
          <el-switch v-model="templateForm.isOnSale" :active-value="1" :inactive-value="0" />
          <span class="tip-text">上架后商户才能在模板市场看到并领取</span>
        </el-form-item>
        <!--
          content 是几十 KB 的组件 JSON，编辑时不回填也不提交，后端按「传了才更新」处理，
          改内容走卡片上的「装修」按钮（可视化编辑器）。
          新增时可以粘贴 qimall 导出的组件 JSON，留空则先建一个空模板。
        -->
        <el-form-item v-if="templateForm.id" label="模板内容">
          <span class="tip-text" style="margin-left: 0">请在列表卡片上点「装修」进入可视化编辑器修改</span>
        </el-form-item>
        <el-form-item v-else label="模板内容">
          <el-input
            v-model="templateForm.content"
            type="textarea"
            :rows="4"
            placeholder="选填。粘贴组件 JSON，留空则先建空模板"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleSubmit">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="选择图片" :visible.sync="uploadVisible" width="960px" :close-on-click-modal="false" append-to-body>
      <uploadPictures v-if="uploadVisible" :multiple="false" @getImage="handleGetImage" />
    </el-dialog>
  </div>
</template>

<script>
import uploadPictures from '@/components/base/uploadPicture';
import {
  qdiyMarketListApi,
  qdiyMarketReceiveApi,
  qdiyMarketDetailApi,
  qdiyMarketSaveApi,
  qdiyMarketUpdateApi,
  qdiyMarketOnSaleApi,
  qdiyMarketDeleteApi,
} from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

export default {
  name: 'QDiyMarket',
  components: { uploadPictures },
  data() {
    return {
      listLoading: false,
      submitLoading: false,
      dialogVisible: false,
      uploadVisible: false,
      tableData: { data: [], total: 0 },
      tableFrom: { page: 1, limit: 20, title: '', template: '', cateId: '', isOnSale: '' },
      templateForm: this.emptyForm(),
      templateRules: {
        title: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
        template: [{ required: true, message: '请选择页面类型', trigger: 'change' }],
      },
      templateOptions: [
        { label: '系统首页', value: 'home_page' },
        { label: '商品详情', value: 'goods_detail' },
        { label: '用户中心', value: 'user_center' },
        { label: '自定义页面', value: 'custom_page' },
        { label: '商品模板', value: 'goods_template' },
      ],
    };
  },
  mounted() {
    if (checkPermi(['platform:qdiy:market:list'])) this.getList();
  },
  methods: {
    emptyForm() {
      return { id: null, title: '', template: 'custom_page', cateId: '', cateName: '', cover: '', content: '', sort: 0, isOnSale: 0 };
    },
    templateName(template) {
      const item = this.templateOptions.find((e) => e.value === template);
      return item ? item.label : template;
    },
    getList() {
      this.listLoading = true;
      qdiyMarketListApi(this.tableFrom)
        .then((res) => {
          this.tableData.data = res.list || [];
          this.tableData.total = Number(res.total) || 0;
          this.listLoading = false;
        })
        .catch(() => {
          this.listLoading = false;
        });
    },
    handleSearch() {
      this.tableFrom.page = 1;
      this.getList();
    },
    pageChange(page) {
      this.tableFrom.page = page;
      this.getList();
    },
    handleSizeChange(limit) {
      this.tableFrom.limit = limit;
      this.getList();
    },
    handleAdd() {
      this.templateForm = this.emptyForm();
      this.uploadVisible = false;
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.templateForm && this.$refs.templateForm.clearValidate());
    },
    /** 列表为省流量不返回 content，编辑前回查一次详情，避免拿半份数据去提交 */
    handleEdit(item) {
      qdiyMarketDetailApi(item.id).then((res) => {
        const data = res || item;
        this.templateForm = {
          id: data.id,
          title: data.title,
          template: data.template,
          cateId: data.cateId || '',
          cateName: data.cateName || '',
          cover: data.cover || '',
          content: '',
          sort: data.sort == null ? 0 : data.sort,
          isOnSale: data.isOnSale === 1 ? 1 : 0,
        };
        this.uploadVisible = false;
        this.dialogVisible = true;
        this.$nextTick(() => this.$refs.templateForm && this.$refs.templateForm.clearValidate());
      });
    },
    /** 模板内容用页面编辑器改：同一套组件库和画布，只是存回模板表 */
    handleDecorate(item) {
      this.$router.push({ path: `/qdiy/editor/${item.id}`, query: { type: 'market' } });
    },
    handleOpenCoverPicker() {
      if (this.templateForm.id) return;
      this.uploadVisible = true;
    },
    handleGetImage(img) {
      if (this.templateForm.id) {
        this.uploadVisible = false;
        return;
      }
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url) this.templateForm.cover = url;
      this.uploadVisible = false;
    },
    handleSubmit() {
      this.$refs.templateForm.validate((valid) => {
        if (!valid) return;
        this.submitLoading = true;
        const api = this.templateForm.id ? qdiyMarketUpdateApi : qdiyMarketSaveApi;
        api(this.templateForm)
          .then(() => {
            this.submitLoading = false;
            this.dialogVisible = false;
            this.$message.success('保存成功');
            this.getList();
          })
          .catch(() => {
            this.submitLoading = false;
          });
      });
    },
    handleOnSale(item) {
      const next = item.isOnSale === 1 ? 0 : 1;
      const action = next === 1 ? '上架' : '下架';
      this.$confirm(`确定${action}模板「${item.title}」吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyMarketOnSaleApi({ id: item.id, isOnSale: next }).then(() => {
          this.$message.success(`${action}成功`);
          this.getList();
        });
      });
    },
    handleDelete(item) {
      // 已被领取的「我的模板」是独立副本，不会跟着删，这里说明白免得以为会连带清掉商户在用的页面
      this.$confirm(`确定删除模板「${item.title}」吗？已被领取到「我的模板」的副本不受影响。`, '提示', {
        type: 'warning',
      }).then(() => {
        qdiyMarketDeleteApi(item.id).then(() => {
          this.$message.success('删除成功');
          this.getList();
        });
      });
    },
    handleReceive(item) {
      this.$confirm(`确定领取模板「${item.title}」到我的模板吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyMarketReceiveApi(item.id).then(() => {
          this.$message.success('领取成功，可在【我的模板】中使用');
        });
      });
    },
  },
};
</script>

<style scoped lang="scss">
.template-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  min-height: 200px;
}
.template-card {
  width: 200px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  .cover {
    height: 260px;
    background: #f5f7fa;
    position: relative;
    ::v-deep .el-image {
      width: 100%;
      height: 100%;
    }
    /* 预览图是整页长截图，居中裁会把顶部裁掉，从顶部裁才看得出是哪个页面 */
    ::v-deep img {
      object-position: top center;
    }
  }
  .off-sale {
    position: absolute;
    top: 6px;
    right: 6px;
  }
  .no-cover {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    font-size: 12px;
  }
  .info {
    padding: 8px 10px;
    .title {
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta {
      margin-top: 4px;
      font-size: 12px;
      color: #909399;
    }
  }
  .ops {
    padding: 0 6px 8px;
    display: flex;
    justify-content: space-between;
    ::v-deep .el-button {
      padding: 0 2px;
    }
  }
  .danger-text {
    color: #f56c6c;
  }
}
.tip-text {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
.upload-box {
  width: 80px;
  height: 80px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c0c4cc;
  position: relative;
  overflow: hidden;
  &.readonly {
    cursor: default;
    border-style: solid;
    background: #f5f7fa;
  }
  .pic {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
.cover-lock {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 22px;
  height: 22px;
  border-radius: 3px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  line-height: 22px;
  text-align: center;
  font-size: 12px;
}
.empty {
  width: 100%;
  text-align: center;
  color: #909399;
  padding: 60px 0;
}
</style>
