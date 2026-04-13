import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentlinktypeService } from './studentlinktype.service';
import { CreateStudentLinkTypeDto } from './dto/create-studentlinktype.dto';
import { UpdateStudentLinkTypeDto } from './dto/update-studentlinktype.dto';
import { StudentLinkTypeQueryDto } from './dto/studentlinktype-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Student Link Types')
@ApiBearerAuth()
@Controller('studentlinktype')
export class StudentlinktypeController {
  constructor(private readonly studentlinktypeService: StudentlinktypeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Student link type created successfully.' })
  create(@Request() req, @Body() dto: CreateStudentLinkTypeDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentlinktypeService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve link types with pagination metadata.' })
  findAll(@Request() req, @Query() query: StudentLinkTypeQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentlinktypeService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a link type by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentlinktypeService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a link type.' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateStudentLinkTypeDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentlinktypeService.update(+id, dto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a link type.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentlinktypeService.remove(+id, companyId);
  }
}
