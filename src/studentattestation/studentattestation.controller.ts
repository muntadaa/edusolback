import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentattestationService } from './studentattestation.service';
import { CreateStudentAttestationDto } from './dto/create-studentattestation.dto';
import { UpdateStudentAttestationDto } from './dto/update-studentattestation.dto';
import { StudentAttestationQueryDto } from './dto/studentattestation-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('StudentAttestation')
@ApiBearerAuth()
@Controller('studentattestation')
export class StudentattestationController {
  constructor(private readonly studentattestationService: StudentattestationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'StudentAttestation created successfully.' })
  create(@Request() req, @Body() createStudentAttestationDto: CreateStudentAttestationDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentattestationService.create(createStudentAttestationDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve student attestations with pagination metadata.' })
  findAll(@Request() req, @Query() queryDto: StudentAttestationQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentattestationService.findAll(queryDto, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a student attestation by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentattestationService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a student attestation.' })
  update(@Request() req, @Param('id') id: string, @Body() updateStudentAttestationDto: UpdateStudentAttestationDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentattestationService.update(+id, updateStudentAttestationDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a student attestation (sets Status to -2).' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentattestationService.remove(+id, companyId);
  }
}
