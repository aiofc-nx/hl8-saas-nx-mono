/**
 * SAAS-CORE 验证脚本
 * 
 * @description 验证SAAS-CORE模块的基本功能
 * 
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { Tenant, TENANT_TYPES, TENANT_STATUS } from './src/domain/tenant/entities/tenant.entity';
import { TenantAggregate } from './src/domain/tenant/aggregates/tenant.aggregate';

console.log('🚀 SAAS-CORE 验证脚本开始...\n');

try {
  // 测试1: 创建TenantId
  console.log('📝 测试1: 创建TenantId');
  const tenantId = EntityId.generate();
  console.log(`✅ 生成的租户ID: ${tenantId.value}`);
  
  // 测试2: 从字符串创建TenantId
  console.log('\n📝 测试2: 从字符串创建TenantId');
  const customTenantId = TenantId.create('my-tenant-123');
  console.log(`✅ 自定义租户ID: ${customTenantId.value}`);
  
  // 测试3: 创建Tenant实体
  console.log('\n📝 测试3: 创建Tenant实体');
  const config = {
    features: ['user_management', 'organization'],
    theme: 'default',
    branding: {},
    settings: {}
  };
  const resourceLimits = {
    maxUsers: 100,
    maxOrganizations: 5,
    maxStorage: 1024,
    maxApiCalls: 10000
  };
  
  const tenant = new Tenant(
    tenantId,
    'test-tenant',
    'Test Tenant',
    TENANT_TYPES.BASIC,
    TENANT_STATUS.PENDING,
    'admin-id',
    config,
    resourceLimits
  );
  console.log(`✅ 创建的租户: ${tenant.name} (${tenant.code})`);
  
  // 测试4: 激活租户
  console.log('\n📝 测试4: 激活租户');
  tenant.activate();
  console.log(`✅ 租户状态: ${tenant.status}`);
  
  // 测试5: 检查功能权限
  console.log('\n📝 测试5: 检查功能权限');
  const canUseUserMgmt = tenant.canUseFeature('user_management');
  const canUseAnalytics = tenant.canUseFeature('analytics');
  console.log(`✅ 用户管理功能: ${canUseUserMgmt ? '可用' : '不可用'}`);
  console.log(`✅ 分析功能: ${canUseAnalytics ? '可用' : '不可用'}`);
  
  // 测试6: 检查资源限制
  console.log('\n📝 测试6: 检查资源限制');
  const isExceeded = tenant.isResourceLimitExceeded('maxUsers', 150);
  console.log(`✅ 用户数150是否超出限制: ${isExceeded ? '是' : '否'}`);
  
  // 测试7: 创建TenantAggregate
  console.log('\n📝 测试7: 创建TenantAggregate');
  const tenantAggregate = TenantAggregate.create(
    EntityId.generate(),
    'aggregate-tenant',
    'Aggregate Tenant',
    TENANT_TYPES.PROFESSIONAL,
    'admin-id',
    'admin@example.com',
    'Admin User'
  );
  console.log(`✅ 创建的聚合根: ${tenantAggregate.getTenant().name}`);
  
  // 测试8: 激活聚合根中的租户
  console.log('\n📝 测试8: 激活聚合根中的租户');
  tenantAggregate.activate();
  console.log(`✅ 聚合根中租户状态: ${tenantAggregate.getTenant().status}`);
  
  console.log('\n🎉 所有测试通过！SAAS-CORE模块基本功能正常。');
  
} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error('错误详情:', error);
  process.exit(1);
}
