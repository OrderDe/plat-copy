import request from '@/utils/request';

/**
 * 获取发票记录分页列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getInvoiceRecordPage(data) {
  return request({
    url: '/admin/platform/invoiceRecord/page',
    method: 'post',
    data
  });
}

/**
 * 获取发票记录详情
 * @param {number} id 发票记录ID
 * @returns {Promise}
 */
export function getInvoiceRecordDetail(id) {
  return request({
    url: `/admin/platform/invoiceRecord/detail/${id}`,
    method: 'post'
  });
}

/**
 * 创建或更新发票记录
 * @param {Object} data 发票数据
 * @returns {Promise}
 */
export function createOrUpdateInvoiceRecord(data) {
  return request({
    url: '/admin/platform/invoiceRecord/createOrUpdate',
    method: 'post',
    data
  });
}

/**
 * 删除发票记录
 * @param {number} id 发票记录ID
 * @returns {Promise}
 */
export function deleteInvoiceRecord(id) {
  return request({
    url: `/admin/pay/invoice/delete/${id}`,
    method: 'delete'
  });
}

/**
 * 修改发票状态
 * @param {Object} data { id, status }
 * @returns {Promise}
 */
export function changeInvoiceStatus(data) {
  return request({
    url: '/admin/platform/invoiceRecord/changeInvoiceStatus',
    method: 'post',
    data
  });
}
