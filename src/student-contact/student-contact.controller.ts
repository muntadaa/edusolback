import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudentContactService } from './student-contact.service';
import { CreateStudentContactDto } from './dto/create-student-contact.dto';
import { UpdateStudentContactDto } from './dto/update-student-contact.dto';
import { StudentContactQueryDto } from './dto/student-contact-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('StudentContact')
@ApiBearerAuth()
@Controller('student-contact')
export class StudentContactController {
  constructor(private readonly studentContactService: StudentContactService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'StudentContact created successfully.' })
  create(@Request() req, @Body() createStudentContactDto: CreateStudentContactDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentContactService.create(createStudentContactDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve student contacts with pagination metadata.' })
  findAll(@Request() req, @Query() queryDto: StudentContactQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentContactService.findAll(queryDto, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a student contact by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentContactService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a student contact.' })
  update(@Request() req, @Param('id') id: string, @Body() updateStudentContactDto: UpdateStudentContactDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentContactService.update(+id, updateStudentContactDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Soft delete a student contact (sets status to -2).' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.studentContactService.remove(+id, companyId);
  }
}
