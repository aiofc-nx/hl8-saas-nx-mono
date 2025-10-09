/**
 * 租户配额业务规则
 *
 * @description 租户资源配额的验证和检查规则
 *
 * ## 业务规则
 *
 * ### 配额检查
 * - 用户数配额：当前用户数 vs 最大用户数
 * - 存储配额：当前存储空间 vs 最大存储空间
 * - 组织数配额：当前组织数 vs 最大组织数
 *
 * ### 预警阈值
 * - 警告：达到80%配额
 * - 严重警告：达到90%配额
 * - 阻塞：达到100%配额
 *
 * ### 降级验证
 * - 验证现有数据是否超出新配额
 * - 提供超限数据清理建议
 *
 * @example
 * ```typescript
 * const rule = new TenantQuotaRule();
 *
 * // 检查是否可以添加用户
 * const canAddUser = rule.canAddUser(currentUserCount, quota);
 *
 * // 检查配额使用情况
 * const usage = rule.getQuotaUsage(currentCount, maxCount);
 * ```
 *
 * @class TenantQuotaRule
 * @since 1.0.0
 */

import { TenantQuota } from '../value-objects/tenant-quota.vo';
import { QUOTA_WARNING_THRESHOLDS } from '../../../constants/tenant.constants';

/**
 * 配额使用情况
 *
 * @interface IQuotaUsage
 */
export interface IQuotaUsage {
  /** 当前使用量 */
  current: number;
  /** 最大限制 */
  max: number;
  /** 使用率（0-1） */
  usage: number;
  /** 是否达到警告阈值 */
  isWarning: boolean;
  /** 是否达到严重警告阈值 */
  isCritical: boolean;
  /** 是否已达到或超出配额 */
  isBlocked: boolean;
}

/**
 * 降级验证结果
 *
 * @interface IDowngradeValidation
 */
export interface IDowngradeValidation {
  /** 是否允许降级 */
  canDowngrade: boolean;
  /** 阻塞原因列表 */
  blockingReasons: string[];
  /** 超限的资源类型 */
  exceededResources: string[];
  /** 建议的清理操作 */
  suggestedActions: string[];
}

/**
 * 租户配额业务规则
 *
 * @class TenantQuotaRule
 */
export class TenantQuotaRule {
  /**
   * 检查是否可以添加用户
   *
   * @param {number} currentUserCount - 当前用户数
   * @param {TenantQuota} quota - 租户配额
   * @returns {boolean} 是否可以添加
   */
  public canAddUser(currentUserCount: number, quota: TenantQuota): boolean {
    return currentUserCount < quota.maxUsers;
  }

  /**
   * 检查是否可以添加组织
   *
   * @param {number} currentOrganizationCount - 当前组织数
   * @param {TenantQuota} quota - 租户配额
   * @returns {boolean} 是否可以添加
   */
  public canAddOrganization(
    currentOrganizationCount: number,
    quota: TenantQuota,
  ): boolean {
    return currentOrganizationCount < quota.maxOrganizations;
  }

  /**
   * 检查是否可以上传文件
   *
   * @param {number} currentStorageMB - 当前存储空间（MB）
   * @param {number} fileSizeMB - 文件大小（MB）
   * @param {TenantQuota} quota - 租户配额
   * @returns {boolean} 是否可以上传
   */
  public canUploadFile(
    currentStorageMB: number,
    fileSizeMB: number,
    quota: TenantQuota,
  ): boolean {
    return currentStorageMB + fileSizeMB <= quota.maxStorageMB;
  }

  /**
   * 获取配额使用情况
   *
   * @param {number} current - 当前使用量
   * @param {number} max - 最大限制
   * @returns {IQuotaUsage} 配额使用情况
   */
  public getQuotaUsage(current: number, max: number): IQuotaUsage {
    const usage = max > 0 ? current / max : 0;

    return {
      current,
      max,
      usage,
      isWarning: usage >= QUOTA_WARNING_THRESHOLDS.WARNING,
      isCritical: usage >= QUOTA_WARNING_THRESHOLDS.CRITICAL,
      isBlocked: usage >= QUOTA_WARNING_THRESHOLDS.BLOCKED,
    };
  }

  /**
   * 获取用户配额使用情况
   *
   * @param {number} currentUserCount - 当前用户数
   * @param {TenantQuota} quota - 租户配额
   * @returns {IQuotaUsage} 配额使用情况
   */
  public getUserQuotaUsage(currentUserCount: number, quota: TenantQuota): IQuotaUsage {
    return this.getQuotaUsage(currentUserCount, quota.maxUsers);
  }

  /**
   * 获取存储配额使用情况
   *
   * @param {number} currentStorageMB - 当前存储空间（MB）
   * @param {TenantQuota} quota - 租户配额
   * @returns {IQuotaUsage} 配额使用情况
   */
  public getStorageQuotaUsage(
    currentStorageMB: number,
    quota: TenantQuota,
  ): IQuotaUsage {
    return this.getQuotaUsage(currentStorageMB, quota.maxStorageMB);
  }

  /**
   * 获取组织配额使用情况
   *
   * @param {number} currentOrganizationCount - 当前组织数
   * @param {TenantQuota} quota - 租户配额
   * @returns {IQuotaUsage} 配额使用情况
   */
  public getOrganizationQuotaUsage(
    currentOrganizationCount: number,
    quota: TenantQuota,
  ): IQuotaUsage {
    return this.getQuotaUsage(currentOrganizationCount, quota.maxOrganizations);
  }

