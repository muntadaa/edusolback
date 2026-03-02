import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesService } from './pages.service';
import { PagesSeederService } from './pages-seeder.service';
import { PagesController } from './pages.controller';
import { Page } from './entities/page.entity';
import { RolePage } from './entities/role-page.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Page, RolePage, Role])],
  controllers: [PagesController],
  providers: [PagesService, PagesSeederService],
  exports: [PagesService],
})
export class PagesModule {}

