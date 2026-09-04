/**
 * 从商品对象或路由参数中提取有效的商品 ID。
 *
 * 积分商品列表在不同版本接口中可能返回 id/productId/product_id，
 * 统一在进入路由或接口前归一化，避免把 null/undefined 拼进 URL。
 */
export function normalizeProductId(value) {
  const candidates = value && typeof value === 'object'
    ? [value.id, value.productId, value.product_id]
    : [value];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    const text = String(candidate).trim().toLowerCase();
    if (!text || text === 'null' || text === 'undefined') continue;
    const id = Number(text);
    if (Number.isSafeInteger(id) && id > 0) return id;
  }
  return null;
}

export function hasValidProductId(value) {
  return normalizeProductId(value) !== null;
}

/**
 * 归一化营销商品列表，并排除不能重复添加的积分商品。
 */
export function normalizeSelectableProducts(list) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => Number(item.type) !== 1)
    .map((item) => ({ ...item, id: normalizeProductId(item) }))
    .filter((item) => item.id !== null);
}

export default normalizeProductId;
