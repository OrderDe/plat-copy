/**
 * 库位下拉的余量展示。
 *
 * 容量本来就是硬约束（后端 WmsStockServiceImpl#checkLocationUsable 会拦），
 * 但那道拦截在单据「生效」时才触发，而且一次只报一行。操作员选库位时看不到
 * 任何容量信息，只能填完、保存、生效，才被告知「库位 A-05 容量不足 (剩余 3)」，
 * 然后回头改明细重来一轮。
 *
 * 把余量前置到下拉的 label 上，选之前就能判断；已满的直接置灰，选都选不了。
 *
 * 依赖后端 location/list 与 location/listByWarehouse 回填的 usedNum / remainNum。
 * remainNum 为 null 表示该库位没设容量上限，此时不展示余量、也不禁用。
 */

/** Return the persisted free capacity minus quantities reserved by this form. */
export function locationRemain(loc, reserved = 0) {
  if (!loc || loc.remainNum == null) return null;
  const remain = Number(loc.remainNum);
  const used = Number(reserved);
  if (!Number.isFinite(remain)) return null;
  return remain - (Number.isFinite(used) ? used : 0);
}

/** Sum quantities assigned to a location by other rows in the same form. */
export function locationReservedNum(items, locationId, excludeRow) {
  return (items || []).reduce((total, row) => {
    if (row === excludeRow || row.locationId == null || locationId == null
      || String(row.locationId) !== String(locationId)) return total;
    const raw = row.actualInboundNum != null ? row.actualInboundNum : row.inboundTotalNum;
    const num = Number(raw);
    return total + (Number.isFinite(num) && num > 0 ? num : 0);
  }, 0);
}

/** Return the effective free capacity for one row, excluding that row's own allocation. */
export function locationRemainForRow(loc, items, row) {
  if (!loc || loc.remainNum == null) return null;
  return locationRemain(loc, locationReservedNum(items, loc.id, row));
}

/** 下拉展示文案：A-05-1-01-01（剩余 90/100） */
export function locationLabel(loc, remainOverride) {
  if (!loc) return '';
  // 历史脏数据里存在编码为空的库位（编码校验补上之前存进去的），
  // 直接拼会渲染成一个只有「（已满）」的空选项，认都认不出是哪个库位
  const code = loc.code || `未命名库位#${loc.id}`;
  const remain = remainOverride == null ? loc.remainNum : remainOverride;
  if (remain == null) return code;
  if (remain <= 0) return `${code}（已满）`;
  return `${code}（剩余 ${remain}/${loc.capacity}）`;
}

/**
 * 已满的库位禁止选择。
 *
 * 例外：编辑草稿时原本就选中的那个库位不能禁用，否则 el-select 显示不出已选值，
 * 看起来像是库位被清空了。调用方把当前已选的 id 传进来即可。
 */
export function locationDisabled(loc, currentId, remainOverride) {
  if (!loc || loc.remainNum == null) return false;
  if (currentId != null && loc.id != null && String(loc.id) === String(currentId)) return false;
  const remain = remainOverride == null ? loc.remainNum : remainOverride;
  return remain <= 0;
}

/** 某库位还能放下 num 件吗；拿不到余量信息时一律放行，交给后端兜底 */
export function locationHasRoom(loc, num) {
  if (!loc || loc.remainNum == null) return true;
  return loc.remainNum >= (Number(num) || 0);
}

/**
 * 找出本单里会把库位塞爆的行。
 *
 * 必须按库位汇总，不能逐行判断：同一个库位常被多行选中（同一批货拆成几个规格），
 * 每行单看都不超，加起来却放不下。后端是逐行顺序扣的，累计效果一样，
 * 所以前端也必须按累计口径预判，否则会出现「前端说没问题、生效时报容量不足」。
 *
 * @param {Array}    items          明细行
 * @param {Function} getLocation    (locationId) => 库位对象，含 remainNum/capacity/code
 * @param {Function} getNum         (row) => 该行要放进去的数量
 * @param {Function} getLocationId  (row) => 该行选的库位 id
 * @returns {Array} [{ locationId, code, remain, need, lines: [行号从1开始] }]
 */
export function findOverCapacity(items, getLocation, getNum, getLocationId) {
  const byLoc = new Map();
  (items || []).forEach((row, idx) => {
    const locId = getLocationId(row);
    if (locId == null) return;
    const key = String(locId);
    const num = Number(getNum(row)) || 0;
    if (num <= 0) return;
    if (!byLoc.has(key)) byLoc.set(key, { locationId: locId, need: 0, lines: [] });
    const e = byLoc.get(key);
    e.need += num;
    e.lines.push(idx + 1);
  });

  const over = [];
  byLoc.forEach((e) => {
    const loc = getLocation(e.locationId);
    // 拿不到库位或该库位不限容，交给后端兜底，前端不拦
    if (!loc || loc.remainNum == null) return;
    if (e.need > loc.remainNum) {
      over.push({ ...e, code: loc.code, remain: loc.remainNum });
    }
  });
  return over;
}

/** 把超容结果拼成一句人话，一次把所有超容库位都说清楚，省得改一轮报一个 */
export function overCapacityMessage(over) {
  if (!over || !over.length) return '';
  return over
    .map((o) => `第 ${o.lines.join('、')} 行的库位 ${o.code} 放不下：本单要放 ${o.need} 件，只剩 ${o.remain} 件容量`)
    .join('；');
}
