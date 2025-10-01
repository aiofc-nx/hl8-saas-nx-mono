/**
 * 基础基础设施接口
 *
 * 定义业务模块所需的通用基础设施功能接口。
 * 提供统一的基础设施契约，不包含具体的实现逻辑。
 *
 * @description 通用基础设施功能组件接口
 * @since 1.0.0
 */

import { EntityId } from '../../domain/value-objects/entity-id';

/**
 * 基础设施服务状态
 */
export enum InfrastructureServiceStatus {
  /** 未初始化 */
  NOT_INITIALIZED = 'not_initialized',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 运行中 */
  RUNNING = 'running',
  /** 停止中 */
  STOPPING = 'stopping',
  /** 已停止 */
  STOPPED = 'stopped',
  /** 错误状态 */
  ERROR = 'error',
}

/**
 * 基础设施服务健康状态
 */
export interface IInfrastructureHealth {
  /** 服务是否健康 */
  healthy: boolean;
  /** 服务状态 */
  status: InfrastructureServiceStatus;
  /** 最后检查时间 */
  lastChecked: Date;
  /** 错误信息 */
  error?: string;
  /** 服务详情 */
  details?: Record<string, unknown>;
}

/**
 * 基础基础设施服务接口
 *
 * 定义业务模块所需的通用基础设施功能
 */
export interface IBaseInfrastructureService {
  /**
   * 服务标识符
   */
  readonly serviceId: string;

  /**
   * 服务名称
   */
  readonly serviceName: string;

  /**
   * 服务版本
   */
  readonly serviceVersion: string;

  /**
   * 初始化服务
   *
   * @returns Promise<void>
   */
  initialize(): Promise<void>;

  /**
   * 启动服务
   *
   * @returns Promise<void>
   */
  start(): Promise<void>;

  /**
   * 停止服务
   *
   * @returns Promise<void>
   */
  stop(): Promise<void>;

  /**
   * 健康检查
   *
   * @returns Promise<IInfrastructureHealth>
   */
  healthCheck(): Promise<IInfrastructureHealth>;

  /**
   * 获取服务状态
   *
   * @returns InfrastructureServiceStatus
   */
  getStatus(): InfrastructureServiceStatus;

  /**
   * 获取服务配置
   *
   * @returns Record<string, unknown>
   */
  getConfiguration(): Record<string, unknown>;
}

/**
 * 基础设施服务管理器接口
 *
 * 定义业务模块所需的通用基础设施管理功能
 */
export interface IInfrastructureServiceManager {
  /**
   * 注册基础设施服务
   *
   * @param service - 基础设施服务
   */
  registerService(service: IBaseInfrastructureService): void;

  /**
   * 注销基础设施服务
   *
   * @param serviceId - 服务标识符
   */
  unregisterService(serviceId: string): void;

  /**
   * 获取基础设施服务
   *
   * @param serviceId - 服务标识符
   * @returns 基础设施服务
   */
  getService(serviceId: string): IBaseInfrastructureService | undefined;

  /**
   * 获取所有基础设施服务
   *
   * @returns 基础设施服务列表
   */
  getAllServices(): IBaseInfrastructureService[];

  /**
   * 启动所有基础设施服务
   *
   * @returns Promise<void>
   */
  startAllServices(): Promise<void>;

  /**
   * 停止所有基础设施服务
   *
   * @returns Promise<void>
   */
  stopAllServices(): Promise<void>;

  /**
   * 健康检查所有服务
   *
   * @returns Promise<Record<string, IInfrastructureHealth>>
   */
  healthCheckAllServices(): Promise<Record<string, IInfrastructureHealth>>;
}
