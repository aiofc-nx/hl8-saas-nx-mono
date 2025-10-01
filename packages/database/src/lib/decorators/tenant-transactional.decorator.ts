/**
 * 租户事务装饰器
 *
 * @description 方法装饰器，自动处理租户数据库事务
 * 从上下文获取租户ID，在租户数据库中执行事务
 *
 * @fileoverview 租户事务装饰器实现文件
 * @since 1.0.0
 */

import { ClsService } from 'nestjs-cls';
import type { EntityManager } from '@mikro-orm/core';
import { DECORATOR_METADATA } from '../constants';
import type { TransactionOptions } from '../types';
import { TenantNotFoundException } from '../exceptions';

/**
 * 租户事务装饰器
 *
 * @description 方法装饰器，自动在租户数据库事务中执行方法
 * 从 CLS 上下文获取租户ID，在对应租户数据库中执行事务
 *
 * ## 业务规则
 *
 * ### 租户验证规则
 * - 必须从上下文中获取有效的租户ID
 * - 租户ID为空时抛出异常
 * - 租户数据库必须存在
 * - 支持租户权限验证
 *
 * ### 事务执行规则
 * - 在租户的独立数据库中执行事务
 * - 事务成功时自动提交
 * - 事务失败时自动回滚
 * - EntityManager 存储到上下文
 *
 * ### 数据隔离规则
 * - 事务只能访问当前租户的数据
 * - 严格禁止跨租户数据访问
 * - 租户上下文在整个调用链中传递
 *
 * @param options - 事务配置选项
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly tenantDbService: TenantDatabaseService,
 *     private readonly cls: ClsService
 *   ) {}
 *
 *   // 基本使用
 *   @TenantTransactional()
 *   async createTenantUser(userData: UserData): Promise<User> {
 *     const em = this.cls.get('entityManager') as EntityManager;
 *     const tenantId = this.cls.get('tenantId');
 *
 *     const user = new User(userData);
 *     user.tenantId = tenantId;
 *     await em.persistAndFlush(user);
 *     return user;
 *   }
 *
 *   // 自定义配置
 *   @TenantTransactional({
 *     isolation: 'REPEATABLE_READ',
 *     timeout: 60000
 *   })
 *   async complexTenantOperation(): Promise<void> {
 *     // 复杂租户业务逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function TenantTransactional(options?: TransactionOptions) {
  return function (
    target: object,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // 存储装饰器元数据
    Reflect.defineMetadata(
      DECORATOR_METADATA.TENANT_TRANSACTIONAL,
      options || {},
      target,
      propertyName
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (this: any, ...args: unknown[]) {
      const cls = this.cls as ClsService;
      const tenantDbService = this.tenantDbService;

      if (!cls || !tenantDbService) {
        throw new Error(
          '@TenantTransactional decorator requires ClsService and TenantDatabaseService'
        );
      }

      // 从上下文获取租户ID
      const tenantId = cls.get<string>('tenantId');
      if (!tenantId) {
        throw new TenantNotFoundException('租户上下文缺失，无法执行租户事务', {
          method: propertyName,
          class: target.constructor.name,
        });
      }

      // 检查是否已在事务中
      const existingEm = cls.get<EntityManager>('entityManager');
      if (existingEm) {
        // 如果已在事务中，直接执行方法
        return originalMethod.apply(this, args);
      }

      // 执行租户事务
      return tenantDbService.executeTenantTransaction(
        tenantId,
        async (em: EntityManager) => {
          // 将 EntityManager 存储到上下文
          cls.set('entityManager', em);

          try {
            const result = await originalMethod.apply(this, args);
            return result;
          } finally {
            // 清理上下文
            cls.set('entityManager', undefined);
          }
        }
      );
    };

    return descriptor;
  };
}

/**
 * 获取租户事务元数据
 *
 * @description 获取方法的租户事务装饰器元数据
 *
 * @param target - 目标对象
 * @param propertyName - 方法名
 * @returns 事务配置选项
 *
 * @example
 * ```typescript
 * const options = getTenantTransactionalMetadata(
 *   UserService.prototype,
 *   'createUser'
 * );
 * ```
 */
export function getTenantTransactionalMetadata(
  target: object,
  propertyName: string
): TransactionOptions | undefined {
  return Reflect.getMetadata(
    DECORATOR_METADATA.TENANT_TRANSACTIONAL,
    target,
    propertyName
  );
}
