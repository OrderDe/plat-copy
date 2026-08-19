<template>
  <div class="divBox">
    <el-card class="box-card" shadow="never" :bordered="false">
      <el-tabs v-model="activeGroup" @tab-click="handleTabChange">
        <!--
          全局配置严格对齐 qimall 的 backend/modules/mall/views/decorate/setting.php：
          该页只有「全局文字颜色」和「按需DIY」两项，右侧是随颜色实时变化的三张预览图
        -->
        <el-tab-pane label="全局配置" name="global">
          <div class="global-wrap">
            <el-form :model="globalForm" label-width="110px" size="small" class="global-form">
              <el-form-item label="全局文字颜色">
                <el-color-picker v-model="globalForm.globalTextColor" color-format="hex" :predefine="predefineColors" />
                <div class="theme-list">
                  <div
                    v-for="item in themeStyleList"
                    :key="item"
                    class="theme-color"
                    :class="{ active: globalForm.globalTextColor === item }"
                    :style="{ background: item }"
                    @click="changeTheme(item)"
                  />
                </div>
                <div class="tips">建议：自定义风格不要设置成白色！</div>
              </el-form-item>

              <el-form-item label="按需DIY">
                <el-switch v-model="globalForm.globalGoodsNeed" :active-value="1" :inactive-value="0" />
              </el-form-item>
            </el-form>

            <!-- 预览区：商品详情 / SKU 弹层 / 我的订单 -->
            <div class="preview-row">
              <div class="phone">
                <div class="phone-bar">商品详情</div>
                <div class="phone-body">
                  <div class="goods-price" :style="{ color: color }">
                    <span class="cur">&yen;2899</span>
                    <span class="ori">&yen;3000.00</span>
                  </div>
                  <div class="goods-name">网易严选电脑工作台</div>
                  <div class="coupon" :style="{ color: color }">领券 满10减1</div>
                  <div class="phone-foot">
                    <div class="btn-left" :style="{ color: color, border: '1px solid ' + color }">加入购物车</div>
                    <div class="btn-right" :style="{ background: color }">立即购买</div>
                  </div>
                </div>
              </div>

              <div class="phone">
                <div class="phone-bar">商品详情</div>
                <div class="phone-body">
                  <div class="sku-price" :style="{ color: color }">&yen;2988.00</div>
                  <div class="sku-label">颜色</div>
                  <div class="sku-item" :style="{ color: color, border: '1px solid ' + color }">黑色</div>
                  <div class="sku-label">数量</div>
                  <div class="sku-num">- 1 +</div>
                  <div class="sure-btn" :style="{ background: color }">确定</div>
                </div>
              </div>

              <div class="phone">
                <div class="phone-bar">我的订单</div>
                <div class="phone-body">
                  <div class="tabs">
                    <span>全部</span>
                    <span class="tab-active" :style="{ color: color }">
                      待付款
                      <i class="tab-line" :style="{ background: color }" />
                    </span>
                    <span>待发货</span>
                    <span>待收货</span>
                    <span>待评价</span>
                  </div>
                  <div class="empty-order">目前没有订单哦~</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="悬浮按钮" name="float_button">
          <el-form :model="floatForm" label-width="130px" size="small" style="max-width: 640px">
            <el-form-item label="是否开启">
              <el-switch v-model="floatForm.enable" active-value="1" inactive-value="0" />
            </el-form-item>
            <el-form-item label="按钮图标">
              <div class="upload-box" @click="uploadVisible = true">
                <img v-if="floatForm.icon" :src="floatForm.icon" class="pic" />
                <i v-else class="el-icon-plus" />
              </div>
            </el-form-item>
            <el-form-item label="跳转链接">
              <el-input v-model="floatForm.url" placeholder="如 /pages/index/index" />
            </el-form-item>
            <el-form-item label="显示位置">
              <el-radio-group v-model="floatForm.position">
                <el-radio label="left">左下角</el-radio>
                <el-radio label="right">右下角</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="距底部距离">
              <el-input-number v-model.number="floatForm.bottom" :min="0" :max="500" controls-position="right" />
              <span class="unit">px</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="mt20">
        <el-button type="primary" size="small" :loading="submitLoading" v-hasPermi="['platform:qdiy:setting:save']" @click="handleSave">
          保存
        </el-button>
        <el-button size="small" :loading="submitLoading" @click="restoreDefault">恢复默认</el-button>
      </div>
    </el-card>

    <el-dialog title="选择图标" :visible.sync="uploadVisible" width="960px" :close-on-click-modal="false">
      <uploadPictures v-if="uploadVisible" :multiple="false" @getImage="handleGetImage" />
    </el-dialog>
  </div>
</template>

<script>
import uploadPictures from '@/components/base/uploadPicture';
import { qdiySettingInfoApi, qdiySettingSaveApi } from '@/api/qdiy';
import { checkPermi } from '@/utils/permission';

// 与 qimall setting.php 的 default_setting 保持一致
const GLOBAL_DEFAULT = { globalTextColor: '#F54B4A', globalGoodsNeed: 0 };
const FLOAT_DEFAULT = { enable: '0', icon: '', url: '', position: 'right', bottom: 100 };

