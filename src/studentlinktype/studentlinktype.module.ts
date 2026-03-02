import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentlinktypeService } from './studentlinktype.service';
import { StudentlinktypeController } from './studentlinktype.controller';
import { StudentLinkType } from './entities/studentlinktype.entity';
import { Student } from '../students/entities/student.entity';
import { Company } from '../company/entities/company.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentLinkType, Student, Company]),
    MailModule,
  ],
  controllers: [StudentlinktypeController],
  providers: [StudentlinktypeService],
  exports: [StudentlinktypeService],
})
export class StudentlinktypeModule {}
