import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassroomTypesService } from './classroom-types.service';
import { ClassroomTypesController } from './classroom-types.controller';
import { ClassroomType } from './entities/classroom-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassroomType])],
  controllers: [ClassroomTypesController],
  providers: [ClassroomTypesService],
  exports: [ClassroomTypesService],
})
export class ClassroomTypesModule {}

