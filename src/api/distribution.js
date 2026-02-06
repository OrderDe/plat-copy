
import request from '@/utils/request';

/**
 * @description 分销设置 -- 详情
 */
export function configApi() {
  return request({
    url: '/admin/platform/retail/store/config/get',
    method: 'get',
  });
}

/**
 * @description 分销设置 -- 表单提交
 */
export function configUpdateApi(data) {
  return request({
    url: '/admin/platform/retail/store/config/save',
    method: 'post',
    data,
  });
}

/**
 * @description 分销员 -- 列表
 */
export function promoterListApi(params) {
  return request({
    url: '/admin/platform/retail/store/people/list',
    method: 'get',
    params,
  });
}

/**
 * @description 根据条件获取下级推广用户列表
 */
export function spreadListApi(params) {
  return request({
    url: '/admin/platform/retail/store/sub/user/list',
    method: 'get',
    params,
  });
}

/**
 * @description 推广人订单 -- 列表
 */
export function spreadOrderListApi(params) {
  return request({
    url: '/admin/platform/retail/store/promotion/order/list',
    method: 'get',
    params,
  });
}

/**
 * @description 推广人 -- 清除上级推广人
 */
export function spreadClearApi(id) {
  return request({
    url: `/admin/platform/retail/store/clean/spread/${id}`,
    method: 'get',
  });
}

/**
 * 导出分销员Excel
 * @param params 对象
 */
export function peopleExcelApi(params) {
  return request({
    url: `/admin/platform/export/retail/store/people/excel`,
    method: 'get',
    params,
    responseType: 'blob',
  });
}
