/**
 * 通用权限装饰器
 *
 * @description 权限控制装饰器
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';
import {
  PERMISSIONS_KEY,
  ROLES_KEY,
} from '../../guards/common/permission.guard';

/**
 * 权限装饰器
 *
 * @description 为控制器方法指定所需的权限
 * @param permissions - 权限列表
 * @returns 装饰器函数
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * 角色装饰器
 *
 * @description 为控制器方法指定所需的角色
 * @param roles - 角色列表
 * @returns 装饰器函数
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * 公开访问装饰器
 *
 * @description 标记接口为公开访问，无需认证
 * @returns 装饰器函数
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * 租户隔离装饰器
 *
 * @description 标记接口需要租户隔离
 * @returns 装饰器函数
 */
export const TenantIsolation = () => SetMetadata('tenantIsolation', true);
