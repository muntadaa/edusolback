import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassroomTypesService } from './classroom-types.service';
import { CreateClassroomTypeDto } from './dto/create-classroom-type.dto';
import { UpdateClassroomTypeDto } from './dto/update-classroom-type.dto';
import { ClassroomTypeQueryDto } from './dto/classroom-type-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Classroom Types')
@ApiBearerAuth()
@Controller('classroom-types')
export class ClassroomTypesController {
  constructor(private readonly classroomTypesService: ClassroomTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Classroom type created successfully.' })
  create(@Request() req, @Body() dto: CreateClassroomTypeDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classroomTypesService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve classroom types with pagination metadata.' })
  findAll(@Request() req, @Query() query: ClassroomTypeQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classroomTypesService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a classroom type by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classroomTypesService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a classroom type.' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateClassroomTypeDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classroomTypesService.update(+id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a classroom type.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classroomTypesService.remove(+id, companyId);
  }
}

