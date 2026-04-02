import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PagesModule } from '../pages/pages.module';
import { RequiredDocsModule } from '../required-docs/required-docs.module';
import { AuditorDocument } from './entities/auditor-document.entity';
import { Student } from '../students/entities/student.entity';
import { AuditorDocumentsSyncService } from './auditor-documents-sync.service';
import { AuditorDocumentsService } from './auditor-documents.service';
import { AuditorDocumentsController } from './auditor-documents.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditorDocument, Student]),
    RequiredDocsModule,
    AuthModule,
    PagesModule,
  ],
  controllers: [AuditorDocumentsController],
  providers: [AuditorDocumentsSyncService, AuditorDocumentsService],
  exports: [AuditorDocumentsSyncService],
})
export class AuditorModule {}
