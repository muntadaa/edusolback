import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassRoomsService } from './class-rooms.service';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';
import { ClassRoomQueryDto } from './dto/class-room-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Class Rooms')
@ApiBearerAuth()
@Controller('class-rooms')
export class ClassRoomsController {
  constructor(private readonly classRoomsService: ClassRoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Class room created successfully.' })
  create(@Request() req, @Body() createClassRoomDto: CreateClassRoomDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classRoomsService.create(createClassRoomDto, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve class rooms with pagination metadata.' })
  findAll(@Request() req, @Query() query: ClassRoomQueryDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classRoomsService.findAll(query, companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve a class room by identifier.' })
  findOne(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classRoomsService.findOne(+id, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update a class room record.' })
  update(@Request() req, @Param('id') id: string, @Body() updateClassRoomDto: UpdateClassRoomDto) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classRoomsService.update(+id, updateClassRoomDto, companyId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Remove a class room record.' })
  remove(@Request() req, @Param('id') id: string) {
    const companyId = req.user.company_id;
    if (!companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.classRoomsService.remove(+id, companyId);
  }
}
