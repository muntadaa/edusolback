import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { StudentPresenceService } from './studentpresence.service';
import { CreateStudentPresenceDto } from './dto/create-studentpresence.dto';
import { UpdateStudentPresenceDto } from './dto/update-studentpresence.dto';
import { StudentPresenceQueryDto } from './dto/studentpresence-query.dto';
import { StudentPresenceResponseDto } from './dto/student-presence-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Student Presence')
@ApiExtraModels(StudentPresenceResponseDto)
@ApiBearerAuth()
@Controller('student-presence')
export class StudentPresenceController {
  constructor(private readonly studentPresenceService: StudentPresenceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    type: StudentPresenceResponseDto,
    description:
      'Created or updated row (upsert). Check `presence_locked` / `notes_locked` to know which fields the UI should keep read-only.',
  })
  @ApiResponse({ status: 201, description: 'Student presence record created successfully (same body shape as 200).' })
  create(@Request() req, @Body() dto: CreateStudentPresenceDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    description:
      'Paginated list. Each `data` item includes `presence_locked` and `notes_locked` (per-row UI locks). `locked` is legacy and true only when both are true.',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(StudentPresenceResponseDto) },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrevious: { type: 'boolean' },
          },
        },
      },
    },
  })
  findAll(@Request() req, @Query() query: StudentPresenceQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    type: StudentPresenceResponseDto,
    description: 'Single row with `presence_locked` / `notes_locked` for UI read-only state.',
  })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    type: StudentPresenceResponseDto,
    description: 'Updated row; lock flags reflect current session/planning state.',
  })
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentPresenceDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceService.update(id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a student presence record (sets status to -2).' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceService.remove(id, companyId);
  }
}
