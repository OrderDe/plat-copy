<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <div class="container">
        <el-form :inline="true" :model="tableFrom" size="small" @submit.native.prevent>
          <el-form-item label="页面名称：">
            <el-input
              v-model="tableFrom.title"
              placeholder="请输入页面名称"
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
          <el-form-item>
            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
            <el-button size="small" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="mb20">
        <el-button type="primary" size="small" v-hasPermi="['platform:qdiy:page:save']" @click="handleAdd">
          新建页面
        </el-button>
      </div>

      <el-table v-loading="listLoading" :data="tableData.data" size="small">
        <el-table-column label="封面" min-width="90">
          <template slot-scope="scope">
            <div class="demo-image__preview">
              <el-image v-if="scope.row.cover" :src="scope.row.cover" :preview-src-list="[scope.row.cover]" />
              <span v-else>-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="页面名称" min-width="150">
          <template slot-scope="scope">
            <span>{{ scope.row.title }}</span>
            <el-tag v-if="scope.row.isHomePage === 1" type="danger" size="mini" class="ml10">首页</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="templateName" label="页面类型" min-width="110" />
        <el-table-column label="底部导航" min-width="100">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.isShowBottomNav"
              :active-value="1"
              :inactive-value="0"
              :disabled="!checkPermi(['platform:qdiy:page:setshownav'])"
              @change="handleShowNavChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="150" />
        <el-table-column label="操作" min-width="260" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" v-hasPermi="['platform:qdiy:page:info']" @click="handleEdit(scope.row)">
              装修
            </el-button>
            <el-button type="text" size="small" v-hasPermi="['platform:qdiy:page:copy']" @click="handleCopy(scope.row)">
              复制页面
            </el-button>
            <el-button type="text" size="small" @click="handleCopyLink(scope.row)">复制链接</el-button>
            <el-button type="text" size="small" @click="handleQrcode(scope.row)">二维码</el-button>
            <el-button
              v-if="scope.row.isHomePage !== 1 && scope.row.type !== 3"
              type="text"
              size="small"
              v-hasPermi="['platform:qdiy:page:sethome']"
              @click="handleSetHome(scope.row)"
            >
              设为首页
            </el-button>
            <el-button
              v-if="scope.row.isHomePage !== 1"
              type="text"
              size="small"
              v-hasPermi="['platform:qdiy:page:delete']"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 新建页面 -->
    <el-dialog title="新建页面" :visible.sync="dialogVisible" width="500px" :close-on-click-modal="false">
      <el-form ref="pageForm" :model="pageForm" :rules="pageRules" label-width="90px" size="small">
        <el-form-item label="页面名称" prop="title">
          <el-input v-model="pageForm.title" placeholder="请输入页面名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="页面类型" prop="template">
          <el-select v-model="pageForm.template" placeholder="请选择页面类型" style="width: 100%">
            <el-option v-for="item in templateOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="底部导航">
          <el-switch v-model="pageForm.isShowBottomNav" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleSubmit">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 二维码 -->
    <el-dialog title="页面二维码" :visible.sync="qrcodeVisible" width="360px">
      <div class="qrcode-box">
        <div ref="qrcodeRef" class="qrcode" />
        <div class="qrcode-url">{{ currentUrl }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  qdiyPageListApi,
  qdiyPageSaveApi,
  qdiyPageDeleteApi,
  qdiyPageCopyApi,
  qdiyPageSetHomeApi,
  qdiyPageSetShowNavApi,
} from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

