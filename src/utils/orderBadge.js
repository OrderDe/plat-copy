/**
 * 订单状态徽标工具
 * 根据订单的 status、refundStatus、cancelStatus、groupBuyRecordStatus 返回统一的显示文案和颜色
 */
export function getOrderBadge(order) {
  const { status, refundStatus, cancelStatus, groupBuyRecordStatus } = order;

  // 【第一优先级】取消状态,不管其他字段
  if (cancelStatus === 1) return { text: '系统取消', color: 'gray' };
  if (cancelStatus === 2) return { text: '用户取消', color: 'gray' };

  // 【第二优先级】退款状态
  if (refundStatus === 3) {
    return { text: '已退款', color: 'red' };       // 全部退款
  }
  if (refundStatus === 2) {
    return { text: '部分退款', color: 'orange' };  // 部分退款
  }

  // refundStatus === 1(申请中):徽标仍按后面逻辑显示,叠加一个"退款处理中"小角标
  const extraTag = (refundStatus === 1) ? { text: '退款处理中', color: 'orange' } : null;

  // 【第三优先级】拼团进程（只对拼团单生效，99=非拼团单直接跳过）
  if (groupBuyRecordStatus === 0) {
    // 未成团，不管 status 是不是"待发货"，都不能显示成待发货，防止商户提前发货
    return { text: '拼团中', color: 'blue', extraTag };
  }
  if (groupBuyRecordStatus === -1) {
    // 拼团失败一般紧跟着走自动退款，理论上会被上面 refundStatus 分支先拦住；
    // 保留这条是兜底：万一退款还没落到 refundStatus 字段上，至少不显示成"待发货"
    return { text: '拼团失败', color: 'gray', extraTag };
  }
  // groupBuyRecordStatus === 10(已成团) 或 99(非拼团单)，走到下面正常按 status 显示

  // 【第四优先级】按 status 显示原来的物流状态
  let badge;
  switch (status) {
    case 0: badge = { text: '待支付', color: 'orange' }; break;
    case 1: badge = { text: '待发货', color: 'blue'   }; break;
    case 2: badge = { text: '部分发货', color: 'blue' }; break;
    case 3: badge = { text: '待核销', color: 'blue'   }; break;
    case 4: badge = { text: '待收货', color: 'blue'   }; break;
    case 5: badge = { text: '已收货', color: 'blue'   }; break;
    case 6: badge = { text: '已完成', color: 'green'  }; break;
    case 9: badge = { text: '已取消', color: 'gray'   }; break;
    default: badge = { text: '未知',  color: 'gray'   };
  }
  return { ...badge, extraTag };
}

/**
 * 根据 getOrderBadge 返回的 color 映射为 CSS class
 */
export function getBadgeClass(badge) {
  const map = {
    gray: 'notStartTag',
    red: 'textE93323',
    orange: 'doingTag',
    blue: 'doingTag',
    green: 'endTag',
  };
  return map[badge.color] || 'notStartTag';
}