export default {
  name: 'QDiySetting',
  components: { uploadPictures },
  data() {
    return {
      activeGroup: 'global',
      submitLoading: false,
      uploadVisible: false,
      // qimall 的 predefineColors / themeStyleList 是同一组色值
      predefineColors: ['#F54B4A', '#4985E9', '#AA4DF1', '#1EB83D', '#FF508C'],
      themeStyleList: ['#F54B4A', '#4985E9', '#AA4DF1', '#1EB83D', '#FF508C'],
      globalForm: { ...GLOBAL_DEFAULT },
      floatForm: { ...FLOAT_DEFAULT },
    };
  },
  computed: {
    // 预览区统一取色，避免颜色为空时预览整片变黑
    color() {
      return this.globalForm.globalTextColor || GLOBAL_DEFAULT.globalTextColor;
    },
  },
  mounted() {
    if (checkPermi(['platform:qdiy:setting:info'])) this.getSetting();
  },
  methods: {
    getSetting() {
      qdiySettingInfoApi({ group: this.activeGroup }).then((res) => {
        const data = res || {};
        if (this.activeGroup === 'global') {
          if (data.globalTextColor) this.globalForm.globalTextColor = data.globalTextColor;
          // 后端存的是字符串，开关要的是数字
          if (data.globalGoodsNeed !== undefined) this.globalForm.globalGoodsNeed = Number(data.globalGoodsNeed);
        } else {
          Object.keys(this.floatForm).forEach((key) => {
            if (data[key] === undefined) return;
            this.floatForm[key] = key === 'bottom' ? Number(data[key]) : data[key];
          });
        }
      });
    },
    handleTabChange() {
      this.getSetting();
    },
    changeTheme(theme) {
      this.globalForm.globalTextColor = theme;
    },
    restoreDefault() {
      if (this.activeGroup === 'global') {
        this.globalForm = { ...GLOBAL_DEFAULT };
      } else {
        this.floatForm = { ...FLOAT_DEFAULT };
      }
      this.$message.info('已恢复默认，点击保存后生效');
    },
    handleGetImage(img) {
      const url = Array.isArray(img) ? img[0] && (img[0].sattDir || img[0]) : img;
      if (url) this.floatForm.icon = url;
      this.uploadVisible = false;
    },
    handleSave() {
      const source = this.activeGroup === 'global' ? this.globalForm : this.floatForm;
      // 后端 values 是 Map<String,String>，统一转成字符串
      const values = {};
      Object.keys(source).forEach((key) => {
        values[key] = source[key] === null || source[key] === undefined ? '' : String(source[key]);
      });
      this.submitLoading = true;
      qdiySettingSaveApi({ group: this.activeGroup, values })
        .then(() => {
          this.submitLoading = false;
          this.$message.success('保存成功');
        })
        .catch(() => {
          this.submitLoading = false;
        });
    },
  },
};
</script>

<style scoped lang="scss">
.mt20 {
  margin-top: 20px;
}
.unit {
  margin-left: 8px;
  color: #999;
}
.upload-box {
  width: 60px;
  height: 60px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c0c4cc;
  .pic {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.global-form {
  max-width: 720px;
}
.theme-list {
  display: inline-flex;
  align-items: center;
  margin-left: 12px;
  vertical-align: middle;
  .theme-color {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    border-radius: 3px;
    cursor: pointer;
    border: 2px solid transparent;
    &.active {
      border-color: #333;
    }
  }
}
.tips {
  display: inline-block;
  margin-left: 12px;
  color: #999;
  font-size: 12px;
}

.preview-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20px;
}
.phone {
  width: 280px;
  min-height: 420px;
  margin: 0 20px 20px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  .phone-bar {
    height: 36px;
    line-height: 36px;
    padding: 0 12px;
    font-size: 13px;
    border-bottom: 1px solid #f2f2f2;
  }
  .phone-body {
    padding: 12px;
    font-size: 12px;
  }
}
.goods-price {
  .cur {
    font-size: 20px;
    font-weight: 600;
  }
  .ori {
    margin-left: 6px;
    color: #999;
    text-decoration: line-through;
    font-size: 12px;
  }
}
.goods-name {
  margin: 10px 0;
  font-size: 14px;
  color: #333;
}
.coupon {
  margin-bottom: 16px;
}
.phone-foot {
  display: flex;
  margin-top: 40px;
  .btn-left,
  .btn-right {
    flex: 1;
    height: 32px;
    line-height: 32px;
    text-align: center;
    border-radius: 16px;
  }
  .btn-left {
    margin-right: 8px;
    background: #fff;
  }
  .btn-right {
    color: #fff;
  }
}
.sku-price {
  font-size: 20px;
  font-weight: 600;
}
.sku-label {
  margin: 14px 0 8px;
  color: #666;
}
.sku-item {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 3px;
}
.sku-num {
  color: #333;
}
.sure-btn {
  margin-top: 40px;
  height: 34px;
  line-height: 34px;
  text-align: center;
  color: #fff;
  border-radius: 17px;
}
.tabs {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #f2f2f2;
  padding-bottom: 8px;
  color: #666;
  .tab-active {
    position: relative;
    .tab-line {
      position: absolute;
      left: 50%;
      bottom: -8px;
      width: 18px;
      height: 2px;
      transform: translateX(-50%);
    }
  }
}
.empty-order {
  margin-top: 100px;
  text-align: center;
  color: #999;
}
</style>
