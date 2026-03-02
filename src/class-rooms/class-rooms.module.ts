import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRoomsService } from './class-rooms.service';
import { ClassRoomsController } from './class-rooms.controller';
import { ClassRoom } from './entities/class-room.entity';
import { ClassroomType } from '../classroom-types/entities/classroom-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassRoom, ClassroomType])],
  controllers: [ClassRoomsController],
  providers: [ClassRoomsService],
  exports: [ClassRoomsService],
})
export class ClassRoomsModule {}
