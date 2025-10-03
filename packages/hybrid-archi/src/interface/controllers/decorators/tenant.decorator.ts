/**
 * 租户隔离装饰器
 *
 * @description 为控制器方法提供租户隔离功能
 * 确保多租户环境下的数据安全和隔离
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 所有数据操作必须基于租户上下文
 * - 用户只能访问所属租户的数据
 * - 支持跨租户访问的特殊权限控制
 *
 * ### 租户上下文规则
 * - 租户ID可以从请求头、参数、JWT令牌中提取
 * - 支持租户上下文的自动设置和验证
 * - 支持租户级别的权限控制
 *
 * ### 数据隔离规则
 * - 查询操作自动添加租户过滤条件
 * - 创建操作自动设置租户ID
 * - 更新和删除操作验证租户所有权
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(TenantIsolationGuard)
 * export class UserController {
 *   @Get()
 *   @RequireTenantIsolation()
 *   async getUsers(): Promise<UserResponseDto[]> {
 *     // 自动过滤当前租户的用户
 *   }
 *
 *   @Post()
 *   @RequireTenantIsolation()
 *   @AutoSetTenantId()
 *   async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
 *     // 自动设置租户ID
 *   }
 *
 *   @Get(':id')
 *   @RequireTenantIsolation()
 *   @ValidateTenantOwnership('id')
 *   async getUser(@Param('id') id: string): Promise<UserResponseDto> {
 *     // 验证资源属于当前租户
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * 租户隔离元数据键
 */
export const TENANT_ISOLATION_KEY = 'tenant_isolation';
export const AUTO_SET_TENANT_KEY = 'auto_set_tenant';
export const TENANT_OWNERSHIP_KEY = 'tenant_ownership';
export const CROSS_TENANT_KEY = 'cross_tenant';

/**
 * 租户隔离配置接口
 */
export interface TenantIsolationConfig {
  enabled: boolean;
  autoSetTenantId?: boolean;
  validateOwnership?: boolean;
  resourceField?: string;
  allowCrossTenant?: boolean;
  crossTenantPermissions?: string[];
}

/**
 * 租户隔离装饰器
 *
 * @description 为控制器方法启用租户隔离
 *
 * @param config - 租户隔离配置
 * @returns 装饰器
 */
export function RequireTenantIsolation(
  config: Partial<TenantIsolationConfig> = {}
): MethodDecorator {
  const defaultConfig: TenantIsolationConfig = {
    enabled: true,
    autoSetTenantId: false,
    validateOwnership: true,
    allowCrossTenant: false,
    ...config,
  };

  return SetMetadata(TENANT_ISOLATION_KEY, defaultConfig);
}

/**
 * 自动设置租户ID装饰器
 *
 * @description 自动为创建操作设置租户ID
 *
 * @param field - 租户ID字段名，默认为'tenantId'
 * @returns 装饰器
 */
export function AutoSetTenantId(field = 'tenantId'): MethodDecorator {
  return SetMetadata(AUTO_SET_TENANT_KEY, { field });
}

/**
 * 验证租户所有权装饰器
 *
 * @description 验证资源是否属于当前租户
 *
 * @param resourceField - 资源字段名
 * @param tenantField - 租户字段名，默认为'tenantId'
 * @returns 装饰器
 */
export function ValidateTenantOwnership(
  resourceField: string,
  tenantField = 'tenantId'
): MethodDecorator {
  return SetMetadata(TENANT_OWNERSHIP_KEY, {
    resourceField,
    tenantField,
  });
}

/**
 * 跨租户访问装饰器
 *
 * @description 允许跨租户访问的装饰器
 *
 * @param permissions - 需要的跨租户权限
 * @returns 装饰器
 */
export function AllowCrossTenant(
  permissions: string[] = ['cross_tenant:access']
): MethodDecorator {
  return applyDecorators(
    SetMetadata(CROSS_TENANT_KEY, { enabled: true }),
    SetMetadata('cross_tenant_permissions', permissions)
  );
}

