// import { param } from "@/utils";

import request from '@/utils/request';
// const request = ()=>{
//   return {
//     url: '',
//     method: 'POST',
//     data: {},
//     param:{}
//   }
// }
/**
 * 查询一体化分类详情
 * @description 获取指定分类ID的详细信息
 * @param {number} id 分类ID
 * @returns {Promise}
 */
export function GetIntegrateCategoryDetail(id) {
  return request({
    url: `/admin/merchant/IntegrateCategory/detail/${id}`,
    method: 'post'
  });
}

/**
 * 编辑一体化分类
 * @description 修改分类信息
 * @param {Object} data 分类数据
 * @returns {Promise}
 */
export function EditIntegrateCategory(data) {
  return request({
    url: '/admin/merchant/IntegrateCategory/edit',
    method: 'post',
    data
  });
}

/**
 * 查询运费模板列表
 * @description 获取运费模板分页列表
 * @param {Object} data 查询参数
 * @param {number} data.pageNum - 页码
 * @param {number} data.pageSize - 每页条数
 * @param {number} data.spuId - SPU ID
 * @param {string} data.templateName - 模板名称
 * @returns {Promise}
 */
export function GetShipTemplateList(data) {
  return request({
    url: '/admin/order/yyt/ship/template/getPageList',
    method: 'post',
    data: data
  });
}

// ==================== 阶段一：商品/类目/地址查询 ====================
/**
 * 查询分类列表
 * @description 获取商品分类列表（支持递归获取子分类）
 * @param {Object} data 查询参数
 * @param {number} data.pid - 父级分类ID（顶级传0）
 * @param {number} data.level - 分类层级（1/2/3）
 * @returns {Promise}
 */
export function GetCategoryTree(data) {
  return request({
    url: '/admin/thirdParty/yyt/flow/stage1/category-list',
    method: 'post',
    data
  });
}

/**
 * 查询一体化分类列表
 * @description 获取一体化分类列表，支持父子级联动
 * @param {Object} data 查询参数
 * @param {number} data.pid - 父级分类ID（顶级传0）
 * @param {number} data.level - 分类层级（1/2/3）
 * @returns {Promise}
 */
export function GetIntegrateCategoryList(data) {
  return request({
    url: '/admin/merchant/IntegrateCategory/page',
    method: 'POST',
    data
  });
}

/**
 * 查询SPU商品列表（分页）
 * @description 分页查询SPU商品列表，支持各种筛选条件
 * @param {Object} params 查询参数 {pageIndex, pageSize, categoryId, keyword}
 * @returns {Promise}
 */
export function GetSpuList(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/stage1/spu-list', //
    method: 'POST',
    data: params
  });
}

/**
 * 查询SPU详情（含SKU列表）
 * @description 获取指定SPU的详细信息，包含所有SKU规格
 * @param {Object} params 查询参数 {spuId}
 * @returns {Promise}
 */
export function GetSpuDetail(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/stage1/spu-detail', // 
    method: 'POST',
    data: params
  });
}

/**
 * 查询商品库存（批量）
 * @description 批量查询多个SKU的库存信息
 * @param {Object} params 查询参数 {skuIds: Array<number>}
 * @returns {Promise}
 */
export function GetStockBatch(params) {
  return request({
    url: '', //
    method: 'POST',
    data: params
  });
}

/**
 * 查询商品SKU价格（批量）
 * @description 批量查询多个SKU的价格信息
 * @param {Object} params 查询参数 {skuIds: Array<number>}
 * @returns {Promise}
 */
export function GetPriceBatch(params) {
  return request({
    url: '', //
    method: 'POST',
    data: params
  });
}

/**
 * 查询省市区地址列表（分页）
 * @description 获取中国省市区地址数据
 * @param {Object} params 查询参数 {parentCode, pageIndex, pageSize}
 * @returns {Promise}
 */
export function GetAddressList(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}

/**
 * 查询品牌列表（分页）
 * @description 获取商品品牌列表
 * @param {Object} params 查询参数 {pageIndex, pageSize, keyword}
 * @returns {Promise}
 */
export function GetBrandList(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}

/**
 * 查询三级类目关联信息
 * @description 获取类目关联的属性、规格等信息
 * @param {Object} params 查询参数 {categoryId}
 * @returns {Promise}
 */
export function GetCategoryRelation(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}


// ==================== 阶段二：运费/选品预校验 ====================
/**
 * 选品预校验（一体化检查）
 * @description 下单前的综合校验，一次性检查类目、价格、库存、配送区域、运费
 * @param {Object} params 查询参数 {skuList, addressId}
 * @returns {Promise}
 */
