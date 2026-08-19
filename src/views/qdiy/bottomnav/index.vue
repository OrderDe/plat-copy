<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false" v-loading="listLoading">
      <div class="nav-wrap">
        <!-- 左侧：手机预览，底部标签栏跟着右侧配色实时变 -->
        <div class="phone">
          <div class="phone-body" />
          <div class="phone-tabbar" :style="{ background: form.bottomBackgroundColor }">
            <div
              v-for="(item, index) in visibleNavs"
              :key="index"
              class="tab-item"
              :style="{ color: index === 0 ? form.activeColor : form.inactiveColor }"
            >
              <img v-if="index === 0 ? item.selectedIconPath : item.iconPath" :src="index === 0 ? item.selectedIconPath : item.iconPath" class="tab-icon" />
              <i v-else class="el-icon-picture-outline tab-icon-font" />
              <div class="tab-text">{{ item.text || '未命名' }}</div>
            </div>
            <div v-if="!visibleNavs.length" class="tab-empty">暂无导航项</div>
          </div>
        </div>

        <!-- 右侧：底部标签栏配置 -->
        <div class="setting">
          <div class="setting-title">底部标签栏</div>
          <el-form :model="form" label-width="110px" size="small">
            <el-form-item label="背景颜色" required>
              <el-color-picker v-model="form.bottomBackgroundColor" color-format="hex" />
            </el-form-item>
            <el-form-item label="文字颜色" required>
              <el-color-picker v-model="form.inactiveColor" color-format="hex" />
            </el-form-item>
            <el-form-item label="选中文字颜色" required>
              <el-color-picker v-model="form.activeColor" color-format="hex" />
            </el-form-item>

            <el-form-item label="底部导航图标">
              <div class="icon-list">
                <div v-for="(item, index) in form.list" :key="index" class="icon-card" @click="handleEdit(index)">
                  <img v-if="item.iconPath" :src="item.iconPath" class="card-icon" />
                  <i v-else class="el-icon-picture-outline card-icon-font" />
                  <div class="card-text">{{ item.text || '未命名' }}</div>
                  <i class="el-icon-close card-remove" @click.stop="handleRemove(index)" />
                </div>
                <div v-if="form.list.length < 5" class="icon-card add" @click="handleAdd">
                  <i class="el-icon-plus" />
                </div>
              </div>
              <div class="tips">最多配置 5 项，点击卡片可编辑，拖动排序请在编辑弹窗里调整排序值。</div>
            </el-form-item>
          </el-form>

          <div class="ops">
            <el-button type="primary" size="small" :loading="submitLoading" v-hasPermi="['platform:qdiy:nav:save']" @click="handleSave">
              保存
            </el-button>
            <el-button size="small" :loading="submitLoading" @click="handleRestore">恢复默认</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 导航菜单编辑 -->
    <el-dialog title="导航菜单编辑" :visible.sync="dialogVisible" width="620px" :close-on-click-modal="false">
      <div class="dialog-tip">建议尺寸 64*64</div>
      <el-form ref="navForm" :model="navForm" :rules="navRules" label-width="110px" size="small">
        <el-form-item label="图标" required>
          <div class="upload-box" @click="handleSelectIcon('iconPath')">
            <img v-if="navForm.iconPath" :src="navForm.iconPath" class="pic" />
            <i v-else class="el-icon-picture-outline" />
          </div>
        </el-form-item>
        <el-form-item label="选择状态图标" required>
          <div class="upload-box" @click="handleSelectIcon('selectedIconPath')">
            <img v-if="navForm.selectedIconPath" :src="navForm.selectedIconPath" class="pic" />
            <i v-else class="el-icon-picture-outline" />
          </div>
        </el-form-item>
        <el-form-item label="显示" required>
          <el-switch v-model="navForm.isShow" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="名称" prop="text">
          <el-input v-model="navForm.text" placeholder="请输入导航文字" maxlength="6" show-word-limit />
        </el-form-item>
        <el-form-item label="导航链接" prop="url">
          <el-input v-model="navForm.url" placeholder="如 /pages/index/index" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model.number="navForm.sort" :min="0" controls-position="right" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" @click="handleDialogSubmit">提 交</el-button>
      </span>
    </el-dialog>

    <el-dialog title="选择图标" :visible.sync="uploadVisible" width="960px" :close-on-click-modal="false" append-to-body>
      <uploadPictures v-if="uploadVisible" :multiple="false" @getImage="handleGetImage" />
    </el-dialog>
  </div>
</template>

<script>
import uploadPictures from '@/components/base/uploadPicture';
import { qdiyNavListApi, qdiyNavSaveApi } from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

// 与后端 QdiyNavServiceImpl 的默认配色保持一致
const DEFAULT_COLORS = {
  bottomBackgroundColor: '#FFFFFF',
  inactiveColor: '#666666',
  activeColor: '#F54B4A',
};

function emptyNav() {
  return { text: '', iconPath: '', selectedIconPath: '', url: '', openType: 'page', params: '', isShow: 1, sort: 0 };
}

