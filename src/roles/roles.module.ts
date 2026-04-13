import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RolesSeederService } from './roles-seeder.service';
import { Role } from './entities/role.entity';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    PagesModule,
  ],
  controllers: [RolesController],
  providers: [RolesService, RolesSeederService],
  exports: [RolesService],
})
export class RolesModule {}
