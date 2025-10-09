/**
 * 租户控制器
 *
 * @description REST API 控制器，提供租户管理的 HTTP 接口
 *
 * ## API 端点
 *
 * ### 租户管理
 * - POST /api/tenants - 创建租户
 * - GET /api/tenants/:id - 获取租户详情
 * - GET /api/tenants - 获取租户列表
 * - PATCH /api/tenants/:id - 更新租户
 * - DELETE /api/tenants/:id - 删除租户
 *
 * ### 租户操作
 * - POST /api/tenants/:id/activate - 激活租户
 * - POST /api/tenants/:id/upgrade - 升级租户
 * - POST /api/tenants/:id/suspend - 暂停租户
 *
 * @class TenantController
 * @since 1.0.0
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@hl8/hybrid-archi';
import { CreateTenantDto } from '../dtos/tenant/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/tenant/update-tenant.dto';
import { TenantResponseDto } from '../dtos/tenant/tenant-response.dto';
import { TenantListResponseDto } from '../dtos/tenant/tenant-list-response.dto';
import { CreateTenantCommand } from '../../application/cqrs/commands/tenant/create-tenant.command';
import { UpgradeTenantCommand } from '../../application/cqrs/commands/tenant/upgrade-tenant.command';
import { GetTenantQuery } from '../../application/cqrs/queries/tenant/get-tenant.query';
import { ListTenantsQuery } from '../../application/cqrs/queries/tenant/list-tenants.query';

@Controller('api/tenants')
export class TenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 创建租户
   *
   * @param {CreateTenantDto} dto - 创建租户DTO
   * @returns {Promise<{ id: string }>} 租户ID
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTenantDto,
  ): Promise<{ id: string }> {
    const command = new CreateTenantCommand(
      dto.code,
      dto.name,
      dto.domain,
      dto.type,
      'system', // TODO: 从认证上下文获取当前用户ID
    );

    const tenantId = await this.commandBus.execute(command);
    return { id: tenantId.toString() };
  }

  /**
   * 获取租户详情
   *
   * @param {string} id - 租户ID
   * @returns {Promise<TenantResponseDto>} 租户详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TenantResponseDto> {
    const query = new GetTenantQuery(id);
    const aggregate = await this.queryBus.execute(query);

    if (!aggregate) {
      throw new Error(`租户不存在: ${id}`);
    }

    return TenantResponseDto.fromAggregate(aggregate);
  }

  /**
   * 获取租户列表
   *
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<TenantListResponseDto>} 租户列表
   */
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ): Promise<TenantListResponseDto> {
    const offset = (page - 1) * pageSize;
    const query = new ListTenantsQuery(offset, pageSize);
    const aggregates = await this.queryBus.execute(query);

    // TODO: 获取总数
    const total = aggregates.length;

    return TenantListResponseDto.fromAggregates(
      aggregates,
      total,
      page,
      pageSize,
    );
  }

  /**
   * 更新租户
   *
   * @param {string} id - 租户ID
   * @param {UpdateTenantDto} dto - 更新数据
   * @returns {Promise<void>}
   */
  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<void> {
    // TODO: 实现更新租户逻辑
  }

  /**
   * 激活租户
   *
   * @param {string} id - 租户ID
   * @returns {Promise<void>}
   */
  @Post(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id') id: string): Promise<void> {
    // TODO: 实现激活租户逻辑
  }

  /**
   * 升级租户
   *
   * @param {string} id - 租户ID
   * @param {object} body - 升级参数
   * @returns {Promise<void>}
   */
  @Post(':id/upgrade')
  @HttpCode(HttpStatus.NO_CONTENT)
  async upgrade(
    @Param('id') id: string,
    @Body() body: { type: string },
  ): Promise<void> {
    const command = new UpgradeTenantCommand(
      id,
      body.type as any,
      'system', // TODO: 从认证上下文获取
    );

    await this.commandBus.execute(command);
  }

  /**
   * 删除租户
   *
   * @param {string} id - 租户ID
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    // TODO: 实现删除租户逻辑
  }
}