  /**
   * 验证降级
   *
   * @description 验证租户是否可以降级到新类型
   *
   * ## 验证规则
   * 1. 检查当前用户数是否超出新配额
   * 2. 检查当前存储空间是否超出新配额
   * 3. 检查当前组织数是否超出新配额
   * 4. 提供清理建议
   *
   * @param {TenantQuota} currentQuota - 当前配额
   * @param {TenantQuota} newQuota - 新配额
   * @param {object} currentUsage - 当前使用情况
   * @returns {IDowngradeValidation} 降级验证结果
   */
  public validateDowngrade(
    currentQuota: TenantQuota,
    newQuota: TenantQuota,
    currentUsage: {
      userCount: number;
      storageMB: number;
      organizationCount: number;
    },
  ): IDowngradeValidation {
    const blockingReasons: string[] = [];
    const exceededResources: string[] = [];
    const suggestedActions: string[] = [];

    // 检查用户数
    if (currentUsage.userCount > newQuota.maxUsers) {
      blockingReasons.push(
        `当前用户数（${currentUsage.userCount}）超出新配额（${newQuota.maxUsers}）`,
      );
      exceededResources.push('users');
      suggestedActions.push(
        `请删除或禁用 ${currentUsage.userCount - newQuota.maxUsers} 个用户`,
      );
    }

    // 检查存储空间
    if (currentUsage.storageMB > newQuota.maxStorageMB) {
      blockingReasons.push(
        `当前存储空间（${currentUsage.storageMB}MB）超出新配额（${newQuota.maxStorageMB}MB）`,
      );
      exceededResources.push('storage');
      suggestedActions.push(
        `请清理 ${currentUsage.storageMB - newQuota.maxStorageMB}MB 存储空间`,
      );
    }

    // 检查组织数
    if (currentUsage.organizationCount > newQuota.maxOrganizations) {
      blockingReasons.push(
        `当前组织数（${currentUsage.organizationCount}）超出新配额（${newQuota.maxOrganizations}）`,
      );
      exceededResources.push('organizations');
      suggestedActions.push(
        `请删除 ${currentUsage.organizationCount - newQuota.maxOrganizations} 个组织`,
      );
    }

    return {
      canDowngrade: blockingReasons.length === 0,
      blockingReasons,
      exceededResources,
      suggestedActions,
    };
  }

  /**
   * 计算剩余配额
   *
   * @description 计算租户还可以使用的资源数量
   *
   * @param {number} current - 当前使用量
   * @param {number} max - 最大限制
   * @returns {number} 剩余配额
   */
  public getRemainingQuota(current: number, max: number): number {
    return Math.max(0, max - current);
  }

  /**
   * 生成配额报告
   *
   * @description 生成租户配额的详细使用报告
   *
   * @param {TenantQuota} quota - 租户配额
   * @param {object} currentUsage - 当前使用情况
   * @returns {object} 配额报告
   */
  public generateQuotaReport(
    quota: TenantQuota,
    currentUsage: {
      userCount: number;
      storageMB: number;
      organizationCount: number;
    },
  ): object {
    return {
      users: this.getUserQuotaUsage(currentUsage.userCount, quota),
      storage: this.getStorageQuotaUsage(currentUsage.storageMB, quota),
      organizations: this.getOrganizationQuotaUsage(
        currentUsage.organizationCount,
        quota,
      ),
      summary: {
        hasWarnings: this.hasWarnings(currentUsage, quota),
        hasCriticalWarnings: this.hasCriticalWarnings(currentUsage, quota),
        isBlocked: this.isBlocked(currentUsage, quota),
      },
    };
  }

  /**
   * 检查是否有配额警告
   *
   * @private
   * @param {object} currentUsage - 当前使用情况
   * @param {TenantQuota} quota - 租户配额
   * @returns {boolean}
   */
  private hasWarnings(
    currentUsage: { userCount: number; storageMB: number; organizationCount: number },
    quota: TenantQuota,
  ): boolean {
    const userUsage = this.getUserQuotaUsage(currentUsage.userCount, quota);
    const storageUsage = this.getStorageQuotaUsage(currentUsage.storageMB, quota);
    const orgUsage = this.getOrganizationQuotaUsage(
      currentUsage.organizationCount,
      quota,
    );

    return userUsage.isWarning || storageUsage.isWarning || orgUsage.isWarning;
  }

  /**
   * 检查是否有严重配额警告
   *
   * @private
   * @param {object} currentUsage - 当前使用情况
   * @param {TenantQuota} quota - 租户配额
   * @returns {boolean}
   */
  private hasCriticalWarnings(
    currentUsage: { userCount: number; storageMB: number; organizationCount: number },
    quota: TenantQuota,
  ): boolean {
    const userUsage = this.getUserQuotaUsage(currentUsage.userCount, quota);
    const storageUsage = this.getStorageQuotaUsage(currentUsage.storageMB, quota);
    const orgUsage = this.getOrganizationQuotaUsage(
      currentUsage.organizationCount,
      quota,
    );

    return userUsage.isCritical || storageUsage.isCritical || orgUsage.isCritical;
  }

  /**
   * 检查是否有配额阻塞
   *
   * @private
   * @param {object} currentUsage - 当前使用情况
   * @param {TenantQuota} quota - 租户配额
   * @returns {boolean}
   */
  private isBlocked(
    currentUsage: { userCount: number; storageMB: number; organizationCount: number },
    quota: TenantQuota,
  ): boolean {
    const userUsage = this.getUserQuotaUsage(currentUsage.userCount, quota);
    const storageUsage = this.getStorageQuotaUsage(currentUsage.storageMB, quota);
    const orgUsage = this.getOrganizationQuotaUsage(
      currentUsage.organizationCount,
      quota,
    );

    return userUsage.isBlocked || storageUsage.isBlocked || orgUsage.isBlocked;
  }
}