export default {
  name: 'QDiyBottomNav',
  components: { uploadPictures },
  data() {
    return {
      listLoading: false,
      submitLoading: false,
      dialogVisible: false,
      uploadVisible: false,
      form: { ...DEFAULT_COLORS, list: [] },
      navForm: emptyNav(),
      // 当前编辑的是第几项，-1 表示新增
      editIndex: -1,
      // 弹窗里正在选的是哪个图标字段
      currentField: 'iconPath',
      navRules: {
        text: [{ required: true, message: '请输入导航文字', trigger: 'blur' }],
        url: [{ required: true, message: '请输入导航链接', trigger: 'blur' }],
      },
    };
  },
  computed: {
    // 预览只展示勾了「显示」的项
    visibleNavs() {
      return (this.form.list || []).filter((e) => e.isShow !== 0);
    },
  },
  mounted() {
    if (checkPermi(['platform:qdiy:nav:list'])) this.getConfig();
  },
  methods: {
    getConfig() {
      this.listLoading = true;
      qdiyNavListApi()
        .then((res) => {
          const data = res || {};
          this.form = {
            bottomBackgroundColor: data.bottomBackgroundColor || DEFAULT_COLORS.bottomBackgroundColor,
            inactiveColor: data.inactiveColor || DEFAULT_COLORS.inactiveColor,
            activeColor: data.activeColor || DEFAULT_COLORS.activeColor,
            list: data.list || [],
          };
          this.listLoading = false;
        })
        .catch(() => {
          this.listLoading = false;
        });
    },
    handleAdd() {
      if (this.form.list.length >= 5) return;
      this.editIndex = -1;
      this.navForm = emptyNav();
      this.navForm.sort = this.form.list.length;
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.navForm && this.$refs.navForm.clearValidate());
    },
    handleEdit(index) {
      this.editIndex = index;
      this.navForm = { ...emptyNav(), ...this.form.list[index] };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.navForm && this.$refs.navForm.clearValidate());
    },
    handleRemove(index) {
      this.form.list.splice(index, 1);
    },
    handleSelectIcon(field) {
      this.currentField = field;
      this.uploadVisible = true;
    },
    handleGetImage(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url) this.$set(this.navForm, this.currentField, url);
      this.uploadVisible = false;
    },
    handleDialogSubmit() {
      this.$refs.navForm.validate((valid) => {
        if (!valid) return;
        const item = { ...this.navForm };
        if (this.editIndex >= 0) {
          this.$set(this.form.list, this.editIndex, item);
        } else {
          this.form.list.push(item);
        }
        // 按排序值重排，保持预览顺序和保存顺序一致
        this.form.list.sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
        this.dialogVisible = false;
      });
    },
    handleSave() {
      if (!this.form.list.length) {
        this.$message.warning('请至少添加一项底部导航');
        return;
      }
      if (this.form.list.some((e) => !e.text)) {
        this.$message.warning('导航文字不能为空');
        return;
      }
      this.submitLoading = true;
      qdiyNavSaveApi(this.form)
        .then(() => {
          this.submitLoading = false;
          this.$message.success('保存成功');
          this.getConfig();
        })
        .catch(() => {
          this.submitLoading = false;
        });
    },
    handleRestore() {
      this.$confirm('确定恢复成默认的四项导航吗？当前配置将被覆盖。', '提示', { type: 'warning' }).then(() => {
        this.submitLoading = true;
        // 恢复默认交给后端处理，前端不用凑数据
        qdiyNavSaveApi({ ...this.form, recoverDefault: true })
          .then(() => {
            this.submitLoading = false;
            this.$message.success('已恢复默认');
            this.getConfig();
          })
          .catch(() => {
            this.submitLoading = false;
          });
      });
    },
  },
};
</script>

<style scoped lang="scss">
.nav-wrap {
  display: flex;
  flex-wrap: wrap;
}

.phone {
  width: 380px;
  height: 620px;
  margin-right: 30px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  .phone-body {
    flex: 1;
  }
  .phone-tabbar {
    display: flex;
    align-items: center;
    height: 56px;
    border-top: 1px solid #f0f0f0;
  }
  .tab-item {
    flex: 1;
    text-align: center;
    font-size: 12px;
  }
  .tab-icon {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }
  .tab-icon-font {
    font-size: 20px;
  }
  .tab-text {
    margin-top: 2px;
  }
  .tab-empty {
    flex: 1;
    text-align: center;
    color: #bbb;
    font-size: 12px;
  }
}

.setting {
  flex: 1;
  min-width: 480px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px 20px;
  .setting-title {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 20px;
  }
}

.icon-list {
  display: flex;
  flex-wrap: wrap;
}
.icon-card {
  position: relative;
  width: 80px;
  height: 70px;
  margin: 0 10px 10px 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    border-color: #409eff;
    .card-remove {
      display: block;
    }
  }
  &.add {
    border-style: dashed;
    color: #c0c4cc;
    font-size: 20px;
  }
  .card-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
  .card-icon-font {
    font-size: 22px;
    color: #c0c4cc;
  }
  .card-text {
    margin-top: 4px;
    font-size: 12px;
    color: #606266;
  }
  .card-remove {
    display: none;
    position: absolute;
    top: -6px;
    right: -6px;
    width: 16px;
    height: 16px;
    line-height: 16px;
    text-align: center;
    font-size: 12px;
    color: #fff;
    background: #f56c6c;
    border-radius: 50%;
  }
}

.tips {
  font-size: 12px;
  color: #999;
  line-height: 20px;
}
.ops {
  margin-top: 10px;
  padding-left: 110px;
}
.dialog-tip {
  display: inline-block;
  margin: 0 0 12px 110px;
  padding: 4px 10px;
  background: #f2f2f2;
  border-radius: 3px;
  font-size: 12px;
  color: #666;
}
.upload-box {
  width: 76px;
  height: 76px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c0c4cc;
  font-size: 22px;
  .pic {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
