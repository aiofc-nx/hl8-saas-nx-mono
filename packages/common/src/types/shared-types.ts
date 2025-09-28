/**
 * A recursive implementation of the Partial<T> type.
 * Source: https://stackoverflow.com/a/49936686/772859
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Readonly<infer U>[]
    ? Readonly<DeepPartial<U>>[]
    : DeepPartial<T[P]>;
};

/**
 * Represents a constructor function or class type.
 * @template T - Type to be instantiated.
 */
export interface Type<T = any> extends Function {
  /**
   * Constructor signature.
   * Creates a new instance of type T with the provided arguments.
   * @param {...any[]} args - Arguments to be passed to the constructor.
   * @returns {T} - An instance of type T.
   */
  new (...args: any[]): T;
}

/**
 * 应用程序插件配置接口
 *
 * @description 定义应用程序插件配置的结构
 * 用于配置管理模块，支持嵌套配置和类型安全
 */
export interface ApplicationPluginConfig {
  /** API配置 */
  api?: {
    port?: number;
    host?: string;
    baseUrl?: string;
    clientBaseUrl?: string;
    production?: boolean;
    envName?: string;
  };
  
  /** 数据库配置 */
  database?: {
    mikroOrm?: any;
  };
  
  /** 认证配置 */
  auth?: {
    jwtSecret?: string;
    jwtExpirationTime?: number;
    jwtRefreshSecret?: string;
    jwtRefreshExpirationTime?: number;
    passwordSaltRounds?: number;
  };
  
  /** 资源文件配置 */
  assets?: {
    assetPath?: string;
    assetPublicPath?: string;
  };
  
  /** 日志配置 */
  logging?: {
    level?: string;
    enableRequestLogging?: boolean;
    enableResponseLogging?: boolean;
  };
  
  /** 功能开关配置 */
  features?: {
    multiTenant?: boolean;
    userRegistration?: boolean;
    emailPasswordLogin?: boolean;
    magicLogin?: boolean;
  };
}
