import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchoolYearPeriodsService } from './school-year-periods.service';
import { CreateSchoolYearPeriodDto } from './dto/create-school-year-period.dto';
import { UpdateSchoolYearPeriodDto } from './dto/update-school-year-period.dto';
import { SchoolYearPeriodQueryDto } from './dto/school-year-period-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('School Year Periods')
@ApiBearerAuth()
@Controller('school-year-periods')
export class SchoolYearPeriodsController {
  constructor(private readonly service: SchoolYearPeriodsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'School year period created successfully.' })
  create(@Request() req, @Body() dto: CreateSchoolYearPeriodDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve school year periods with pagination metadata.' })
  findAll(@Request() req, @Query() query: SchoolYearPeriodQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a school year period by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a school year period.' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateSchoolYearPeriodDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.update(+id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a school year period.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.service.remove(+id, companyId);
  }
}
