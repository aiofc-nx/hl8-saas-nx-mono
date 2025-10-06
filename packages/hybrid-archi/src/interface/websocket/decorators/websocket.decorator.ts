/**
 * WebSocket装饰器
 *
 * @description 提供WebSocket相关的装饰器功能
 * 包括消息订阅、权限控制、参数验证等装饰器
 *
 * ## 业务规则
 *
 * ### 装饰器规则
 * - 支持消息类型装饰器
 * - 支持权限验证装饰器
 * - 支持参数验证装饰器
 * - 支持性能监控装饰器
 *
 * ### 权限规则
 * - 支持角色级别权限控制
 * - 支持权限级别权限控制
 * - 支持租户级别权限控制
 * - 支持动态权限验证
 *
 * ### 验证规则
 * - 支持消息格式验证
 * - 支持参数类型验证
 * - 支持业务规则验证
 * - 支持自定义验证器
 *
 * @example
 * ```typescript
 * export class UserGateway extends BaseGateway {
 *   @SubscribeMessage('getUserProfile')
 *   @RequireRoles(['user', 'admin'])
 *   @RequirePermissions(['user:read'])
 *   @ValidateMessage(GetUserProfileMessage)
 *   async handleGetUserProfile(
 *     @MessageBody() data: GetUserProfileMessage,
 *     @WebSocketContext() context: IWebSocketContext
 *   ): Promise<WsResponse<UserProfileData>> {
 *     return this.handleMessage(
 *       () => this.getUserProfileUseCase.execute(new GetUserProfileRequest(data.userId)),
 *       'getUserProfile'
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { IWebSocketContext } from '../../shared/interfaces';

/**
 * WebSocket消息订阅装饰器选项
 *
 * @description 定义消息订阅装饰器的配置选项
 */
export interface SubscribeMessageOptions {
  /** 消息类型 */
  messageType?: string;
  /** 是否需要认证 */
  requireAuth?: boolean;
  /** 是否需要权限验证 */
  requirePermission?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否记录性能指标 */
  recordMetrics?: boolean;
}

/**
 * 权限验证装饰器选项
 *
 * @description 定义权限验证装饰器的配置选项
 */
export interface RequireRolesOptions {
  /** 必需的角色列表 */
  roles: string[];
  /** 是否要求所有角色（默认false，即任一角色即可） */
  requireAll?: boolean;
  /** 自定义错误消息 */
  errorMessage?: string;
}

/**
 * 权限验证装饰器选项
 *
 * @description 定义权限验证装饰器的配置选项
 */
export interface RequirePermissionsOptions {
  /** 必需的权限列表 */
  permissions: string[];
  /** 是否要求所有权限（默认false，即任一权限即可） */
  requireAll?: boolean;
  /** 自定义错误消息 */
  errorMessage?: string;
}

/**
 * 消息验证装饰器选项
 *
 * @description 定义消息验证装饰器的配置选项
 */
export interface ValidateMessageOptions<T = unknown> {
  /** 消息类型构造函数 */
  messageType: new (...args: unknown[]) => T;
  /** 是否严格验证（默认true） */
  strict?: boolean;
  /** 自定义验证器 */
  validator?: (message: T) => boolean;
  /** 自定义错误消息 */
  errorMessage?: string;
}

/**
 * WebSocket消息订阅装饰器
 *
 * @description 标记方法为WebSocket消息处理器
 *
 * @param event - 消息事件名称
 * @param options - 装饰器选项
 * @returns 方法装饰器
 */
