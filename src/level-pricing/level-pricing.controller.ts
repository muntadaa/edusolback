import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LevelPricingService } from './level-pricing.service';
import { CreateLevelPricingDto } from './dto/create-level-pricing.dto';
import { UpdateLevelPricingDto } from './dto/update-level-pricing.dto';
import { LevelPricingQueryDto } from './dto/level-pricing-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Level Pricings')
@ApiBearerAuth()
@Controller('level-pricings')
export class LevelPricingController {
  constructor(private readonly levelPricingService: LevelPricingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Level pricing created successfully.' })
  create(@Request() req, @Body() dto: CreateLevelPricingDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.levelPricingService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve level pricings with pagination metadata.' })
  findAll(@Request() req, @Query() query: LevelPricingQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.levelPricingService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a level pricing by identifier.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.levelPricingService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a level pricing.' })
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLevelPricingDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.levelPricingService.update(id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a level pricing.' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.levelPricingService.remove(id, companyId);
  }
}
