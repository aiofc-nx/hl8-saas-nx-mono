/**
 * 深度部分类型
 *
 * 递归实现 Partial<T> 类型，支持嵌套对象的可选属性设置。
 * 适用于配置对象的部分更新和可选属性定义场景。
 *
 * @description 此类型递归地将所有属性设置为可选，包括嵌套对象和数组。
 * 支持数组类型、只读数组类型和复杂嵌套结构的可选化处理。
 * 提供完整的类型安全保障，确保类型推断的准确性。
 *
 * ## 业务规则
 *
 * ### 递归处理规则
 * - 所有直接属性都变为可选
 * - 嵌套对象递归应用深度部分类型
 * - 数组类型元素递归应用深度部分类型
 * - 只读数组类型保持只读特性
 *
 * ### 类型安全规则
 * - 保持原始类型的结构完整性
 * - 支持类型推断和智能提示
 * - 编译时类型检查确保正确性
 * - 支持泛型约束和类型参数
 *
 * ## 业务逻辑流程
 *
 * 1. **类型检查**：检查属性是否为数组类型
 * 2. **数组处理**：对数组元素递归应用深度部分类型
 * 3. **只读处理**：保持只读数组的只读特性
 * 4. **递归处理**：对嵌套对象递归应用深度部分类型
 * 5. **可选设置**：将所有属性设置为可选
 *
 * @template T 要应用深度部分类型的原始类型
 * @returns 深度部分类型，所有属性都为可选
 *
 * @example
 * ```typescript
 * interface UserConfig {
 *   name: string;
 *   email: string;
 *   settings: {
 *     theme: string;
 *     notifications: boolean;
 *     preferences: {
 *       language: string;
 *       timezone: string;
 *     };
 *   };
 *   tags: string[];
 * }
 *
 * // 使用深度部分类型
 * type PartialUserConfig = DeepPartial<UserConfig>;
 *
 * // 部分配置更新
 * const updateConfig: PartialUserConfig = {
 *   settings: {
 *     preferences: {
 *       language: 'zh-CN'
 *       // 其他属性可选
 *     }
 *     // 其他设置可选
 *   }
 *   // 其他顶级属性可选
 * };
 *
 * // 数组类型处理
 * interface UserList {
 *   users: UserConfig[];
 *   metadata: {
 *     total: number;
 *     page: number;
 *   };
 * }
 *
 * type PartialUserList = DeepPartial<UserList>;
 * // users 数组中的每个元素都是部分类型
 * // metadata 对象的属性都是可选的
 * ```
 *
 * @see {@link https://stackoverflow.com/a/49936686/772859} 原始实现参考
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Readonly<infer U>[]
    ? Readonly<DeepPartial<U>>[]
    : DeepPartial<T[P]>;
};

/**
 * 类型构造函数接口
 *
 * 表示构造函数或类类型，用于依赖注入和类型实例化。
 * 提供类型安全的构造函数签名，支持泛型类型参数。
 *
 * @description 此接口定义了类型构造函数的签名。
 * 继承自 Function 接口，添加了泛型类型参数支持。
 * 适用于依赖注入容器、工厂模式等需要类型实例化的场景。
 *
 * ## 业务规则
 *
 * ### 构造函数规则
 * - 支持任意数量的构造函数参数
 * - 参数类型为 any[]，提供最大灵活性
 * - 返回类型为泛型参数 T，确保类型安全
 * - 支持 new 操作符调用
 *
 * ### 类型安全规则
 * - 泛型参数 T 指定实例化后的类型
 * - 编译时类型检查确保类型一致性
 * - 支持类型推断和智能提示
 * - 运行时类型验证和检查
 *
 * ## 业务逻辑流程
 *
 * 1. **类型定义**：定义泛型类型参数 T
 * 2. **构造函数签名**：定义 new 操作符的签名
 * 3. **参数处理**：接受任意数量和类型的参数
 * 4. **实例创建**：创建类型 T 的实例
 * 5. **类型返回**：返回正确类型的实例
 *
 * @template T 要实例化的类型，默认为 any
 * @returns 构造函数接口，支持泛型类型参数
 *
 * @example
 * ```typescript
 * import { Type } from '@hl8/common';
 *
 * // 定义服务类
 * class UserService {
 *   constructor(private config: any) {}
 *   getUser(id: string) {
 *     return { id, name: 'John Doe' };
 *   }
 * }
 *
 * // 使用类型接口
 * const UserServiceType: Type<UserService> = UserService;
 *
 * // 依赖注入容器使用
 * class Container {
 *   private instances = new Map<Type<any>, any>();
 *
 *   register<T>(type: Type<T>, factory: () => T) {
 *     this.instances.set(type, factory());
 *   }
 *
 *   get<T>(type: Type<T>): T {
 *     return this.instances.get(type);
 *   }
 * }
 *
 * // 注册服务
 * const container = new Container();
 * container.register(UserServiceType, () => new UserService({}));
 *
 * // 获取服务实例
 * const userService = container.get(UserServiceType);
 * console.log(userService.getUser('123')); // { id: '123', name: 'John Doe' }
 *
 * // 工厂模式使用
 * function createService<T>(ServiceClass: Type<T>, ...args: any[]): T {
 *   return new ServiceClass(...args);
 * }
 *
 * const service = createService(UserService, { database: 'postgres' });
 * ```
 */
export interface Type<T = any> extends Function {
  /**
   * 构造函数签名
   *
   * 创建类型 T 的新实例，支持任意数量和类型的参数。
   * 提供类型安全的实例化机制，确保返回正确类型的实例。
   *
   * @param args 传递给构造函数的参数列表
   * @returns T 类型的新实例
   */
  new (...args: any[]): T;
}

