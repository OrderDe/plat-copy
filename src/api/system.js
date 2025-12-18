
import request from '@/utils/request';

/**
 * @description 协议管理-- 详情
 */
export function agreementInfoApi(data) {
  return request.get(`admin/platform/agreement/${data}`);
}

/**
 * @description 协议管理-- 保存
 */
export function agreementSaveApi(save, data) {
  // return request.post(`admin/platform/agreement/${save}`, data);
  return request({
    url: `admin/platform/agreement/${save}`,
    method: 'POST',
    data,
  });
}
