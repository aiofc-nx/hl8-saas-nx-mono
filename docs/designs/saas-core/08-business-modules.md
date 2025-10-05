# SAAS-CORE 业务功能模块开发

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 租户资源限制系统](#1-租户资源限制系统)
- [2. 租户升级降级流程](#2-租户升级降级流程)
- [3. 业务流程引擎](#3-业务流程引擎)
- [4. 业务规则引擎](#4-业务规则引擎)
- [5. 资源使用量监控和告警](#5-资源使用量监控和告警)
- [6. 业务异常处理机制](#6-业务异常处理机制)
- [7. CASL权限管理](#7-casl权限管理)
- [8. 代码示例](#8-代码示例)

---

## 1. 租户资源限制系统

### 1.1 资源限制值对象

```typescript
// src/domain/value-objects/resource-limits.vo.ts
export interface ResourceLimitsProps {
  maxUsers: number;        // -1 表示无限制
  maxStorage: number;      // GB
  maxOrganizations: number;
  maxDepartments: number;
  maxApiCalls: number;     // 每月
  maxDataTransfer: number; // GB 每月
}

export class ResourceLimits extends BaseValueObject<ResourceLimitsProps> {
  private constructor(props: ResourceLimitsProps) {
    super(props);
    this.validate();
  }

  public static create(props: ResourceLimitsProps): ResourceLimits {
    return new ResourceLimits(props);
  }

  private validate(): void {
    const limits = Object.values(this.props);
    for (const limit of limits) {
      if (typeof limit === 'number' && limit < -1) {
        throw new InvalidResourceLimitsException('资源限制不能小于-1');
      }
    }
  }

  public hasLimit(resource: keyof ResourceLimitsProps): boolean {
    return this.props[resource] !== -1;
  }

  public getLimit(resource: keyof ResourceLimitsProps): number {
    return this.props[resource];
  }

  public isExceeded(resource: keyof ResourceLimitsProps, currentUsage: number): boolean {
    const limit = this.props[resource];
    return limit !== -1 && currentUsage >= limit;
  }
}
```

### 1.2 资源使用量值对象

```typescript
// src/domain/value-objects/resource-usage.vo.ts
export interface ResourceUsageProps {
  userCount: number;
  storageUsed: number;        // GB
  organizationCount: number;
  departmentCount: number;
  apiCallsThisMonth: number;
  dataTransferThisMonth: number; // GB
}

export class ResourceUsage extends BaseValueObject<ResourceUsageProps> {
  private constructor(props: ResourceUsageProps) {
    super(props);
    this.validate();
  }

  public static create(props: ResourceUsageProps): ResourceUsage {
    return new ResourceUsage(props);
  }

  private validate(): void {
    const usage = Object.values(this.props);
    for (const value of usage) {
      if (typeof value === 'number' && value < 0) {
        throw new InvalidResourceUsageException('资源使用量不能为负数');
      }
    }
  }

  public getUsage(resource: keyof ResourceUsageProps): number {
    return this.props[resource];
  }

  public updateUsage(resource: keyof ResourceUsageProps, value: number): ResourceUsage {
    return ResourceUsage.create({ ...this.props, [resource]: value });
  }
}
```

---

## 2. 租户升级降级流程

### 2.1 升级降级用例

```typescript
// src/application/use-cases/upgrade-tenant.use-case.ts
export class UpgradeTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus,
    private readonly tenantDomainService: TenantDomainService,
    private readonly dataSource: DataSource
  ) {}

  async execute(request: UpgradeTenantRequest): Promise<UpgradeTenantResponse> {
    return await this.dataSource.transaction(async () => {
      // 1. 获取租户聚合根
      const tenantAggregate = await this.tenantRepository.findById(request.tenantId);
      if (!tenantAggregate) {
        throw new TenantNotFoundException(`租户 ${request.tenantId} 不存在`);
      }

      // 2. 验证升级规则
      const currentType = tenantAggregate.getTenant().getType();
      if (!this.canUpgradeTo(currentType, request.targetType)) {
        throw new InvalidUpgradeException(`不能从 ${currentType} 升级到 ${request.targetType}`);
      }

      // 3. 检查资源使用情况
      const currentUsage = await this.tenantDomainService.checkResourceUsage(request.tenantId);
      const targetLimits = DEFAULT_RESOURCE_LIMITS[request.targetType];

      // 验证资源限制
      if (targetLimits.maxUsers !== -1 && currentUsage.userCount > targetLimits.maxUsers) {
        throw new ResourceLimitExceededException('当前用户数量超过目标类型的限制');
      }

      // 4. 执行升级
      tenantAggregate.upgrade(request.targetType);

      // 5. 持久化变更
      await this.tenantRepository.save(tenantAggregate);

      // 6. 发布领域事件
      await this.eventBus.publishAll(tenantAggregate.getUncommittedEvents());

      return new UpgradeTenantResponse(request.tenantId, currentType, request.targetType);
    });
  }

  private canUpgradeTo(currentType: TenantType, targetType: TenantType): boolean {
    const upgradeMatrix: Record<TenantType, TenantType[]> = {
      [TENANT_TYPES.FREE]: [TENANT_TYPES.BASIC, TENANT_TYPES.PROFESSIONAL, TENANT_TYPES.ENTERPRISE],
      [TENANT_TYPES.BASIC]: [TENANT_TYPES.PROFESSIONAL, TENANT_TYPES.ENTERPRISE],
      [TENANT_TYPES.PROFESSIONAL]: [TENANT_TYPES.ENTERPRISE],
      [TENANT_TYPES.ENTERPRISE]: [],
      [TENANT_TYPES.CUSTOM]: []
    };

    return upgradeMatrix[currentType]?.includes(targetType) || false;
  }
}
```

---

## 3. 业务流程引擎

### 3.1 业务流程引擎核心

```typescript
// src/application/services/business-process-engine.service.ts
export interface ProcessStep {
  id: string;
  name: string;
  execute: (context: ProcessContext) => Promise<ProcessResult>;
  rollback?: (context: ProcessContext) => Promise<void>;
}

export interface ProcessContext {
  [key: string]: any;
}

export interface ProcessResult {
  success: boolean;
  data?: any;
  error?: Error;
}

@Injectable()
export class BusinessProcessEngine {
  constructor(
    private readonly eventBus: IEventBus,
    private readonly logger: ILoggerPort
  ) {}

  async executeProcess(processId: string, steps: ProcessStep[], context: ProcessContext): Promise<ProcessResult> {
    const processState = {
      id: processId,
      status: 'running',
      currentStep: 0,
      completedSteps: [],
      failedStep: null,
      context
    };

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        processState.currentStep = i;

        this.logger.info(`执行流程步骤: ${step.name}`, { processId, stepId: step.id });

        const result = await step.execute(context);
        
        if (!result.success) {
          processState.status = 'failed';
          processState.failedStep = step.id;
          
          // 执行回滚
          await this.rollbackProcess(processState, steps);
          
          return { success: false, error: result.error };
        }

        processState.completedSteps.push(step.id);
        context = { ...context, ...result.data };
      }

      processState.status = 'completed';
      this.logger.info(`流程执行完成: ${processId}`);

      return { success: true, data: context };

    } catch (error) {
      processState.status = 'error';
      processState.failedStep = steps[processState.currentStep]?.id;
      
      await this.rollbackProcess(processState, steps);
      
      return { success: false, error };
    }
  }

  private async rollbackProcess(processState: any, steps: ProcessStep[]): Promise<void> {
    this.logger.info(`开始回滚流程: ${processState.id}`);

    for (let i = processState.completedSteps.length - 1; i >= 0; i--) {
      const stepId = processState.completedSteps[i];
      const step = steps.find(s => s.id === stepId);
      
      if (step && step.rollback) {
        try {
          await step.rollback(processState.context);
          this.logger.info(`回滚步骤成功: ${step.name}`);
        } catch (error) {
          this.logger.error(`回滚步骤失败: ${step.name}`, { error });
        }
      }
    }
  }
}
```

### 3.2 用户注册流程

```typescript
// src/application/processes/user-registration.process.ts
export class UserRegistrationProcess {
  constructor(
    private readonly businessProcessEngine: BusinessProcessEngine,
    private readonly userRepository: IUserRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(userData: UserRegistrationData): Promise<ProcessResult> {
    const steps: ProcessStep[] = [
      {
        id: 'validate-user-data',
        name: '验证用户数据',
        execute: async (context) => {
          // 验证用户数据
          const isValid = this.validateUserData(userData);
          if (!isValid) {
            return { success: false, error: new InvalidUserDataException('用户数据无效') };
          }
          return { success: true, data: { userData } };
        }
      },
      {
        id: 'create-user',
        name: '创建用户',
        execute: async (context) => {
          const userAggregate = UserAggregate.create(
            UserId.generate(),
            userData.email,
            userData.username,
            userData.password,
            UserProfile.create({
              firstName: userData.firstName,
              lastName: userData.lastName,
              timezone: userData.timezone || 'UTC',
              locale: userData.locale || 'zh-CN',
              preferences: {}
            })
          );

          await this.userRepository.save(userAggregate);
          return { success: true, data: { userAggregate } };
        },
        rollback: async (context) => {
          // 删除已创建的用户
          if (context.userAggregate) {
            await this.userRepository.delete(context.userAggregate.getUserId());
          }
        }
      },
      {
        id: 'send-welcome-email',
        name: '发送欢迎邮件',
        execute: async (context) => {
          await this.emailService.sendWelcomeEmail(
            userData.email,
            `${userData.firstName} ${userData.lastName}`,
            '欢迎注册'
          );
          return { success: true };
        }
      }
    ];

    return await this.businessProcessEngine.executeProcess(
      `user-registration-${Date.now()}`,
      steps,
      { userData }
    );
  }

  private validateUserData(userData: UserRegistrationData): boolean {
    // 验证逻辑
    return !!(userData.email && userData.username && userData.password);
  }
}
```

---

## 4. 业务规则引擎

### 4.1 业务规则引擎核心

```typescript
// src/application/services/business-rules-engine.service.ts
export interface BusinessRule {
  id: string;
  name: string;
  priority: number;
  condition: (context: RuleContext) => boolean | Promise<boolean>;
  action: (context: RuleContext) => RuleResult | Promise<RuleResult>;
}

export interface RuleContext {
  [key: string]: any;
}

export interface RuleResult {
  success: boolean;
  message?: string;
  data?: any;
}

@Injectable()
export class BusinessRulesEngine {
  private rules: Map<string, BusinessRule[]> = new Map();

  constructor(private readonly logger: ILoggerPort) {}

  registerRules(domain: string, rules: BusinessRule[]): void {
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);
    this.rules.set(domain, sortedRules);
  }

  async executeRules(domain: string, context: RuleContext): Promise<RuleResult[]> {
    const domainRules = this.rules.get(domain) || [];
    const results: RuleResult[] = [];

    for (const rule of domainRules) {
      try {
        const conditionMet = await rule.condition(context);
        
        if (conditionMet) {
          const result = await rule.action(context);
          results.push(result);
          
          this.logger.info(`业务规则执行: ${rule.name}`, { 
            domain, 
            ruleId: rule.id, 
            result: result.success 
          });

          // 如果规则失败，根据优先级决定是否继续
          if (!result.success && rule.priority >= 100) {
            break; // 高优先级规则失败，停止执行
          }
        }
      } catch (error) {
        this.logger.error(`业务规则执行错误: ${rule.name}`, { domain, ruleId: rule.id, error });
        results.push({ success: false, message: `规则执行错误: ${error.message}` });
      }
    }

    return results;
  }
}
```

### 4.2 租户规则定义

```typescript
// src/application/rules/tenant-rules.ts
export class TenantRules {
  constructor(private readonly rulesEngine: BusinessRulesEngine) {
    this.registerTenantRules();
  }

  private registerTenantRules(): void {
    const rules: BusinessRule[] = [
      {
        id: 'tenant-code-unique',
        name: '租户代码唯一性检查',
        priority: 100,
        condition: (context) => {
          return !!(context.code && typeof context.code === 'string');
        },
        action: async (context) => {
          // 这里应该调用领域服务检查唯一性
          const isUnique = await context.tenantDomainService.validateTenantCodeUniqueness(context.code);
          if (!isUnique) {
            return { success: false, message: '租户代码已存在' };
          }
          return { success: true };
        }
      },
      {
        id: 'tenant-name-not-empty',
        name: '租户名称非空检查',
        priority: 90,
        condition: (context) => {
          return !!(context.name && context.name.trim().length > 0);
        },
        action: (context) => {
          return { success: true };
        }
      },
      {
        id: 'tenant-resource-limits',
        name: '租户资源限制检查',
        priority: 80,
        condition: (context) => {
          return !!(context.tenantType && context.currentUsage);
        },
        action: (context) => {
          const limits = DEFAULT_RESOURCE_LIMITS[context.tenantType];
          const usage = context.currentUsage;

          if (limits.maxUsers !== -1 && usage.userCount >= limits.maxUsers) {
            return { success: false, message: '用户数量已达到限制' };
          }

          return { success: true };
        }
      }
    ];

    this.rulesEngine.registerRules('tenant', rules);
  }
}
```

---

## 5. 资源使用量监控和告警

### 5.1 资源监控服务

```typescript
// src/application/services/resource-monitoring.service.ts
export interface ResourceAlert {
  id: string;
  tenantId: string;
  resourceType: string;
  currentUsage: number;
  limit: number;
  threshold: number;
  alertLevel: 'warning' | 'critical';
  timestamp: Date;
}

@Injectable()
export class ResourceMonitoringService {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly tenantDomainService: TenantDomainService,
    private readonly alertService: AlertService,
    private readonly logger: ILoggerPort
  ) {}

  async monitorTenantResources(tenantId: string): Promise<ResourceAlert[]> {
    const tenantAggregate = await this.tenantRepository.findById(TenantId.create(tenantId));
    if (!tenantAggregate) {
      throw new TenantNotFoundException(`租户 ${tenantId} 不存在`);
    }

    const tenant = tenantAggregate.getTenant();
    const resourceLimits = tenant.getResourceLimits();
    const currentUsage = await this.tenantDomainService.checkResourceUsage(TenantId.create(tenantId));

    const alerts: ResourceAlert[] = [];

    // 检查各种资源使用情况
    const resourceTypes: (keyof ResourceLimitsProps)[] = [
      'maxUsers', 'maxStorage', 'maxOrganizations', 'maxDepartments'
    ];

    for (const resourceType of resourceTypes) {
      const limit = resourceLimits.getLimit(resourceType);
      if (limit === -1) continue; // 无限制

      const usage = this.getUsageForResource(currentUsage, resourceType);
      const alert = this.checkResourceThreshold(tenantId, resourceType, usage, limit);
      
      if (alert) {
        alerts.push(alert);
      }
    }

    // 处理告警
    for (const alert of alerts) {
      await this.handleResourceAlert(alert);
    }

    return alerts;
  }

  private checkResourceThreshold(
    tenantId: string,
    resourceType: string,
    currentUsage: number,
    limit: number
  ): ResourceAlert | null {
    const warningThreshold = limit * 0.8; // 80%警告
    const criticalThreshold = limit * 0.95; // 95%严重

    if (currentUsage >= criticalThreshold) {
      return {
        id: uuidv4(),
        tenantId,
        resourceType,
        currentUsage,
        limit,
        threshold: criticalThreshold,
        alertLevel: 'critical',
        timestamp: new Date()
      };
    } else if (currentUsage >= warningThreshold) {
      return {
        id: uuidv4(),
        tenantId,
        resourceType,
        currentUsage,
        limit,
        threshold: warningThreshold,
        alertLevel: 'warning',
        timestamp: new Date()
      };
    }

    return null;
  }

  private async handleResourceAlert(alert: ResourceAlert): Promise<void> {
    this.logger.warn(`资源使用告警: ${alert.tenantId}`, { alert });

    await this.alertService.sendAlert({
      tenantId: alert.tenantId,
      type: 'resource_usage',
      level: alert.alertLevel,
      message: `资源 ${alert.resourceType} 使用量已达到 ${alert.currentUsage}/${alert.limit}`,
      data: alert
    });
  }

  private getUsageForResource(usage: ResourceUsage, resourceType: keyof ResourceLimitsProps): number {
    const usageMap: Record<keyof ResourceLimitsProps, keyof ResourceUsageProps> = {
      maxUsers: 'userCount',
      maxStorage: 'storageUsed',
      maxOrganizations: 'organizationCount',
      maxDepartments: 'departmentCount',
      maxApiCalls: 'apiCallsThisMonth',
      maxDataTransfer: 'dataTransferThisMonth'
    };

    const usageKey = usageMap[resourceType];
    return usage.getUsage(usageKey);
  }
}
```

---

## 6. 业务异常处理机制

### 6.1 业务异常处理器

```typescript
// src/application/services/business-exception-handler.service.ts
export interface BusinessException {
  code: string;
  message: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryable: boolean;
}

@Injectable()
export class BusinessExceptionHandler {
  constructor(
    private readonly logger: ILoggerPort,
    private readonly retryManager: RetryManager,
    private readonly alertService: AlertService
  ) {}

  async handleException(exception: BusinessException): Promise<void> {
    // 记录异常
    this.logException(exception);

    // 根据严重程度处理
    switch (exception.severity) {
      case 'critical':
        await this.handleCriticalException(exception);
        break;
      case 'high':
        await this.handleHighSeverityException(exception);
        break;
      case 'medium':
        await this.handleMediumSeverityException(exception);
        break;
      case 'low':
        await this.handleLowSeverityException(exception);
        break;
    }

    // 如果是可重试的异常，加入重试队列
    if (exception.retryable) {
      await this.retryManager.scheduleRetry(exception);
    }
  }

  private logException(exception: BusinessException): void {
    const logLevel = this.getLogLevel(exception.severity);
    this.logger[logLevel]('业务异常处理', {
      code: exception.code,
      message: exception.message,
      context: exception.context,
      severity: exception.severity
    });
  }

  private async handleCriticalException(exception: BusinessException): Promise<void> {
    // 发送紧急告警
    await this.alertService.sendCriticalAlert({
      code: exception.code,
      message: exception.message,
      context: exception.context
    });

    // 可能需要停机或降级服务
    this.logger.error('严重业务异常，需要人工干预', { exception });
  }

  private async handleHighSeverityException(exception: BusinessException): Promise<void> {
    // 发送高优先级告警
    await this.alertService.sendHighPriorityAlert({
      code: exception.code,
      message: exception.message,
      context: exception.context
    });
  }

  private async handleMediumSeverityException(exception: BusinessException): Promise<void> {
    // 发送普通告警
    await this.alertService.sendAlert({
      code: exception.code,
      message: exception.message,
      context: exception.context
    });
  }

  private async handleLowSeverityException(exception: BusinessException): Promise<void> {
    // 只记录日志，不发送告警
    this.logger.info('低严重性业务异常', { exception });
  }

  private getLogLevel(severity: string): 'error' | 'warn' | 'info' | 'debug' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'debug';
    }
  }
}
```

---

## 7. CASL权限管理

### 7.1 CASL权限引擎核心

```typescript
// src/application/auth/casl-ability.factory.ts
import { Injectable } from '@nestjs/common';
import { createMongoAbility, MongoAbility, RawRuleOf } from '@casl/ability';
import { User } from '../../domain/user/entities/user.entity';
import { UserId, TenantId } from '@hl8/hybrid-archi';
import { CacheAdapter } from '@hl8/hybrid-archi';

/**
 * 权限操作枚举
 */
export enum Actions {
  Manage = 'manage',
  Create = 'create',
  CreateAny = 'createAny',
  CreateOne = 'createOne',
  CreateOwn = 'createOwn',
  Read = 'read',
  ReadAny = 'readAny',
  ReadOne = 'readOne',
  ReadOwn = 'readOwn',
  Update = 'update',
  UpdateAny = 'updateAny',
  UpdateOne = 'updateOne',
  UpdateOwn = 'updateOwn',
  Delete = 'delete',
  DeleteAny = 'deleteAny',
  DeleteOne = 'deleteOne',
  DeleteOwn = 'deleteOwn'
}

/**
 * 权限主体枚举
 */
export enum Subjects {
  All = 'all',
  User = 'User',
  Tenant = 'Tenant',
  Organization = 'Organization',
  Department = 'Department'
}

/**
 * 应用权限类型
 */
export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * CASL 权限工厂
 *
 * @description 基于 CASL 的权限管理工厂
 * 支持多租户权限、角色权限、资源权限等
 *
 * @since 1.0.0
 */
@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly cacheAdapter: CacheAdapter
  ) {}

  /**
   * 为用户创建权限能力
   */
  async createForUser(user: User): Promise<AppAbility> {
    const cacheKey = `user:ability:${user.getId().getValue()}`;
    
    // 尝试从缓存获取
    const cachedAbility = await this.cacheAdapter.get<AppAbility>(cacheKey);
    if (cachedAbility) {
      return cachedAbility;
    }

    // 构建权限规则
    const rules = await this.buildUserRules(user);
    
    // 创建权限能力
    const ability = createMongoAbility<[Actions, Subjects]>(rules);
    
    // 缓存权限能力
    await this.cacheAdapter.set(cacheKey, ability, 300); // 5分钟缓存
    
    return ability;
  }

  /**
   * 构建用户权限规则
   */
  private async buildUserRules(user: User): Promise<RawRuleOf<AppAbility>[]> {
    const rules: RawRuleOf<AppAbility>[] = [];

    // 根据用户角色添加权限
    if (user.getRoles().includes('PLATFORM_ADMIN')) {
      rules.push(...this.getPlatformPermissions());
    }

    if (user.getRoles().includes('TENANT_ADMIN')) {
      rules.push(...this.getTenantPermissions(user.getTenantId()));
    }

    if (user.getRoles().includes('ORGANIZATION_ADMIN')) {
      rules.push(...this.getOrganizationPermissions(user.getTenantId()));
    }

    if (user.getRoles().includes('DEPARTMENT_ADMIN')) {
      rules.push(...this.getDepartmentPermissions(user.getTenantId()));
    }

    // 添加基础用户权限
    rules.push(...this.getBaseUserPermissions(user.getId()));

    return rules;
  }

  /**
   * 获取平台管理员权限
   */
  private getPlatformPermissions(): RawRuleOf<AppAbility>[] {
    return [
      { action: Actions.Manage, subject: Subjects.All },
      { action: Actions.Create, subject: Subjects.Tenant },
      { action: Actions.Read, subject: Subjects.Tenant },
      { action: Actions.Update, subject: Subjects.Tenant },
      { action: Actions.Delete, subject: Subjects.Tenant }
    ];
  }

  /**
   * 获取租户管理员权限
   */
  private getTenantPermissions(tenantId: TenantId): RawRuleOf<AppAbility>[] {
    return [
      { action: Actions.Manage, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Manage, subject: Subjects.Organization, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Manage, subject: Subjects.Department, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Create, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Read, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Update, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Delete, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } }
    ];
  }

  /**
   * 获取组织管理员权限
   */
  private getOrganizationPermissions(tenantId: TenantId): RawRuleOf<AppAbility>[] {
    return [
      { action: Actions.Read, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Update, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Manage, subject: Subjects.Department, conditions: { tenantId: tenantId.getValue() } }
    ];
  }

  /**
   * 获取部门管理员权限
   */
  private getDepartmentPermissions(tenantId: TenantId): RawRuleOf<AppAbility>[] {
    return [
      { action: Actions.Read, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } },
      { action: Actions.Update, subject: Subjects.User, conditions: { tenantId: tenantId.getValue() } }
    ];
  }

  /**
   * 获取基础用户权限
   */
  private getBaseUserPermissions(userId: UserId): RawRuleOf<AppAbility>[] {
    return [
      { action: Actions.Read, subject: Subjects.User, conditions: { id: userId.getValue() } },
      { action: Actions.Update, subject: Subjects.User, conditions: { id: userId.getValue() } }
    ];
  }

  /**
   * 清除用户权限缓存
   */
  async clearUserAbilityCache(userId: UserId): Promise<void> {
    const cacheKey = `user:ability:${userId.getValue()}`;
    await this.cacheAdapter.delete(cacheKey);
  }
}

```

### 7.2 权限装饰器和守卫

```typescript
// src/application/auth/policy-handler.interface.ts
/**
 * 策略处理器接口
 *
 * @description 定义权限策略处理器的接口
 * 用于 CASL 权限检查
 */
export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

/**
 * 策略处理器类型
 */
export type PolicyHandler = (ability: AppAbility, request: any) => boolean | Promise<boolean>;

// src/application/auth/policies.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * 权限策略装饰器
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata('check_policy', handlers);

// src/interfaces/rest/guards/policies.guard.ts
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers = this.reflector.get<PolicyHandler[]>(
      'check_policy',
      context.getHandler(),
    ) || [];

    if (!policyHandlers.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const ability = await this.caslAbilityFactory.createForUser(user);

    for (const handler of policyHandlers) {
      const result = await handler(ability, request);
      if (!result) {
        return false;
      }
    }

    return true;
  }
}
```

### 7.2 权限守卫

```typescript
// src/interfaces/rest/guards/policies.guard.ts
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers = this.reflector.get<PolicyHandler[]>(
      'check_policy',
      context.getHandler(),
    ) || [];

    if (!policyHandlers.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const ability = await this.caslAbilityFactory.createForUser(user.id);

    for (const handler of policyHandlers) {
      const result = await handler(ability, request);
      if (!result) {
        return false;
      }
    }

    return true;
  }
}
```

---

## 8. 代码示例

### 8.1 完整的业务模块集成

```typescript
// src/application/business-modules.module.ts
import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@hl8/hybrid-archi';

/**
 * 业务模块集成模块
 * 
 * @description 集成所有业务功能模块
 * 使用 @hl8/hybrid-archi 提供的 InfrastructureModule
 * 
 * @since 1.0.0
 */
@Module({
  imports: [
    ApplicationModule,
    // 使用 @hl8/hybrid-archi 提供的 InfrastructureModule
    InfrastructureModule,
  ],
  providers: [
    // 业务流程引擎
    BusinessProcessEngine,
    UserRegistrationProcess,

    // 业务规则引擎
    BusinessRulesEngine,
    TenantRules,
    UserRules,

    // 资源监控
    ResourceMonitoringService,
    AlertService,

    // 异常处理
    BusinessExceptionHandler,
    RetryManager,

    // CASL权限管理
    CaslAbilityFactory,
    PoliciesGuard,
  ],
  exports: [
    BusinessProcessEngine,
    BusinessRulesEngine,
    ResourceMonitoringService,
    BusinessExceptionHandler,
    CaslAbilityFactory,
  ],
})
export class BusinessModulesModule {}
```

---

## 📚 相关文档

- [项目概述与架构设计](./01-overview-and-architecture.md)
- [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md)
- [项目结构与模块职责](./03-project-structure.md)
- [领域层开发指南](./04-domain-layer-development.md)
- [应用层开发指南](./05-application-layer-development.md)
- [基础设施层开发指南](./06-infrastructure-layer-development.md)
- [接口层开发指南](./07-interface-layer-development.md)
- [测试策略与部署运维](./09-testing-and-deployment.md)
- [最佳实践与常见问题](./10-best-practices-and-faq.md)
