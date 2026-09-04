import request from '@/utils/request';

/** 平台分销商品配置列表。 */
export function distributionProductListApi(params) {
  return request({
    url: '/admin/distribution/product/list',
    method: 'get',
    params,
  });
}

/** 新增或编辑分销商品配置。 */
export function distributionProductSaveApi(data) {
  return request({
    url: '/admin/distribution/product/save',
    method: 'post',
    data,
  });
}

/** 开关分销商品。 */
export function distributionProductToggleApi(id, open) {
  return request({
    url: `/admin/distribution/product/toggle/${id}`,
    method: 'post',
    params: { open },
  });
}

/** 删除分销商品配置。 */
export function distributionProductDeleteApi(id) {
  return request({
    url: `/admin/distribution/product/${id}`,
    method: 'delete',
  });
}
