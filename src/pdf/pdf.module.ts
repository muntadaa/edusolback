import { Global, Module } from '@nestjs/common';
import { PdfLayoutService } from './pdf-layout.service';

/**
 * Global PDF branding layer (pdfmake). Inject {@link PdfLayoutService} in any feature module
 * and build documents with {@link PdfLayoutService.buildDocumentDefinition} + {@link PdfLayoutService.renderToBuffer},
 * or {@link PdfLayoutService.generateBrandedPdf}.
 */
@Global()
@Module({
  providers: [PdfLayoutService],
  exports: [PdfLayoutService],
})
export class PdfModule {}
