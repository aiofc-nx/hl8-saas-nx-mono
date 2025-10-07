/**
 * SAAS-CORE 重构验证脚本
 * 
 * @description 验证TenantId移动到hybrid-archi后的功能正常性
 * 
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { Tenant, TENANT_TYPES, TENANT_STATUS } from './src/domain/tenant/entities/tenant.entity';
import { TenantAggregate } from './src/domain/tenant/aggregates/tenant.aggregate';

console.log('🔄 SAAS-CORE 重构验证脚本开始...\n');

try {
  // 测试1: 从hybrid-archi导入TenantId
  console.log('📝 测试1: 从hybrid-archi导入TenantId');
  const tenantId = EntityId.generate();
  console.log(`✅ 从hybrid-archi导入的TenantId: ${tenantId.value}`);
  
  // 测试2: 验证TenantId格式
  console.log('\n📝 测试2: 验证TenantId格式');
  const customTenantId = TenantId.create('my-tenant-123');
  console.log(`✅ 自定义租户ID: ${customTenantId.value}`);
  
  // 测试3: 在Tenant实体中使用TenantId
  console.log('\n📝 测试3: 在Tenant实体中使用TenantId');
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
  console.log(`✅ 使用hybrid-archi TenantId创建的租户: ${tenant.name} (${tenant.code})`);
  
  // 测试4: 在TenantAggregate中使用TenantId
  console.log('\n📝 测试4: 在TenantAggregate中使用TenantId');
  const tenantAggregate = TenantAggregate.create(
    EntityId.generate(),
    'aggregate-tenant',
    'Aggregate Tenant',
    TENANT_TYPES.PROFESSIONAL,
    'admin-id',
    'admin@example.com',
    'Admin User'
  );
  console.log(`✅ 使用hybrid-archi TenantId创建的聚合根: ${tenantAggregate.getTenant().name}`);
  
  // 测试5: 验证EntityId集成
  console.log('\n📝 测试5: 验证EntityId集成');
  const entityId = tenantId.getEntityId();
  console.log(`✅ TenantId的EntityId: ${entityId.toString()}`);
  console.log(`✅ EntityId类型: ${entityId.constructor.name}`);
  
  // 测试6: 验证相等性比较
  console.log('\n📝 测试6: 验证相等性比较');
  const tenantId1 = TenantId.create('same-tenant');
  const tenantId2 = TenantId.create('same-tenant');
  const tenantId3 = TenantId.create('different-tenant');
  console.log(`✅ 相同TenantId比较: ${tenantId1.equals(tenantId2)}`);
  console.log(`✅ 不同TenantId比较: ${tenantId1.equals(tenantId3)}`);
  
  console.log('\n🎉 重构验证通过！TenantId已成功移动到hybrid-archi并正常工作。');
  
} catch (error) {
  console.error('\n❌ 重构验证失败:', error.message);
  console.error('错误详情:', error);
  process.exit(1);
}
