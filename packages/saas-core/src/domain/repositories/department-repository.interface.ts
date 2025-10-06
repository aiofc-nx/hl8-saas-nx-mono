/**
 * 部门仓储接口
 *
 * @description 定义部门数据的持久化操作接口
 * 遵循仓储模式，提供数据访问的抽象层
 *
 * ## 业务规则
 *
 * ### 数据隔离规则
 * - 所有查询必须基于租户ID进行过滤
 * - 确保数据访问的租户隔离性
 * - 支持组织级别的数据隔离
 *
 * ### 查询优化规则
 * - 支持分页查询以提高性能
 * - 支持条件查询和排序
 * - 支持聚合查询和统计
 *
 * ### 事务管理规则
 * - 支持事务性操作
 * - 确保数据一致性
 * - 支持并发控制
 *
 * @example
 * ```typescript
 * // 查询租户下的所有部门
 * const departments = await departmentRepository.findByTenantId(tenantId);
 * 
 * // 查询组织下的活跃部门
 * const activeDepartments = await departmentRepository.findActiveByOrganizationId(organizationId);
 * 
 * // 查询部门的子部门
 * const subDepartments = await departmentRepository.findByParentId(departmentId);
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { Department } from '../department/entities/department.entity';
import { DepartmentStatus } from '../department/value-objects/department-status.vo';
import { DepartmentType } from '../department/value-objects/department-type.vo';
import { DepartmentLevel } from '../department/value-objects/department-level.vo';

/**
 * 部门查询条件
 *
 * @description 定义部门查询的各种条件
 */
export interface DepartmentQueryConditions {
  /** 租户ID */
  tenantId: EntityId;
  
  /** 组织ID（可选） */
  organizationId?: EntityId;
  
  /** 父部门ID（可选） */
  parentDepartmentId?: EntityId;
  
  /** 部门状态（可选） */
  status?: DepartmentStatus;
  
  /** 部门类型（可选） */
  type?: DepartmentType;
  
  /** 部门层级（可选） */
  level?: DepartmentLevel;
  
  /** 部门名称（模糊查询） */
  name?: string;
  
  /** 部门代码（精确查询） */
  code?: string;
}

/**
 * 分页查询参数
 */
export interface DepartmentPaginationParams {
  /** 页码（从1开始） */
  page: number;
  
  /** 每页大小 */
  pageSize: number;
  
  /** 排序字段 */
  sortBy?: 'name' | 'code' | 'createdAt' | 'updatedAt';
  
  /** 排序方向 */
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * 分页查询结果
 */
export interface DepartmentPaginationResult {
  /** 部门列表 */
  departments: Department[];
  
  /** 总数量 */
  totalCount: number;
  
  /** 总页数 */
  totalPages: number;
  
  /** 当前页 */
  currentPage: number;
  
  /** 每页大小 */
  pageSize: number;
}

/**
 * 部门仓储接口 DI Token
 */
export const DEPARTMENT_REPOSITORY_TOKEN = 'DEPARTMENT_REPOSITORY_TOKEN';

/**
 * 部门仓储接口
 */
export interface IDepartmentRepository {
  /**
   * 保存部门
   *
   * @description 保存或更新部门实体
   *
   * @param department - 部门实体
   * @returns Promise<Department> - 保存后的部门实体
   *
   * @example
   * ```typescript
   * const savedDepartment = await departmentRepository.save(department);
   * ```
   *
   * @since 1.0.0
   */
  save(department: Department): Promise<Department>;

  /**
   * 根据ID查找部门
   *
   * @description 根据部门ID查找部门实体
   *
   * @param id - 部门ID
   * @returns Promise<Department | null> - 部门实体或null
   *
   * @example
   * ```typescript
   * const department = await departmentRepository.findById(departmentId);
   * ```
   *
   * @since 1.0.0
   */
  findById(id: EntityId): Promise<Department | null>;

  /**
   * 根据代码查找部门
   *
   * @description 根据部门代码查找部门实体
   * 在租户范围内查找，确保代码的唯一性
   *
   * @param code - 部门代码
   * @param tenantId - 租户ID
   * @returns Promise<Department | null> - 部门实体或null
   *
   * @example
   * ```typescript
   * const department = await departmentRepository.findByCode('TECH_DEPT', tenantId);
   * ```
   *
   * @since 1.0.0
   */
  findByCode(code: string, tenantId: EntityId): Promise<Department | null>;

  /**
   * 根据租户ID查找部门列表
   *
   * @description 查找指定租户下的所有部门
   *
   * @param tenantId - 租户ID
   * @returns Promise<Department[]> - 部门列表
   *
   * @example
   * ```typescript
   * const departments = await departmentRepository.findByTenantId(tenantId);
   * ```
   *
   * @since 1.0.0
   */
  findByTenantId(tenantId: EntityId): Promise<Department[]>;

  /**
   * 根据组织ID查找部门列表
   *
   * @description 查找指定组织下的所有部门
   *
   * @param organizationId - 组织ID
   * @returns Promise<Department[]> - 部门列表
   *
   * @example
   * ```typescript
   * const departments = await departmentRepository.findByOrganizationId(organizationId);
   * ```
   *
   * @since 1.0.0
   */
  findByOrganizationId(organizationId: EntityId): Promise<Department[]>;

