/**
 * 权限控制装饰器
 *
 * @description 为控制器方法提供权限控制功能
 * 支持基于角色的访问控制（RBAC）和基于属性的访问控制（ABAC）
 *
 * ## 业务规则
 *
 * ### 权限检查规则
 * - 支持单个权限和多个权限的检查
 * - 支持权限的AND和OR逻辑组合
 * - 支持动态权限检查（基于请求上下文）
 *
 * ### 权限继承规则
 * - 类级别权限会被方法级别权限覆盖
 * - 支持权限的继承和组合
 * - 支持权限的否定（拒绝特定权限）
 *
 * ### 权限缓存规则
 * - 权限检查结果会被缓存以提高性能
 * - 缓存时间可配置，默认5分钟
 * - 支持权限变更时的缓存失效
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @RequirePermissions('user:read')
 *   async getUsers(): Promise<UserResponseDto[]> {
 *     // 需要user:read权限
 *   }
 *
 *   @Post()
 *   @RequirePermissions(['user:create', 'user:admin'], 'OR')
 *   async createUser(): Promise<UserResponseDto> {
 *     // 需要user:create或user:admin权限
 *   }
 *
 *   @Put(':id')
 *   @RequirePermissions('user:update')
 *   @RequireOwnership('id', 'userId')
 *   async updateUser(): Promise<UserResponseDto> {
 *     // 需要user:update权限且只能更新自己的数据
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * 权限检查元数据键
 */
export const PERMISSIONS_KEY = 'permissions';
export const PERMISSION_LOGIC_KEY = 'permission_logic';
export const OWNERSHIP_KEY = 'ownership';

/**
 * 权限逻辑类型
 */
export type PermissionLogic = 'AND' | 'OR';

/**
 * 权限要求接口
 */
export interface PermissionRequirement {
  permissions: string[];
  logic: PermissionLogic;
  ownership?: {
    resourceField: string;
    userField: string;
  };
}

/**
 * 权限装饰器
 *
 * @description 为控制器方法添加权限检查
 *
 * @param permissions - 需要的权限列表
 * @param logic - 权限逻辑（AND/OR）
 * @returns 装饰器
 */
export function RequirePermissions(
  permissions: string | string[],
  logic: PermissionLogic = 'AND'
): MethodDecorator {
  const permissionArray = Array.isArray(permissions)
    ? permissions
    : [permissions];

  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissionArray),
    SetMetadata(PERMISSION_LOGIC_KEY, logic)
  );
}

/**
 * 所有权装饰器
 *
 * @description 为控制器方法添加所有权检查
 * 确保用户只能访问自己拥有的资源
 *
 * @param resourceField - 资源字段名（如'id'）
 * @param userField - 用户字段名（如'userId'）
 * @returns 装饰器
 */
export function RequireOwnership(
  resourceField: string,
  userField: string
): MethodDecorator {
  return SetMetadata(OWNERSHIP_KEY, {
    resourceField,
    userField,
  });
}

/**
 * 管理员权限装饰器
 *
 * @description 要求管理员权限的快捷装饰器
 *
 * @returns 装饰器
 */
export function RequireAdmin(): MethodDecorator {
  return RequirePermissions('admin:full');
}

/**
 * 租户管理员权限装饰器
 *
 * @description 要求租户管理员权限的快捷装饰器
 *
 * @returns 装饰器
 */
export function RequireTenantAdmin(): MethodDecorator {
  return RequirePermissions('tenant:admin');
}

/**
 * 组织管理员权限装饰器
 *
 * @description 要求组织管理员权限的快捷装饰器
 *
 * @returns 装饰器
 */
export function RequireOrganizationAdmin(): MethodDecorator {
  return RequirePermissions('organization:admin');
}

/**
 * 部门管理员权限装饰器
 *
 * @description 要求部门管理员权限的快捷装饰器
 *
 * @returns 装饰器
 */
export function RequireDepartmentAdmin(): MethodDecorator {
  return RequirePermissions('department:admin');
}

/**
 * 组合权限装饰器
 *
 * @description 组合多个权限要求的装饰器
 *
 * @param requirements - 权限要求列表
 * @returns 装饰器
 */
export function RequireMultiplePermissions(
  requirements: PermissionRequirement[]
): MethodDecorator {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, requirements),
    SetMetadata(PERMISSION_LOGIC_KEY, 'MULTIPLE')
  );
}

/**
 * 动态权限装饰器
 *
 * @description 基于请求上下文动态确定权限要求
 *
 * @param permissionResolver - 权限解析函数
 * @returns 装饰器
 */
export function RequireDynamicPermissions(
  permissionResolver: (context: unknown) => string[]
): MethodDecorator {
  return SetMetadata('dynamic_permissions', permissionResolver);
}

/**
 * 权限排除装饰器
 *
 * @description 排除特定权限的装饰器
 * 用于在类级别权限基础上排除特定方法
 *
 * @param permissions - 要排除的权限
 * @returns 装饰器
 */
export function ExcludePermissions(
  permissions: string | string[]
): MethodDecorator {
  const permissionArray = Array.isArray(permissions)
    ? permissions
    : [permissions];
  return SetMetadata('exclude_permissions', permissionArray);
}

/**
 * 权限条件装饰器
 *
 * @description 基于条件动态应用权限
 *
 * @param condition - 条件函数
 * @param permissions - 权限要求
 * @returns 装饰器
 */
export function RequirePermissionsIf(
  condition: (context: unknown) => boolean,
  permissions: string | string[]
): MethodDecorator {
  return SetMetadata('conditional_permissions', {
    condition,
    permissions: Array.isArray(permissions) ? permissions : [permissions],
  });
}
