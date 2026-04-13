import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Event created successfully.' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get('blocking')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'from', required: false, description: 'Start of date range (YYYY-MM-DD). Only events overlapping [from, to] are returned.' })
  @ApiQuery({ name: 'to', required: false, description: 'End of date range (YYYY-MM-DD). Only events overlapping [from, to] are returned.' })
  @ApiResponse({ status: 200, description: 'Blocking events for calendar/planning. Grey out these date ranges in the calendar and disable them in the planning date picker.' })
  findBlocking(@Query('from') from?: string, @Query('to') to?: string) {
    return this.eventsService.findBlockingEvents(from, to);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve all events.' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Retrieve an event by identifier.' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Update an event.' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(+id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Delete an event.' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(+id);
  }
}
