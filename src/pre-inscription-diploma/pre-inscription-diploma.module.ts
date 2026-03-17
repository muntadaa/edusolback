import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreInscriptionDiplomaService } from './pre-inscription-diploma.service';
import { PreInscriptionDiplomaController } from './pre-inscription-diploma.controller';
import { PreInscriptionDiploma } from './entities/pre-inscription-diploma.entity';
import { PreInscription } from '../preinscriptions/entities/preinscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PreInscriptionDiploma, PreInscription])],
  controllers: [PreInscriptionDiplomaController],
  providers: [PreInscriptionDiplomaService],
})
export class PreInscriptionDiplomaModule {}
