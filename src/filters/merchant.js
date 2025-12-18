
//商户过滤器
import store from '@/store';

/**
 * 商户分类
 */
export function merCategoryFilter(status) {
  if (!status) {
    return '';
  }
  let arrayList = store.getters.merchantClassify;
  let array = arrayList.filter((item) => status === item.id);
  if (array.length) {
    return array[0].name;
  } else {
    return '';
  }
}

/**
 * 商铺类型
 */
export function merchantTypeFilter(status) {
  if (!status) {
    return '';
  }
  let arrayList = store.getters.merchantType;
  let array = arrayList.filter((item) => status === item.id);
  if (array.length) {
    return array[0].name;
  } else {
    return '';
  }
}

/**
 * 商户创建类型
 */
export function merCreateTypeFilter(status) {
  const statusMap = {
    admin: '管理员创建',
    apply: '商户入驻申请',
  };
  return statusMap[status];
}

/**
 * 商户类别
 */
export function selfTypeFilter(status) {
  const statusMap = {
    true: '自营',
    false: '非自营',
  };
  return statusMap[status];
}