/**
 * 应用程序插件配置接口
 *
 * 定义应用程序插件配置的完整结构，支持嵌套配置和类型安全。
 * 提供统一的配置管理接口，支持多模块配置和功能开关。
 *
 * @description 此接口定义了应用程序的完整配置结构。
 * 包含 API、数据库、认证、资源文件、日志、功能开关等配置项。
 * 支持可选配置和嵌套结构，提供灵活的配置管理能力。
 *
 * ## 业务规则
 *
 * ### 配置结构规则
 * - 所有配置项都是可选的，提供默认值支持
 * - 支持嵌套配置结构，便于模块化管理
 * - 配置项类型安全，支持 TypeScript 类型检查
 * - 支持配置验证和默认值设置
 *
 * ### 模块化配置规则
 * - API 配置：服务器和客户端相关配置
 * - 数据库配置：数据持久化相关配置
 * - 认证配置：身份验证和授权相关配置
 * - 资源配置：静态资源和文件管理配置
 * - 日志配置：日志记录和监控配置
 * - 功能配置：功能开关和特性控制配置
 *
 * ### 类型安全规则
 * - 所有配置项都有明确的类型定义
 * - 支持编译时类型检查和智能提示
 * - 配置项与业务需求完全匹配
 * - 支持配置项的可选性和默认值
 *
 * ## 业务逻辑流程
 *
 * 1. **配置加载**：从配置文件或环境变量加载配置
 * 2. **配置验证**：验证配置项的完整性和有效性
 * 3. **默认值设置**：为缺失的配置项设置默认值
 * 4. **模块配置**：将配置分配给相应的功能模块
 * 5. **运行时使用**：在应用运行时使用配置项
 *
 * @example
 * ```typescript
 * import { ApplicationPluginConfig } from '@hl8/common';
 *
 * // 完整的应用配置
 * const appConfig: ApplicationPluginConfig = {
 *   api: {
 *     port: 3000,
 *     host: 'localhost',
 *     baseUrl: 'http://localhost:3000',
 *     clientBaseUrl: 'http://localhost:3001',
 *     production: false,
 *     envName: 'development'
 *   },
 *   database: {
 *     mikroOrm: {
 *       type: 'postgresql',
 *       host: 'localhost',
 *       port: 5432,
 *       database: 'hl8_saas',
 *       username: 'postgres',
 *       password: 'password'
 *     }
 *   },
 *   auth: {
 *     jwtSecret: 'your-jwt-secret',
 *     jwtExpirationTime: 3600,
 *     jwtRefreshSecret: 'your-refresh-secret',
 *     jwtRefreshExpirationTime: 86400,
 *     passwordSaltRounds: 12
 *   },
 *   assets: {
 *     assetPath: './assets',
 *     assetPublicPath: '/assets'
 *   },
 *   logging: {
 *     level: 'info',
 *     enableRequestLogging: true,
 *     enableResponseLogging: true
 *   },
 *   features: {
 *     multiTenant: true,
 *     userRegistration: true,
 *     emailPasswordLogin: true,
 *     magicLogin: false
 *   }
 * };
 *
 * // 部分配置（使用默认值）
 * const minimalConfig: ApplicationPluginConfig = {
 *   api: {
 *     port: 8080,
 *     production: true
 *   },
 *   features: {
 *     multiTenant: false
 *   }
 * };
 * ```
 */
export interface ApplicationPluginConfig {
  /** API配置 - 服务器和客户端相关配置 */
  api?: {
    /** 服务器端口 */
    port?: number;
    /** 服务器主机地址 */
    host?: string;
    /** API 基础 URL */
    baseUrl?: string;
    /** 客户端基础 URL */
    clientBaseUrl?: string;
    /** 是否为生产环境 */
    production?: boolean;
    /** 环境名称 */
    envName?: string;
  };

  /** 数据库配置 - 数据持久化相关配置 */
  database?: {
    /** MikroORM 配置 */
    mikroOrm?: {
      /** 数据库类型 */
      type?: string;
      /** 数据库主机 */
      host?: string;
      /** 数据库端口 */
      port?: number;
      /** 数据库名称 */
      database?: string;
      /** 用户名 */
      username?: string;
      /** 密码 */
      password?: string;
      /** 其他配置选项 */
      [key: string]: unknown;
    };
  };

  /** 认证配置 - 身份验证和授权相关配置 */
  auth?: {
    /** JWT 密钥 */
    jwtSecret?: string;
    /** JWT 过期时间（秒） */
    jwtExpirationTime?: number;
    /** JWT 刷新密钥 */
    jwtRefreshSecret?: string;
    /** JWT 刷新过期时间（秒） */
    jwtRefreshExpirationTime?: number;
    /** 密码盐轮数 */
    passwordSaltRounds?: number;
  };

  /** 资源文件配置 - 静态资源和文件管理配置 */
  assets?: {
    /** 资源文件路径 */
    assetPath?: string;
    /** 资源文件公共路径 */
    assetPublicPath?: string;
  };

  /** 日志配置 - 日志记录和监控配置 */
  logging?: {
    /** 日志级别 */
    level?: string;
    /** 是否启用请求日志 */
    enableRequestLogging?: boolean;
    /** 是否启用响应日志 */
    enableResponseLogging?: boolean;
  };

  /** 功能开关配置 - 功能开关和特性控制配置 */
  features?: {
    /** 是否启用多租户 */
    multiTenant?: boolean;
    /** 是否启用用户注册 */
    userRegistration?: boolean;
    /** 是否启用邮箱密码登录 */
    emailPasswordLogin?: boolean;
    /** 是否启用魔法登录 */
    magicLogin?: boolean;
  };
}
