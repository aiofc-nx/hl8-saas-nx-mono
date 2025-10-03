/**
 * 通用邮件服务适配器接口
 *
 * @description 邮件服务的通用接口定义
 * @since 1.0.0
 */

/**
 * 邮件消息接口
 */
export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  content: string;
  htmlContent?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

/**
 * 模板邮件消息接口
 */
export interface TemplateEmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  templateId: string;
  templateData: Record<string, any>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

/**
 * 邮件附件接口
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  cid?: string;
}

/**
 * 邮件发送结果接口
 */
export interface EmailSendResult {
  messageId: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  timestamp: Date;
}

/**
 * 邮件服务适配器接口
 *
 * @description 邮件服务的通用接口
 *
 * ## 业务规则
 *
 * ### 邮件发送规则
 * - 支持单封邮件发送
 * - 支持批量邮件发送
 * - 支持模板邮件发送
 * - 支持邮件附件
 *
 * ### 邮件验证规则
 * - 支持邮件地址格式验证
 * - 支持邮件地址存在性验证
 * - 支持邮件地址黑名单检查
 * - 支持邮件地址白名单检查
 *
 * ### 邮件模板规则
 * - 支持HTML模板
 * - 支持文本模板
 * - 支持模板变量替换
 * - 支持模板版本管理
 */
export interface IEmailServiceAdapter {
  /**
   * 发送邮件
   *
   * @description 发送单封邮件
   * @param email - 邮件信息
   * @returns 发送结果
   */
  sendEmail(email: EmailMessage): Promise<EmailSendResult>;

  /**
   * 批量发送邮件
   *
   * @description 批量发送多封邮件
   * @param emails - 邮件列表
   * @returns 发送结果
   */
  sendBatchEmails(emails: EmailMessage[]): Promise<EmailSendResult[]>;

  /**
   * 发送模板邮件
   *
   * @description 使用模板发送邮件
   * @param templateEmail - 模板邮件信息
   * @returns 发送结果
   */
  sendTemplateEmail(
    templateEmail: TemplateEmailMessage
  ): Promise<EmailSendResult>;

  /**
   * 验证邮件地址
   *
   * @description 验证邮件地址的有效性
   * @param email - 邮件地址
   * @returns 验证结果
   */
  validateEmail(email: string): Promise<boolean>;

  /**
   * 获取发送状态
   *
   * @description 获取邮件的发送状态
   * @param messageId - 消息ID
   * @returns 发送状态
   */
  getSendStatus(messageId: string): Promise<EmailSendResult>;

  /**
   * 获取发送统计
   *
   * @description 获取邮件发送统计信息
   * @param fromDate - 开始日期
   * @param toDate - 结束日期
   * @returns 统计信息
   */
  getSendStats(fromDate: Date, toDate: Date): Promise<EmailSendStats>;

  /**
   * 检查服务状态
   *
   * @description 检查邮件服务状态
   * @returns 服务状态
   */
  isHealthy(): Promise<boolean>;

  /**
   * 关闭服务
   *
   * @description 关闭邮件服务连接
   * @returns 关闭结果
   */
  close(): Promise<void>;
}

/**
 * 邮件发送统计信息接口
 */
export interface EmailSendStats {
  totalSent: number;
  totalFailed: number;
  successRate: number;
  averageDeliveryTime: number;
  topRecipients: Array<{ email: string; count: number }>;
  topTemplates: Array<{ templateId: string; count: number }>;
}

/**
 * 邮件服务配置接口
 */
export interface EmailServiceConfig {
  provider: 'smtp' | 'sendgrid' | 'ses' | 'mailgun';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  ssl?: boolean;
  tls?: boolean;
  rateLimit?: {
    maxPerSecond: number;
    maxPerDay: number;
  };
  retry?: {
    maxRetries: number;
    retryDelay: number;
  };
}
