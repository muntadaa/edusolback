import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlanningSessionTypesService } from './planning-session-types.service';
import { CreatePlanningSessionTypeDto } from './dto/create-planning-session-type.dto';
import { UpdatePlanningSessionTypeDto } from './dto/update-planning-session-type.dto';
import { PlanningSessionTypesQueryDto } from './dto/planning-session-types-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Planning Session Types')
@ApiBearerAuth()
@Controller('planning-session-types')
export class PlanningSessionTypesController {
  constructor(private readonly planningSessionTypesService: PlanningSessionTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Planning session type created successfully.' })
  create(@Request() req, @Body() createPlanningSessionTypeDto: CreatePlanningSessionTypeDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.planningSessionTypesService.create(createPlanningSessionTypeDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve planning session types with pagination metadata.' })
  findAll(@Request() req, @Query() query: PlanningSessionTypesQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.planningSessionTypesService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a planning session type by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.planningSessionTypesService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a planning session type.' })
  update(@Request() req, @Param('id') id: string, @Body() updatePlanningSessionTypeDto: UpdatePlanningSessionTypeDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.planningSessionTypesService.update(+id, updatePlanningSessionTypeDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a planning session type.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.planningSessionTypesService.remove(+id, companyId);
  }
}
