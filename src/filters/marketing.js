
/**
 *优惠券 类型
 */
export function couponCategory(status) {
  const statusMap = {
    1: '店铺',
    2: '商品',
    3: '通用',
    4: '品类',
    5: '品牌',
    6: '跨店',
  };
  return statusMap[status];
}
