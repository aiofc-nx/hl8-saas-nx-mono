/**
 * 通用消息队列适配器接口
 *
 * @description 消息队列操作的通用接口定义
 * @since 1.0.0
 */

/**
 * 消息处理器类型
 */
export type MessageHandler = (message: any) => Promise<void>;

/**
 * 发布选项
 */
export interface PublishOptions {
  priority?: number;
  delay?: number;
  ttl?: number;
  retryCount?: number;
  headers?: Record<string, any>;
}

/**
 * 订阅选项
 */
export interface SubscribeOptions {
  groupId?: string;
  autoCommit?: boolean;
  fromBeginning?: boolean;
  maxBytes?: number;
  sessionTimeout?: number;
  heartbeatInterval?: number;
}

/**
 * 消息队列适配器接口
 *
 * @description 消息队列操作的通用接口
 *
 * ## 业务规则
 *
 * ### 消息发布规则
 * - 支持异步消息发布
 * - 支持消息优先级
 * - 支持消息延迟
 * - 支持消息重试
 *
 * ### 消息订阅规则
 * - 支持消费者组
 * - 支持消息过滤
 * - 支持消息确认
 * - 支持消息重放
 *
 * ### 可靠性规则
 * - 支持消息持久化
 * - 支持消息去重
 * - 支持消息顺序
 * - 支持消息监控
 */
export interface IMessageQueueAdapter {
  /**
   * 发布消息
   *
   * @description 发布消息到队列
   * @param topic - 主题
   * @param message - 消息内容
   * @param options - 发布选项
   * @returns 发布结果
   */
  publish(topic: string, message: any, options?: PublishOptions): Promise<void>;

  /**
   * 订阅消息
   *
   * @description 订阅主题的消息
   * @param topic - 主题
   * @param handler - 消息处理器
   * @param options - 订阅选项
   * @returns 订阅结果
   */
  subscribe(
    topic: string,
    handler: MessageHandler,
    options?: SubscribeOptions
  ): Promise<void>;

  /**
   * 取消订阅
   *
   * @description 取消订阅主题
   * @param topic - 主题
   * @param handler - 消息处理器
   * @returns 取消订阅结果
   */
  unsubscribe(topic: string, handler: MessageHandler): Promise<void>;

  /**
   * 批量发布消息
   *
   * @description 批量发布多个消息
   * @param topic - 主题
   * @param messages - 消息列表
   * @param options - 发布选项
   * @returns 发布结果
   */
  publishBatch(
    topic: string,
    messages: any[],
    options?: PublishOptions
  ): Promise<void>;

  /**
   * 创建主题
   *
   * @description 创建新的主题
   * @param topic - 主题名称
   * @param partitions - 分区数量
   * @returns 创建结果
   */
  createTopic(topic: string, partitions?: number): Promise<void>;

  /**
   * 删除主题
   *
   * @description 删除主题
   * @param topic - 主题名称
   * @returns 删除结果
   */
  deleteTopic(topic: string): Promise<void>;

  /**
   * 获取主题信息
   *
   * @description 获取主题的详细信息
   * @param topic - 主题名称
   * @returns 主题信息
   */
  getTopicInfo(topic: string): Promise<TopicInfo>;

  /**
   * 检查连接状态
   *
   * @description 检查消息队列连接状态
   * @returns 连接状态
   */
  isConnected(): Promise<boolean>;

  /**
   * 关闭连接
   *
   * @description 关闭消息队列连接
   * @returns 关闭结果
   */
  close(): Promise<void>;
}

/**
 * 主题信息接口
 */
export interface TopicInfo {
  name: string;
  partitions: number;
  replicationFactor: number;
  configs: Record<string, any>;
}

/**
 * 消息队列配置接口
 */
export interface MessageQueueConfig {
  brokers: string[];
  clientId: string;
  groupId?: string;
  ssl?: boolean;
  sasl?: {
    mechanism: string;
    username: string;
    password: string;
  };
  retry?: {
    maxRetries: number;
    retryDelay: number;
  };
  compression?: {
    type: string;
    level: number;
  };
}
