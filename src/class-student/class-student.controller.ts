import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassStudentService } from './class-student.service';
import { CreateClassStudentDto } from './dto/create-class-student.dto';
import { UpdateClassStudentDto } from './dto/update-class-student.dto';
import { ClassStudentQueryDto } from './dto/class-student-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Class Students')
@ApiBearerAuth()
@Controller('class-student')
export class ClassStudentController {
  constructor(private readonly classStudentService: ClassStudentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Assign student to class successfully.' })
  create(@Request() req, @Body() createClassStudentDto: CreateClassStudentDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classStudentService.create(createClassStudentDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve class student assignments with pagination.' })
  findAll(@Request() req, @Query() query: ClassStudentQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classStudentService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a class student assignment by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classStudentService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a class student assignment.' })
  update(@Request() req, @Param('id') id: string, @Body() updateClassStudentDto: UpdateClassStudentDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classStudentService.update(+id, updateClassStudentDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a class student assignment.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classStudentService.remove(+id, companyId);
  }
}
