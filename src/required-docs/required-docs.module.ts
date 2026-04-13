import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequiredDocsService } from './required-docs.service';
import { RequiredDocsController } from './required-docs.controller';
import { RequiredDoc } from './entities/required-doc.entity';
import { Program } from '../programs/entities/program.entity';
import { Specialization } from '../specializations/entities/specialization.entity';
import { Level } from '../level/entities/level.entity';
import { AuthModule } from '../auth/auth.module';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequiredDoc, Program, Specialization, Level]),
    AuthModule,
    PagesModule,
  ],
  controllers: [RequiredDocsController],
  providers: [RequiredDocsService],
  exports: [RequiredDocsService],
})
export class RequiredDocsModule {}