export function PreCheck(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}

/**
 * 计算运费
 * @description 根据商品和收货地址计算运费
 * @param {Object} params 查询参数 {skuList, addressId}
 * @returns {Promise}
 */
export function CalculateFreight(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}

/**
 * 查询销售区域模板（判断是否可配送）
 * @description 检查商品是否支持配送到指定区域
 * @param {Object} params 查询参数 {spuId, areaCode}
 * @returns {Promise}
 */
export function CheckDeliveryArea(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/stage2/areas-template', // 
    method: 'POST',
    data: params
  });
}


// ==================== 阶段三：订单查询/物流 ====================
/**
 * 查询售后单详细信息（分销商）
 * @description 分销商视角查询售后单详情
 * @param {Object} params 查询参数 {refundId}
 * @returns {Promise}
 */
export function GetRefundDetailDistributor(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/stage3/return-goods-detail', // 
    method: 'POST',
    data: params
  });
}

/**
 * 换货确认收货（分销商）
 * @description 分销商确认收到换货商品
 * @param {Object} params 查询参数 {orderId, refundId}
 * @returns {Promise}
 */
export function ConfirmReceiveExchange(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}

/**
 * 查询售出订单列表（供应商）
 * @description 供应商视角查询已售出的订单列表
 * @param {Object} params 查询参数 {pageIndex, pageSize, status, startTime, endTime}
 * @returns {Promise}
 */
export function GetSoldOrderList(params) {
  return request({
    url: '/admin/order/yytOrderLocal/getPageList', // 
    method: 'POST',
    data: params
  });
}

/**
 * 查询怡亚通本地订单详情
 * @description 获取怡亚通本地订单详细信息
 * @param {Object} params 查询参数 {id}
 * @returns {Promise}
 */
export function GetYytOrderDetail(params) {
  return request({
    url: '/admin/order/yytOrderLocal/getDetailByOrderSn',
    method: 'POST',
    params: params
  });
}

/**
 * 查询物流信息（分销商）
 * @description 分销商查询订单物流跟踪信息
 * @param {Object} params 查询参数 {orderId, logisticsNo}
 * @returns {Promise}
 */
export function GetLogisticsInfo(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/stage3/order-express', // 
    method: 'POST',
    data: params
  });
}

/**
 * 查询订单详情（供应商）
 * @description 供应商视角查询订单详细信息
 * @param {Object} params 查询参数 {orderId}
 * @returns {Promise}
 */
export function GetOrderDetailSupplier(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/getOrderDetail', // 
    method: 'POST',
    data: params
  });
}

/**
 * 根据外部订单号查询订单详情列表（分销商）
 * @description 通过外部订单号查询关联的订单详情
 * @param {Object} params 查询参数 {externalOrderNo}
 * @returns {Promise}
 */
export function GetOrderListByExternalNo(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/stage3/order-detail-list', // 
    method: 'POST',
    data: params
  });
}


// ==================== 阶段四：发货/消息 ====================
/**
 * 发货上报
 * @description 供应商发货后上报物流信息
 * @param {Object} params 查询参数 {orderId, logisticsCompany, logisticsNo, productList}
 * @returns {Promise}
 */
export function ReportShipment(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}

/**
 * 拉取并消费消息池（支持手动触发）
 * @description 从消息池拉取待处理消息并消费
 * @param {Object} params 查询参数 {messageType, limit}
 * @returns {Promise}
 */
export function ConsumeMessagePool(params) {
  return request({
    url: '/admin/thirdParty/yytjc/getMessagePage', // 
    method: 'POST',
    data: params
  });
}


// ==================== 阶段五：售后管理 ====================
/**
 * 售后申请审核
 * @description 审核用户的售后申请
 * @param {Object} params 查询参数 {refundId, auditResult, auditRemark}
 * @returns {Promise}
 */
export function AuditRefund(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}

/**
 * 售后单列表（供应商）
 * @description 查询售后单列表（供应商视角）
 * @param {Object} params 查询参数 {pageIndex, pageSize, status, startTime, endTime}
 * @returns {Promise}
 */
export function GetRefundList(params) {
  return request({
    url: '/admin/thirdParty/yyt/refundRecord/pageList',
    method: 'get',
    params: params
  });
}

/**
 * 售后单详情（供应商）
 * @description 查询售后单详细信息（供应商视角）
 * @param {Object} params 查询参数 {refundId}
 * @returns {Promise}
 */
export function GetRefundDetail(params) {
  return request({
    url: `/admin/thirdParty/yyt/refundRecord/getRefundDetailSupplier/${params.returnSn}`,
    method: 'post'
  });
}

