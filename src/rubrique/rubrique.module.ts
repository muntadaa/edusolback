import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RubriqueService } from './rubrique.service';
import { RubriqueController } from './rubrique.controller';
import { Rubrique } from './entities/rubrique.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rubrique])],
  controllers: [RubriqueController],
  providers: [RubriqueService],
  exports: [RubriqueService],
})
export class RubriqueModule {}
