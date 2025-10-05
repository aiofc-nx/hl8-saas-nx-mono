/**
 * 用户管理模块权限装饰器
 *
 * @description 用户管理模块的权限装饰器，基于通用权限装饰器
 * @since 1.0.0
 */

// 重新导出通用权限装饰器
export {
  RequirePermissions,
  RequireRoles,
  Public,
  TenantIsolation,
} from '@hl8/hybrid-archi';
