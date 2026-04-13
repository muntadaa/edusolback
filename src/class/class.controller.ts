import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassQueryDto } from './dto/class-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateClassBatchDto } from './dto/create-class-batch.dto';
import { CreateClassBatchAllowDuplicatesDto } from './dto/create-class-batch-allow-duplicates.dto';

@ApiTags('Classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 201,
    description:
      'Creates one class (always a new DB row). School-year/level deduplication is not applied here — only on POST /classes/batch.',
  })
  create(@Request() req, @Body() createClassDto: CreateClassDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classService.create(createClassDto, companyId);
  }

  @Post('batch/allow-duplicates')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 201,
    description:
      'Batch: one insert per item; same school year + level may repeat (no skip). Omitting `status` defaults to 2 (pending). Response order matches items.',
  })
  createBatchAllowDuplicates(@Request() req, @Body() dto: CreateClassBatchAllowDuplicatesDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classService.createManyAllowDuplicates(dto.items, companyId);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 201,
    description:
      'Batch (deduplicated): creates many classes in one transaction. Omitting `status` on an item defaults to 2 (pending). Skips insert when a class already exists for the same school year + level (returns that class). Duplicate keys in the same batch only insert once. Response order matches items. For one row per item regardless of duplicates, use POST /classes/batch/allow-duplicates.',
  })
  createBatch(@Request() req, @Body() dto: CreateClassBatchDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classService.createMany(dto.items, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve classes with pagination metadata.' })
  findAll(@Request() req, @Query() query: ClassQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a class by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a class.' })
  update(@Request() req, @Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classService.update(+id, updateClassDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a class.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classService.remove(+id, companyId);
  }
}
