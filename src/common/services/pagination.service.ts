import { PaginationMetaDto, PaginatedResponseDto } from '../dto/pagination.dto';

export class PaginationService {
  static createMeta(page: number, limit: number, total: number): PaginationMetaDto {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  static createResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponseDto<T> {
    return {
      data,
      meta: this.createMeta(page, limit, total),
    };
  }
}
