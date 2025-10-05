/**
 * 租户领域服务
 * 
 * @description 处理租户相关的跨聚合业务逻辑
 * 负责租户的唯一性验证、资源使用统计等复杂业务规则
 * 
 * @since 1.0.0
 */

import { TenantId } from '@hl8/hybrid-archi';
import { TenantType } from '../tenant/entities/tenant.entity';

/**
 * 租户仓储接口
 * 
 * @description 定义租户数据访问接口
 */
export interface ITenantRepository {
  findByCode(code: string): Promise<any>;
  countByType(type: TenantType): Promise<number>;
  getResourceUsage(tenantId: TenantId): Promise<ResourceUsage>;
}

/**
 * 资源使用情况接口
 * 
 * @description 定义租户资源使用情况
 */
export interface ResourceUsage {
  userCount: number;
  organizationCount: number;
  storageUsed: number; // MB
  apiCallsToday: number;
}

/**
 * 租户领域服务
 * 
 * @description 处理租户相关的复杂业务逻辑
 */
export class TenantDomainService {
  constructor(
    private readonly tenantRepository: ITenantRepository
  ) {}

  /**
   * 验证租户代码唯一性
   * 
   * @param code 租户代码
   * @returns true如果代码唯一，否则false
   */
  public async validateTenantCodeUniqueness(code: string): Promise<boolean> {
    const existingTenant = await this.tenantRepository.findByCode(code);
    return existingTenant === null;
  }

  /**
   * 验证租户类型数量限制
   * 
   * @description 验证系统中某种类型租户的数量是否超出限制
   * 
   * @param type 租户类型
   * @param maxCount 最大数量限制
   * @returns true如果未超出限制，否则false
   */
  public async validateTenantTypeLimit(type: TenantType, maxCount: number): Promise<boolean> {
    const currentCount = await this.tenantRepository.countByType(type);
    return currentCount < maxCount;
  }

  /**
   * 检查租户资源使用情况
   * 
   * @param tenantId 租户ID
   * @returns 资源使用情况
   */
  public async checkResourceUsage(tenantId: TenantId): Promise<ResourceUsage> {
    return await this.tenantRepository.getResourceUsage(tenantId);
  }

  /**
   * 验证租户是否可以创建新用户
   * 
   * @param tenantId 租户ID
   * @param maxUsers 最大用户数限制
   * @returns true如果可以创建，否则false
   */
  public async canCreateUser(tenantId: TenantId, maxUsers: number): Promise<boolean> {
    if (maxUsers === -1) return true; // 无限制
    
    const usage = await this.checkResourceUsage(tenantId);
    return usage.userCount < maxUsers;
  }

  /**
   * 验证租户是否可以创建新组织
   * 
   * @param tenantId 租户ID
   * @param maxOrganizations 最大组织数限制
   * @returns true如果可以创建，否则false
   */
  public async canCreateOrganization(tenantId: TenantId, maxOrganizations: number): Promise<boolean> {
    if (maxOrganizations === -1) return true; // 无限制
    
    const usage = await this.checkResourceUsage(tenantId);
    return usage.organizationCount < maxOrganizations;
  }

  /**
   * 验证租户是否可以执行API调用
   * 
   * @param tenantId 租户ID
   * @param maxApiCalls 最大API调用次数限制
   * @returns true如果可以执行，否则false
   */
  public async canMakeApiCall(tenantId: TenantId, maxApiCalls: number): Promise<boolean> {
    if (maxApiCalls === -1) return true; // 无限制
    
    const usage = await this.checkResourceUsage(tenantId);
    return usage.apiCallsToday < maxApiCalls;
  }

  /**
   * 计算租户资源使用百分比
   * 
   * @param tenantId 租户ID
   * @param limits 资源限制
   * @returns 资源使用百分比
   */
  public async calculateResourceUsagePercentage(
    tenantId: TenantId, 
    limits: { maxUsers: number; maxOrganizations: number; maxStorage: number; maxApiCalls: number }
  ): Promise<{ userPercentage: number; orgPercentage: number; storagePercentage: number; apiPercentage: number }> {
    const usage = await this.checkResourceUsage(tenantId);
    
    const calculatePercentage = (used: number, limit: number): number => {
      if (limit === -1) return 0; // 无限制
      return Math.round((used / limit) * 100);
    };
    
    return {
      userPercentage: calculatePercentage(usage.userCount, limits.maxUsers),
      orgPercentage: calculatePercentage(usage.organizationCount, limits.maxOrganizations),
      storagePercentage: calculatePercentage(usage.storageUsed, limits.maxStorage),
      apiPercentage: calculatePercentage(usage.apiCallsToday, limits.maxApiCalls)
    };
  }
}
