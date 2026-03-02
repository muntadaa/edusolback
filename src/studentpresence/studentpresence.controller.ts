import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentPresenceService } from './studentpresence.service';
import { CreateStudentPresenceDto } from './dto/create-studentpresence.dto';
import { UpdateStudentPresenceDto } from './dto/update-studentpresence.dto';
import { StudentPresenceQueryDto } from './dto/studentpresence-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Student Presence')
@ApiBearerAuth()
@Controller('student-presence')
export class StudentPresenceController {
  constructor(private readonly studentPresenceService: StudentPresenceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Student presence record created successfully.' })
  create(@Request() req, @Body() dto: CreateStudentPresenceDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceService.create(dto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve student presence records with pagination metadata.' })
  findAll(@Request() req, @Query() query: StudentPresenceQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a student presence record by identifier.' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentPresenceService.findOne(id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a student presence record.' })
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
