<template>
  <div class="diy-goods-comment">
    <div class="comment-list" :style="commentBoxStyle">
      <div class="comment-header">
        <div class="comment-header-left">
          <span class="title">商品评价</span>
          <span>(255)</span>
        </div>
        <div class="comment-header-right">
          <div>满意度<span class="satisfaction">100%</span></div>
          <i class="el-icon-arrow-right" />
        </div>
      </div>

      <div v-for="i in commData.commentCount || 1" :key="i" class="comment-item">
        <div class="comment-user">
          <div class="comment-flex">
            <div class="userimg"><i class="el-icon-user-solid" /></div>
            <div class="username">小花</div>
            <div v-if="commData.isLevel" class="userlevel">
              <span class="level-text">普通会员</span>
            </div>
          </div>
          <div class="comment-star">
            <i v-for="index in 5" :key="index" class="el-icon-star-on" />
          </div>
        </div>
        <div class="comment-content">评价内容</div>
        <div class="comment-imgs">
          <div v-for="imgItem in 3" :key="imgItem" class="comment-img">
            <i class="el-icon-picture-outline" />
          </div>
        </div>
      </div>

      <div class="comment-allcheck">查看全部评价</div>
    </div>
  </div>
</template>

<script>
/**
 * 商品评价 —— 画布预览。迁移自 PHP common/goods-comment/preview.php
 *
 * 头像 / 评价图 / 会员等级图标平台端无对应资源，改用 CSS 占位与 Element 图标。
 * PHP 侧在 computed 里给 data.isLevel 补默认值（有副作用），这里改为读取时兜底。
 */
export default {
  name: 'GoodsCommentPreview',
  props: {
    activeItem: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    computedStyle() {
      return this.activeItem.computedStyle || {};
    },
    commData() {
      const data = this.activeItem.data || {};
      return {
        ...data,
        isLevel: data.isLevel === undefined || data.isLevel === null ? 1 : data.isLevel,
      };
    },
    commentBoxStyle() {
      const { marginTop, marginBottom, aroundMargin, searchIpts } = this.computedStyle;
      return {
        margin: `${marginTop || 0} ${aroundMargin || 0} ${marginBottom || 0}`,
        ...searchIpts,
      };
    },
  },
};
</script>

<style scoped lang="scss">
.diy-goods-comment {
  box-sizing: border-box;
  overflow: hidden;
}
.comment-list {
  background: #fff;
  padding-bottom: 5px;
}
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 12px 16px;
  font-size: 12px;
  color: #5e6066;

  .comment-header-left {
    flex: 1;
    font-size: 12px;
  }
  .title {
    font-size: 17px;
    font-weight: 700;
  }
  .comment-header-right {
    display: flex;
    align-items: center;
    color: #999;
  }
  .satisfaction {
    color: #f10009;
  }
}
.comment-item {
  padding: 0 12px 16px;
}
.comment-user {
  display: flex;
}
.comment-flex {
  display: flex;
  align-items: center;
  flex: 1;

  .userimg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ddd;
    color: #fff;
    font-size: 12px;
  }
  .username {
    margin: 0 6px 0 8px;
  }
  .userlevel {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #ddc095;
    background: #474758;
    height: 16px;
    line-height: 16px;
    border-radius: 20px;
    padding: 0 8px;
  }
}
.comment-star {
  color: #fd463e;

  i {
    font-size: 14px;
    margin-right: 2px;
  }
}
.comment-content {
  line-height: 20px;
  padding: 11px 0 15px;
}
.comment-imgs {
  display: flex;
}
.comment-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-right: 10px;
  border-radius: 2px;
  background: #f5f5f5;
  color: #c0c4cc;
}
.comment-allcheck {
  width: 106px;
  height: 33px;
  line-height: 33px;
  text-align: center;
  color: #999;
  font-size: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 17px;
  margin: auto;
}
</style>
