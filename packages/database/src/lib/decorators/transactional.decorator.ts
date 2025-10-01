/**
 * 事务装饰器
 *
 * @description 方法装饰器，自动处理数据库事务
 * 支持事务配置、自动提交和回滚、上下文传递等
 *
 * @fileoverview 事务装饰器实现文件
 * @since 1.0.0
 */

import { ClsService } from 'nestjs-cls';
import type { EntityManager } from '@mikro-orm/core';
import { DECORATOR_METADATA } from '../constants';
import type { TransactionOptions } from '../types';

/**
 * 事务装饰器
 *
 * @description 方法装饰器，自动在事务中执行方法
 * 支持事务配置、自动提交和回滚、EntityManager 上下文传递
 *
 * ## 业务规则
 *
 * ### 事务执行规则
 * - 方法执行在数据库事务中自动进行
 * - 方法成功执行时自动提交事务
 * - 方法抛出异常时自动回滚事务
 * - 支持嵌套事务和保存点
 *
 * ### 上下文传递规则
 * - EntityManager 自动存储到 CLS 上下文
 * - 嵌套调用共享同一个 EntityManager
 * - 事务结束后自动清理上下文
 * - 支持租户上下文的自动传递
 *
 * ### 错误处理规则
 * - 事务失败时自动回滚所有操作
 * - 异常会被重新抛出供上层处理
 * - 错误信息包含完整的事务上下文
 * - 支持自定义错误处理逻辑
 *
 * @param options - 事务配置选项
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly databaseService: DatabaseService,
 *     private readonly cls: ClsService
 *   ) {}
 *
 *   // 基本使用
 *   @Transactional()
 *   async createUser(userData: UserData): Promise<User> {
 *     const em = this.cls.get('entityManager') as EntityManager;
 *     const user = new User(userData);
 *     await em.persistAndFlush(user);
 *     return user;
 *   }
 *
 *   // 自定义配置
 *   @Transactional({
 *     isolation: 'SERIALIZABLE',
 *     timeout: 30000,
 *     rollbackOnError: true
 *   })
 *   async complexOperation(): Promise<void> {
 *     // 复杂业务逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export function Transactional(options?: TransactionOptions) {
  return function (
    target: object,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // 存储装饰器元数据
    Reflect.defineMetadata(
      DECORATOR_METADATA.TRANSACTIONAL,
      options || {},
      target,
      propertyName
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (this: any, ...args: unknown[]) {
      const cls = this.cls as ClsService;
      const databaseService = this.databaseService;

      if (!cls || !databaseService) {
        throw new Error(
          '@Transactional decorator requires ClsService and DatabaseService'
        );
      }

      // 检查是否已在事务中（避免嵌套事务问题）
      const existingEm = cls.get<EntityManager>('entityManager');
      if (existingEm) {
        // 如果已在事务中，直接执行方法
        return originalMethod.apply(this, args);
      }

      // 执行新事务
      return databaseService.executeTransaction(async (em: EntityManager) => {
        // 将 EntityManager 存储到上下文
        cls.set('entityManager', em);

        try {
          const result = await originalMethod.apply(this, args);
          return result;
        } finally {
          // 清理上下文
          cls.set('entityManager', undefined);
        }
      });
    };

    return descriptor;
  };
}

/**
 * 获取事务元数据
 *
 * @description 获取方法的事务装饰器元数据
 *
 * @param target - 目标对象
 * @param propertyName - 方法名
 * @returns 事务配置选项
 *
 * @example
 * ```typescript
 * const options = getTransactionalMetadata(UserService.prototype, 'createUser');
 * ```
 */
export function getTransactionalMetadata(
  target: object,
  propertyName: string
): TransactionOptions | undefined {
  return Reflect.getMetadata(
    DECORATOR_METADATA.TRANSACTIONAL,
    target,
    propertyName
  );
}