  /**
   * 根据组织ID查找活跃部门列表
   *
   * @description 查找指定组织下的所有活跃部门
   *
   * @param organizationId - 组织ID
   * @returns Promise<Department[]> - 活跃部门列表
   *
   * @example
   * ```typescript
   * const activeDepartments = await departmentRepository.findActiveByOrganizationId(organizationId);
   * ```
   *
   * @since 1.0.0
   */
  findActiveByOrganizationId(organizationId: EntityId): Promise<Department[]>;

  /**
   * 根据父部门ID查找子部门列表
   *
   * @description 查找指定部门的直接子部门
   *
   * @param parentDepartmentId - 父部门ID
   * @returns Promise<Department[]> - 子部门列表
   *
   * @example
   * ```typescript
   * const subDepartments = await departmentRepository.findByParentId(parentDepartmentId);
   * ```
   *
   * @since 1.0.0
   */
  findByParentId(parentDepartmentId: EntityId): Promise<Department[]>;

  /**
   * 根据条件查询部门列表
   *
   * @description 根据查询条件查找部门列表
   *
   * @param conditions - 查询条件
   * @returns Promise<Department[]> - 部门列表
   *
   * @example
   * ```typescript
   * const departments = await departmentRepository.findByConditions({
   *   tenantId,
   *   organizationId,
   *   status: DepartmentStatus.ACTIVE
   * });
   * ```
   *
   * @since 1.0.0
   */
  findByConditions(conditions: DepartmentQueryConditions): Promise<Department[]>;

  /**
   * 分页查询部门列表
   *
   * @description 根据条件分页查询部门列表
   *
   * @param conditions - 查询条件
   * @param pagination - 分页参数
   * @returns Promise<DepartmentPaginationResult> - 分页查询结果
   *
   * @example
   * ```typescript
   * const result = await departmentRepository.findByConditionsWithPagination(
   *   { tenantId, organizationId },
   *   { page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'ASC' }
   * );
   * ```
   *
   * @since 1.0.0
   */
  findByConditionsWithPagination(
    conditions: DepartmentQueryConditions,
    pagination: DepartmentPaginationParams
  ): Promise<DepartmentPaginationResult>;

  /**
   * 检查部门代码是否存在
   *
   * @description 检查指定代码的部门是否已存在
   * 在租户范围内检查，确保代码的唯一性
   *
   * @param code - 部门代码
   * @param tenantId - 租户ID
   * @param excludeId - 排除的部门ID（用于更新时检查）
   * @returns Promise<boolean> - 是否存在
   *
   * @example
   * ```typescript
   * const exists = await departmentRepository.existsByCode('TECH_DEPT', tenantId);
   * ```
   *
   * @since 1.0.0
   */
  existsByCode(code: string, tenantId: EntityId, excludeId?: EntityId): Promise<boolean>;

  /**
   * 统计部门数量
   *
   * @description 根据条件统计部门数量
   *
   * @param conditions - 查询条件
   * @returns Promise<number> - 部门数量
   *
   * @example
   * ```typescript
   * const count = await departmentRepository.countByConditions({
   *   tenantId,
   *   organizationId,
   *   status: DepartmentStatus.ACTIVE
   * });
   * ```
   *
   * @since 1.0.0
   */
  countByConditions(conditions: DepartmentQueryConditions): Promise<number>;

  /**
   * 删除部门
   *
   * @description 软删除部门实体
   *
   * @param id - 部门ID
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await departmentRepository.delete(departmentId);
   * ```
   *
   * @since 1.0.0
   */
  delete(id: EntityId): Promise<void>;

  /**
   * 批量删除部门
   *
   * @description 批量软删除部门实体
   *
   * @param ids - 部门ID列表
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await departmentRepository.deleteMany([departmentId1, departmentId2]);
   * ```
   *
   * @since 1.0.0
   */
  deleteMany(ids: EntityId[]): Promise<void>;

  /**
   * 查找部门层级树
   *
   * @description 构建部门的层级树结构
   *
   * @param tenantId - 租户ID
   * @param organizationId - 组织ID（可选）
   * @returns Promise<DepartmentTreeNode[]> - 部门树节点列表
   *
   * @example
   * ```typescript
   * const tree = await departmentRepository.findDepartmentTree(tenantId, organizationId);
   * ```
   *
   * @since 1.0.0
   */
  findDepartmentTree(tenantId: EntityId, organizationId?: EntityId): Promise<DepartmentTreeNode[]>;
}

/**
 * 部门树节点
 *
 * @description 用于构建部门层级树的数据结构
 */
export interface DepartmentTreeNode {
  /** 部门实体 */
  department: Department;
  
  /** 子部门节点列表 */
  children: DepartmentTreeNode[];
  
  /** 层级深度 */
  depth: number;
  
  /** 是否为叶子节点 */
  isLeaf: boolean;
}
