/**
 * 租户列表响应 DTO
 *
 * @class TenantListResponseDto
 * @since 1.0.0
 */

import { TenantResponseDto } from './tenant-response.dto';

export class TenantListResponseDto {
  items!: TenantResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;

  static fromAggregates(
    aggregates: any[],
    total: number,
    page: number,
    pageSize: number,
  ): TenantListResponseDto {
    const dto = new TenantListResponseDto();
    dto.items = aggregates.map(TenantResponseDto.fromAggregate);
    dto.total = total;
    dto.page = page;
    dto.pageSize = pageSize;
    return dto;
  }
}