/**
 * 回填换货物流单号
 * @description 售后换货时回填物流单号
 * @param {Object} params 查询参数 {refundId, logisticsCompany, logisticsNo, remark}
 * @returns {Promise}
 */
export function ReturnSendGoods(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/stage5/return-send-goods',
    method: 'POST',
    data: params
  });
}

/**
 * 财务确认退款
 * @description 财务部门确认退款操作
 * @param {Object} params 查询参数 {refundId, confirmResult, remark}
 * @returns {Promise}
 */
export function ConfirmRefund(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}

/**
 * 商家确认-拒绝收货
 * @description 商家确认拒绝收到退货
 * @param {Object} params 查询参数 {refundId, rejectReason}
 * @returns {Promise}
 */
export function RejectReceive(params) {
  return request({
    url: '', // 
    method: 'POST',
    data: params
  });
}


// ==================== 供应商接口 ====================
/**
 * 查询商品列表
 * @description 分页查询供应商商品列表，支持按类目、名称、SPU ID筛选
 * @param {Object} params 查询参数 {categoryId1, categoryId2, categoryId3, pageIndex, pageSize, name, spuId}
 * @returns {Promise}
 */
export function GetSupplierSpuList(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/supplier/spu-list',
    method: 'POST',
    data: params
  });
}

/**
 * 获取商品详细参数
 * @description 获取指定SPU商品的详细信息，包括品牌、类目、状态等
 * @param {Object} params 查询参数 {spuId}
 * @returns {Promise}
 */
export function GetSupplierSpuInfo(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/supplier/spu-info',
    method: 'POST',
    data: params
  });
}

/**
 * 查询审核商品详情
 * @description 查询商品的审核状态、审核意见等信息
 * @param {Object} params 查询参数 {spuId}
 * @returns {Promise}
 */
export function GetSupplierSpuBackInfo(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/supplier/spu-back-info',
    method: 'POST',
    data: params
  });
}

/**
 * 查询SKU规格明细
 * @description 获取SKU规格详细信息
 * @param {Object} params 查询参数 {skuId}
 * @returns {Promise}
 */
export function GetSupplierSkuInfo(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/supplier/sku-info',
    method: 'POST',
    data: params
  });
}

/**
 * 根据SPUID查询运费模板信息
 * @description 获取商品关联的运费模板信息
 * @param {Object} params 查询参数 {spuId}
 * @returns {Promise}
 */
export function GetSupplierShipTemplate(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/supplier/ship-template',
    method: 'POST',
    data: params
  });
}

/**
 * 查询审核商品列表
 * @description 查询待审核或已审核的商品列表
 * @param {Object} params 查询参数 {pageIndex, pageSize, auditStatus}
 * @returns {Promise}
 */
export function GetSupplierAuditSpuList(params) {
  return request({
    url: '/admin/thirdParty/yyt/flow/supplier/audit-spu-list',
    method: 'POST',
    data: params
  });
}

// ==================== 日志查询 ====================
/**
 * 查询订单操作日志列表
 * @description 获取订单操作日志列表
 * @param {Object} params 查询参数 {page, limit, operatorName, operatorType, orderSn}
 * @returns {Promise}
 */
export function GetOrderLogList(params) {
  return request({
    url: '/admin/order/log/list',
    method: 'GET',
    params: params
  });
}

/**
 * 查询全局操作日志列表
 * @description 获取平台全局操作日志列表
 * @param {Object} params 查询参数 {page, limit, module, userName, userType, action}
 * @returns {Promise}
 */
export function GetOperationLogList(params) {
  return request({
    url: '/admin/platform/operation/log/list',
    method: 'GET',
    params: params
  });
}

// ==================== 怡亚通同步接口 ====================
/**
 * 同步怡亚通品牌
 * @description 从怡亚通同步品牌数据
 * @returns {Promise}
 */
export function SyncYytBrand() {
  return request({
    url: '/admin/thirdParty/yytjc/getBrandList',
    method: 'POST'
  });
}

/**
 * 同步怡亚通分类
 * @description 从怡亚通同步分类数据
 * @returns {Promise}
 */
export function SyncYytCategory() {
  return request({
    url: '/admin/thirdParty/yytjc/getYytCategory',
    method: 'POST'
  });
}

/**
 * 同步怡亚通商品列表
 * @description 从怡亚通同步商品列表数据
 * @returns {Promise}
 */
export function SyncYytSpu() {
  return request({
    url: '/admin/thirdParty/yytjc/getyytspuinfo',
    method: 'POST'
  });
}
