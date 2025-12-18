
import request from '@/utils/request';

/**
 * 获取版权信息
 */
export function copyrightInfoApi() {
  return request({
    url: '/admin/platform/copyright/get/info',
    method: 'get',
  });
}

/**
 * 保存版权信息
 */
export function saveCrmebCopyRight(data) {
  return request({
    url: '/admin/platform/copyright/update/company/info',
    method: 'post',
    data,
  });
}
