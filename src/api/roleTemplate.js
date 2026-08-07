
import request from '@/utils/request';

/**
 * 角色模板分页列表
 * @param {Object} pram - { name, status, pageNum, pageSize }
 */
export function getRoleTemplatePage(pram) {
  return request({
    url: '/admin/platform/role-template/page',
    method: 'get',
    params: pram,
  });
}

/**
 * 角色模板详情
 * @param {Number|String} id
 */
export function getRoleTemplateInfo(id) {
  return request({
    url: `/admin/platform/role-template/${id}`,
    method: 'get',
  });
}

/**
 * 新增角色模板
 * @param {Object} data - { name, remark, status, rules }
 */
export function addRoleTemplate(data) {
  return request({
    url: '/admin/platform/role-template/save',
    method: 'post',
    data,
  });
}

/**
 * 修改角色模板
 * @param {Object} data - { id, name, remark, status, rules }
 */
export function updateRoleTemplate(data) {
  return request({
    url: '/admin/platform/role-template/update',
    method: 'post',
    data,
  });
}

/**
 * 修改角色模板状态（启用/禁用）
 * @param {Object} data - { id, status }
 */
export function updateRoleTemplateStatus(data) {
  return request({
    url: `/admin/platform/role-template/status/${data.id}`,
    method: 'post',
    data: { status: data.status },
  });
}

/**
 * 删除角色模板
 * @param {Number|String} id
 */
export function deleteRoleTemplate(id) {
  return request({
    url: `/admin/platform/role-template/delete/${id}`,
    method: 'post',
  });
}

/**
 * 查询已启用的角色模板列表
 */
export function getEnabledRoleTemplates() {
  return request({
    url: '/admin/platform/role-template/enabled',
    method: 'get',
  });
}

/**
 * 查询商户绑定的角色模板
 * @param {Number} merId 商户ID
 */
export function getGrantedRole(merId) {
  return request({
    url: `/admin/platform/role-template/grant/${merId}`,
    method: 'get',
  });
}

/**
 * 绑定角色模板到商户
 * @param {Object} data - { merId, templateId }
 */
export function grantRoleTemplate(data) {
  return request({
    url: '/admin/platform/role-template/grant',
    method: 'post',
    data,
  });
}

/**
 * 缓存菜单树
 */
export function menuCacheTree() {
  return request({
    url: '/admin/platform/menu/cache/tree',
    method: 'get',
  });
}
