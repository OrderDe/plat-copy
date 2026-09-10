import request from '@/utils/request';

/** 产品分享 - 分销商/创客提现申请列表。 */
export function shareWithdrawListApi(params) {
  return request({
    url: '/admin/distribution/withdraw/list',
    method: 'get',
    params,
  });
}

/** 审核提现申请，pass=true 通过，false 驳回。 */
export function shareWithdrawAuditApi(id, params) {
  return request({
    url: `/admin/distribution/withdraw/audit/${id}`,
    method: 'post',
    params,
  });
}

/** 确认提现已打款。 */
export function shareWithdrawTransferApi(id, params) {
  return request({
    url: `/admin/distribution/withdraw/transfer/${id}`,
    method: 'post',
    params,
  });
}

/** 产品分享 - 创客（团长）列表。 */
export function shareMakerListApi(params) {
  return request({
    url: '/admin/distribution/leader/list',
    method: 'get',
    params,
  });
}

/** 启用或禁用创客账号。 */
export function shareMakerStatusApi(uid, status) {
  return request({
    url: `/admin/distribution/leader/status/${uid}`,
    method: 'post',
    params: { status },
  });
}
