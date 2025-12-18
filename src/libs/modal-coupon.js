
/**
 * 优惠券列表弹窗形式展示组件
 * @param handle
 * @param keyNum 重置表单key值
 * @param callback 回调函数
 * @param couponId 优惠券id
 * @param userIds 用户id
 * @returns {Promise<any>}
 */
export default function modalCoupon(handle, keyNum, callback, couponId = [], userIds) {
  const h = this.$createElement;
  return new Promise((resolve, reject) => {
    this.$msgbox({
      title: '优惠券列表',
      customClass: 'upload-form-temp',
      closeOnClickModal: false,
      showClose: false,
      message: h('div', { class: 'common-form-upload' }, [
        h('couponList', {
          props: {
            handle: handle,
            couponId: couponId,
            keyNum: keyNum,
            userIds: userIds,
          },
          on: {
            getCouponId(id) {
              callback(id);
            },
          },
        }),
      ]),
      showCancelButton: false,
      showConfirmButton: false,
    })
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject();
        this.$message({
          type: 'info',
          message: '已取消',
        });
      });
  });
}