export default {
  name: 'QDiyPage',
  data() {
    return {
      listLoading: false,
      submitLoading: false,
      dialogVisible: false,
      qrcodeVisible: false,
      currentUrl: '',
      tableData: { data: [], total: 0 },
      tableFrom: { page: 1, limit: 20, title: '', template: '' },
      templateOptions: [
        { label: '系统首页', value: 'home_page' },
        { label: '商品详情', value: 'goods_detail' },
        { label: '用户中心', value: 'user_center' },
        { label: '自定义页面', value: 'custom_page' },
        { label: '商品模板', value: 'goods_template' },
      ],
      pageForm: { title: '', template: 'custom_page', isShowBottomNav: 0 },
      pageRules: {
        title: [{ required: true, message: '请输入页面名称', trigger: 'blur' }],
        template: [{ required: true, message: '请选择页面类型', trigger: 'change' }],
      },
    };
  },
  mounted() {
    if (checkPermi(['platform:qdiy:page:list'])) this.getList();
  },
  methods: {
    checkPermi,
    getList() {
      this.listLoading = true;
      qdiyPageListApi(this.tableFrom)
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
    handleReset() {
      this.tableFrom = { page: 1, limit: this.tableFrom.limit, title: '', template: '' };
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
      this.pageForm = { title: '', template: 'custom_page', isShowBottomNav: 0 };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.pageForm && this.$refs.pageForm.clearValidate());
    },
    handleSubmit() {
      this.$refs.pageForm.validate((valid) => {
        if (!valid) return;
        this.submitLoading = true;
        qdiyPageSaveApi(this.pageForm)
          .then((res) => {
            this.submitLoading = false;
            this.dialogVisible = false;
            this.$message.success('创建成功');
            // 创建后直接进入编辑器
            this.$router.push({ path: `/qdiy/editor/${res.id}` });
          })
          .catch(() => {
            this.submitLoading = false;
          });
      });
    },
    handleEdit(row) {
      this.$router.push({ path: `/qdiy/editor/${row.id}` });
    },
    handleCopy(row) {
      this.$confirm(`确定复制页面「${row.title}」吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyPageCopyApi(row.id).then(() => {
          this.$message.success('复制成功');
          this.getList();
        });
      });
    },
    handleCopyLink(row) {
      if (!row.webUrl) {
        this.$message.warning('未获取到页面链接，请先在【设置 - 应用设置】中配置 H5 地址');
        return;
      }
      const input = document.createElement('input');
      input.value = row.webUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.$message.success('链接已复制');
    },
    handleQrcode(row) {
      if (!row.webUrl) {
        this.$message.warning('未获取到页面链接，请先在【设置 - 应用设置】中配置 H5 地址');
        return;
      }
      this.currentUrl = row.webUrl;
      this.qrcodeVisible = true;
      this.$nextTick(() => {
        const box = this.$refs.qrcodeRef;
        if (!box) return;
        box.innerHTML = '';
        // 项目已全局引入 qrcodejs2，此处按需加载避免首屏体积
        import('qrcodejs2').then(({ default: QRCode }) => {
          new QRCode(box, { text: this.currentUrl, width: 200, height: 200 });
        });
      });
    },
    handleSetHome(row) {
      this.$confirm(`确定将「${row.title}」设为商城首页吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyPageSetHomeApi(row.id).then(() => {
          this.$message.success('设置成功');
          this.getList();
        });
      });
    },
    handleShowNavChange(row) {
      qdiyPageSetShowNavApi({ id: row.id, isShowBottomNav: row.isShowBottomNav })
        .then(() => {
          this.$message.success('设置成功');
        })
        .catch(() => {
          // 失败回滚开关状态
          row.isShowBottomNav = row.isShowBottomNav === 1 ? 0 : 1;
        });
    },
    handleDelete(row) {
      this.$confirm(`确定删除页面「${row.title}」吗？`, '提示', { type: 'warning' }).then(() => {
        qdiyPageDeleteApi(row.id).then(() => {
          this.$message.success('删除成功');
          this.getList();
        });
      });
    },
  },
};
</script>

<style scoped lang="scss">
.demo-image__preview {
  ::v-deep .el-image {
    width: 36px;
    height: 36px;
  }
}
.ml10 {
  margin-left: 10px;
}
.mb20 {
  margin-bottom: 20px;
}
.qrcode-box {
  text-align: center;
  .qrcode {
    display: inline-block;
  }
  .qrcode-url {
    margin-top: 12px;
    font-size: 12px;
    color: #999;
    word-break: break-all;
  }
}
</style>
