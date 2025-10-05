/**
 * 用户管理模块类型定义
 *
 * 定义用户管理模块中使用的所有类型和接口。
 *
 * @description 用户管理模块的类型定义文件，包含所有核心类型和接口。
 * 提供类型安全和代码提示支持。
 * 支持TypeScript严格模式。
 *
 * @since 1.0.0
 */

import { UserId } from '../domain/value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../domain/value-objects/user-profile.vo';
import { UserStatus } from '@hl8/hybrid-archi';
// import { TenantId } from '@hl8/multi-tenancy';
type TenantId = string;

/**
 * 用户基础信息接口
 */
export interface IUserBasicInfo {
  id: UserId;
  email: Email;
  username: Username;
  profile: UserProfile;
  status: UserStatus;
  tenantId?: TenantId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户创建数据接口
 */
export interface IUserCreateData {
  email: string;
  username: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    timezone?: string;
    language?: string;
  };
  tenantId?: string;
}

/**
 * 用户更新数据接口
 */
export interface IUserUpdateData {
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    timezone?: string;
    language?: string;
  };
  status?: UserStatus;
}

/**
 * 用户认证数据接口
 */
export interface IUserAuthData {
  email: string;
  password: string;
  tenantId?: string;
}

/**
 * 用户查询条件接口
 */
export interface IUserQueryConditions {
  id?: string;
  email?: string;
  username?: string;
  status?: UserStatus;
  tenantId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 用户列表响应接口
 */
export interface IUserListResponse {
  users: IUserBasicInfo[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 用户统计信息接口
 */
export interface IUserStatistics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  disabledUsers: number;
  deletedUsers: number;
  usersByTenant: Record<string, number>;
  usersByStatus: Record<UserStatus, number>;
  usersByMonth: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * 用户权限接口
 */
export interface IUserPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
}

/**
 * 用户操作日志接口
 */
export interface IUserOperationLog {
  id: string;
  userId: UserId;
  operation: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * 用户会话信息接口
 */
export interface IUserSession {
  id: string;
  userId: UserId;
  token: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
}

/**
 * 用户导入数据接口
 */
export interface IUserImportData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId?: string;
  status?: UserStatus;
}

/**
 * 用户导入结果接口
 */
export interface IUserImportResult {
  success: IUserImportData[];
  failed: Array<{
    data: IUserImportData;
    error: string;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

/**
 * 用户导出数据接口
 */
export interface IUserExportData {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 用户批量操作接口
 */
export interface IUserBatchOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'assignTenant';
  userIds: string[];
  data?: Record<string, any>;
}

/**
 * 用户批量操作结果接口
 */
export interface IUserBatchOperationResult {
  success: string[];
  failed: Array<{
    userId: string;
    error: string;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

/**
 * 用户搜索条件接口
 */
export interface IUserSearchConditions {
  keyword?: string;
  status?: UserStatus[];
  tenantId?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'username';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 用户搜索响应接口
 */
export interface IUserSearchResponse {
  users: IUserBasicInfo[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  facets: {
    status: Record<UserStatus, number>;
    tenant: Record<string, number>;
  };
}

/**
 * 用户验证结果接口
 */
export interface IUserValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 用户密码策略接口
 */
export interface IUserPasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPasswords: string[];
  maxAge: number; // 密码最大使用天数
  historyCount: number; // 密码历史记录数量
}

/**
 * 用户密码验证结果接口
 */
export interface IUserPasswordValidationResult {
  isValid: boolean;
  score: number; // 密码强度评分 0-100
  feedback: string[];
  suggestions: string[];
}

/**
 * 用户活动统计接口
 */
export interface IUserActivityStats {
  userId: UserId;
  loginCount: number;
  lastLoginAt?: Date;
  sessionDuration: number; // 总会话时长（分钟）
  pageViews: number;
  actions: number;
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * 用户通知设置接口
 */
export interface IUserNotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  security: boolean;
  system: boolean;
}

/**
 * 用户隐私设置接口
 */
export interface IUserPrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  activityStatus: boolean;
  dataCollection: boolean;
  analytics: boolean;
  thirdPartySharing: boolean;
}

/**
 * 用户偏好设置接口
 */
export interface IUserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: IUserNotificationSettings;
  privacy: IUserPrivacySettings;
}

/**
 * 用户审计日志接口
 */
export interface IUserAuditLog {
  id: string;
  userId: UserId;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  result: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * 用户数据导出格式枚举
 */
export enum UserExportFormat {
  CSV = 'csv',
  Excel = 'excel',
  JSON = 'json',
  PDF = 'pdf',
}

/**
 * 用户排序字段枚举
 */
export enum UserSortField {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Email = 'email',
  Username = 'username',
  Status = 'status',
  LastLoginAt = 'lastLoginAt',
}

/**
 * 用户操作类型枚举
 */
export enum UserOperationType {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Activate = 'activate',
  Deactivate = 'deactivate',
  Login = 'login',
  Logout = 'logout',
  PasswordChange = 'passwordChange',
  ProfileUpdate = 'profileUpdate',
}