/**
 * 租户级别权限装饰器
 *
 * @description 基于租户级别的权限控制
 *
 * @param level - 租户级别（owner, admin, member, guest）
 * @returns 装饰器
 */
export function RequireTenantLevel(
  level: 'owner' | 'admin' | 'member' | 'guest'
): MethodDecorator {
  return SetMetadata('tenant_level', level);
}

/**
 * 租户数据过滤装饰器
 *
 * @description 自动为查询操作添加租户过滤条件
 *
 * @param tenantField - 租户字段名，默认为'tenantId'
 * @returns 装饰器
 */
export function FilterByTenant(tenantField = 'tenantId'): MethodDecorator {
  return SetMetadata('filter_by_tenant', { tenantField });
}

/**
 * 租户上下文装饰器
 *
 * @description 从请求中提取租户上下文信息
 *
 * @param sources - 租户ID来源（header, param, body, token）
 * @returns 装饰器
 */
export function ExtractTenantContext(
  sources: ('header' | 'param' | 'body' | 'token')[] = ['header', 'token']
): MethodDecorator {
  return SetMetadata('tenant_context_sources', sources);
}

/**
 * 租户验证装饰器
 *
 * @description 验证租户的有效性和状态
 *
 * @param validateStatus - 是否验证租户状态
 * @param allowedStatuses - 允许的租户状态
 * @returns 装饰器
 */
export function ValidateTenant(
  validateStatus = true,
  allowedStatuses: string[] = ['active']
): MethodDecorator {
  return SetMetadata('validate_tenant', {
    validateStatus,
    allowedStatuses,
  });
}

/**
 * 租户数据隔离装饰器
 *
 * @description 确保数据操作的租户隔离
 *
 * @param operations - 需要隔离的操作类型
 * @returns 装饰器
 */
export function IsolateTenantData(
  operations: ('create' | 'read' | 'update' | 'delete')[] = [
    'create',
    'read',
    'update',
    'delete',
  ]
): MethodDecorator {
  return SetMetadata('isolate_tenant_data', { operations });
}

/**
 * 组合租户装饰器
 *
 * @description 组合多个租户相关装饰器
 *
 * @param config - 租户配置
 * @returns 装饰器
 */
export function TenantIsolation(
  config: {
    isolation?: boolean;
    autoSetTenantId?: boolean;
    validateOwnership?: boolean;
    allowCrossTenant?: boolean;
    crossTenantPermissions?: string[];
    tenantLevel?: 'owner' | 'admin' | 'member' | 'guest';
    filterByTenant?: boolean;
    extractContext?: ('header' | 'param' | 'body' | 'token')[];
    validateTenant?: boolean;
    isolateData?: ('create' | 'read' | 'update' | 'delete')[];
  } = {}
): MethodDecorator {
  const decorators: MethodDecorator[] = [];

  if (config.isolation !== false) {
    decorators.push(RequireTenantIsolation());
  }

  if (config.autoSetTenantId) {
    decorators.push(AutoSetTenantId());
  }

  if (config.validateOwnership !== false) {
    decorators.push(ValidateTenantOwnership('id'));
  }

  if (config.allowCrossTenant) {
    decorators.push(AllowCrossTenant(config.crossTenantPermissions));
  }

  if (config.tenantLevel) {
    decorators.push(RequireTenantLevel(config.tenantLevel));
  }

  if (config.filterByTenant !== false) {
    decorators.push(FilterByTenant());
  }

  if (config.extractContext) {
    decorators.push(ExtractTenantContext(config.extractContext));
  }

  if (config.validateTenant !== false) {
    decorators.push(ValidateTenant());
  }

  if (config.isolateData) {
    decorators.push(IsolateTenantData(config.isolateData));
  }

  return applyDecorators(...decorators);
}