export function SubscribeMessage(event: string, options: SubscribeMessageOptions = {}): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // 保存原始方法
    const originalMethod = descriptor.value;

    // 创建包装方法
    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();
      
      try {
        // 执行原始方法
        const result = await originalMethod.apply(this, args);
        
        // 记录性能指标
        if (options.recordMetrics !== false) {
          const duration = Date.now() - startTime;
          console.log(`WebSocket消息处理完成: ${event}, 耗时: ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        console.error(`WebSocket消息处理失败: ${event}`, error);
        throw error;
      }
    };

    // 添加元数据
    Reflect.defineMetadata('websocket:subscribe', {
      event,
      options,
    }, target as object, propertyKey);

    return descriptor;
  };
}

/**
 * 角色权限验证装饰器
 *
 * @description 验证用户是否具有指定的角色权限
 *
 * @param options - 权限验证选项
 * @returns 方法装饰器
 */
export function RequireRoles(options: RequireRolesOptions): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      // 获取WebSocket上下文
      const context = (this as { getWebSocketContext?: () => IWebSocketContext }).getWebSocketContext?.() as IWebSocketContext;
      
      if (!context) {
        throw new Error('无法获取WebSocket上下文');
      }

      // 验证角色权限
      const userRoles = context.userRoles || [];
      const hasRequiredRole = options.requireAll
        ? options.roles.every(role => userRoles.includes(role))
        : options.roles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        throw new Error(
          options.errorMessage || 
          `需要角色权限: ${options.roles.join(', ')}`
        );
      }

      return originalMethod.apply(this, args);
    };

    // 添加元数据
    Reflect.defineMetadata('websocket:requireRoles', options, target as object, propertyKey);

    return descriptor;
  };
}

/**
 * WebSocket权限验证装饰器
 *
 * @description 验证用户是否具有指定的权限
 *
 * @param options - 权限验证选项
 * @returns 方法装饰器
 */
export function RequireWebSocketPermissions(options: RequirePermissionsOptions): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      // 获取WebSocket上下文
      const context = (this as { getWebSocketContext?: () => IWebSocketContext }).getWebSocketContext?.() as IWebSocketContext;
      
      if (!context) {
        throw new Error('无法获取WebSocket上下文');
      }

      // 验证权限
      const userPermissions = context.userPermissions || [];
      const hasRequiredPermission = options.requireAll
        ? options.permissions.every(permission => userPermissions.includes(permission))
        : options.permissions.some(permission => userPermissions.includes(permission));

      if (!hasRequiredPermission) {
        throw new Error(
          options.errorMessage || 
          `需要权限: ${options.permissions.join(', ')}`
        );
      }

      return originalMethod.apply(this, args);
    };

    // 添加元数据
    Reflect.defineMetadata('websocket:requirePermissions', options, target as object, propertyKey);

    return descriptor;
  };
}

/**
 * 消息验证装饰器
 *
 * @description 验证WebSocket消息的格式和内容
 *
 * @param options - 消息验证选项
 * @returns 方法装饰器
 */
export function ValidateMessage<T>(options: ValidateMessageOptions<T>): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      // 获取消息参数（通常是第一个参数）
      const message = args[0];

      if (!message) {
        throw new Error('消息不能为空');
      }

      // 类型验证
      if (options.strict !== false && !(message instanceof options.messageType)) {
        throw new Error(
          options.errorMessage || 
          `消息类型不匹配，期望: ${options.messageType.name}`
        );
      }

      // 自定义验证器
      if (options.validator && !options.validator(message as T)) {
        throw new Error(
          options.errorMessage || 
          '消息验证失败'
        );
      }

      return originalMethod.apply(this, args);
    };

    // 添加元数据
    Reflect.defineMetadata('websocket:validateMessage', options, target as object, propertyKey);

    return descriptor;
  };
}

/**
 * 性能监控装饰器
 *
 * @description 监控WebSocket消息处理的性能
 *
 * @param options - 监控选项
 * @returns 方法装饰器
 */
export function MonitorPerformance(options: { 
  threshold?: number; 
  recordMetrics?: boolean; 
} = {}): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        // 检查性能阈值
        if (options.threshold && duration > options.threshold) {
          console.warn(`WebSocket消息处理耗时过长: ${duration}ms, 阈值: ${options.threshold}ms`);
        }
        
        // 记录性能指标
        if (options.recordMetrics !== false) {
          console.log(`WebSocket消息处理性能: ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`WebSocket消息处理失败，耗时: ${duration}ms`, error);
        throw error;
      }
    };

    // 添加元数据
    Reflect.defineMetadata('websocket:monitorPerformance', options, target as object, propertyKey);

    return descriptor;
  };
}

/**
 * 参数装饰器：WebSocket上下文
 *
 * @description 注入WebSocket上下文参数
 *
 * @returns 参数装饰器
 */
export function WebSocketContext(): ParameterDecorator {
  return function (target: unknown, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 添加元数据
    if (propertyKey) {
      Reflect.defineMetadata('websocket:context', parameterIndex, target as object, propertyKey);
    }
  };
}

/**
 * 参数装饰器：消息体
 *
 * @description 注入WebSocket消息体参数
 *
 * @returns 参数装饰器
 */
export function MessageBody(): ParameterDecorator {
  return function (target: unknown, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 添加元数据
    if (propertyKey) {
      Reflect.defineMetadata('websocket:messageBody', parameterIndex, target as object, propertyKey);
    }
  };
}

/**
 * 参数装饰器：客户端信息
 *
 * @description 注入WebSocket客户端信息参数
 *
 * @returns 参数装饰器
 */
export function WebSocketClient(): ParameterDecorator {
  return function (target: unknown, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 添加元数据
    if (propertyKey) {
      Reflect.defineMetadata('websocket:client', parameterIndex, target as object, propertyKey);
    }
  };
}
