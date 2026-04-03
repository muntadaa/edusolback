import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  PDF_BORDER_LIGHT,
  PDF_DEFAULT_ACCENT,
  PDF_DEFAULT_MARGINS,
  PDF_FIELD_INNER_BG,
  PDF_PILL_INACTIVE_BG,
  PDF_PILL_INACTIVE_TEXT,
  PDF_TEXT_MUTED,
  PDF_TEXT_PRIMARY,
} from './pdf-theme';
import type {
  BrandedPdfDocumentOptions,
  DayPillOptions,
  LabeledFieldOptions,
  PdfContent,
} from './pdf-layout.types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMake = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfVfs = require('pdfmake/build/vfs_fonts');

let vfsLoaded = false;

function ensurePdfFonts(): void {
  if (vfsLoaded) {
    return;
  }
  for (const key of Object.keys(pdfVfs)) {
    pdfMake.virtualfs.writeFileSync(key, pdfVfs[key], 'base64');
  }
  pdfMake.setFonts({
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  });
  pdfMake.setUrlAccessPolicy((url: string) => {
    if (!url || url.startsWith('data:')) {
      return true;
    }
    return url.startsWith('file://');
  });
  vfsLoaded = true;
}

/**
 * Branded PDFs read layout from {@link Company}: one `logo` path, `logo_left` / `logo_right` for placement,
 * up to three `entete_*` and `pied_*` lines, `primaryColor`, and `papier_entete` to skip embedded letterhead.
 */
@Injectable()
export class PdfLayoutService {
  private readonly logger = new Logger(PdfLayoutService.name);

  /** Accent from company.primaryColor or default orange (UI). */
  resolveAccent(company?: { primaryColor?: string | null } | null): string {
    const c = company?.primaryColor?.trim();
    if (c && /^#[0-9A-Fa-f]{6}$/.test(c)) {
      return c;
    }
    return PDF_DEFAULT_ACCENT;
  }

  /**
   * Table layout: single cell with colored border (form field look).
   */
  private fieldBoxLayout(accent: string) {
    return {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => accent,
      vLineColor: () => accent,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    };
  }

  /**
   * One labeled field (orange label + bordered value), for use inside a columns/table row.
   */
  labeledField(
    label: string,
    value: string,
    accent: string,
    options?: LabeledFieldOptions,
  ): PdfContent {
    const req = options?.required ? ' *' : '';
    return {
      stack: [
        {
          text: `${label}${req}`,
          color: accent,
          fontSize: 9,
          bold: true,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: value && String(value).trim() !== '' ? value : '—',
                  color: PDF_TEXT_PRIMARY,
                  fontSize: 10,
                  fillColor: PDF_FIELD_INNER_BG,
                  margin: [10, 10, 10, 10],
                },
              ],
            ],
          },
          layout: this.fieldBoxLayout(accent),
        },
      ],
    };
  }

  /**
   * Two fields side by side (Start / End date or Start / End hour style).
   */
  twoColumnFields(
    left: { label: string; value: string; required?: boolean },
    right: { label: string; value: string; required?: boolean },
    accent: string,
  ): PdfContent {
    return {
      columns: [
        { width: '*', stack: [this.labeledField(left.label, left.value, accent, { required: left.required })] },
        { width: 16, text: '' },
        { width: '*', stack: [this.labeledField(right.label, right.value, accent, { required: right.required })] },
      ],
    };
  }

  /**
   * “Days of week” pill row like the web UI (selected = orange fill + white text).
   */
  dayPills(
    selected: string[],
    accent: string,
    options?: DayPillOptions,
  ): PdfContent {
    const labels = options?.labels ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sel = new Set(selected.map((s) => s.trim()));
    const cells = labels.map((day) => {
      const on = sel.has(day);
      return {
        text: day,
        alignment: 'center' as const,
        fontSize: 8,
        bold: true,
        fillColor: on ? accent : PDF_PILL_INACTIVE_BG,
        color: on ? '#FFFFFF' : PDF_PILL_INACTIVE_TEXT,
        margin: [4, 6, 4, 6],
      };
    });
    return {
      stack: [
        {
          text: 'Days of week * (select one or more)',
          color: accent,
          fontSize: 9,
          bold: true,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            widths: labels.map(() => '*'),
            body: [cells],
          },
          layout: 'noBorders',
        },
      ],
    };
  }

  /**
   * Builds the full pdfmake document definition: header band, title, body, footer.
   * Letterhead comes from {@link Company}: `logo` + `logo_left` / `logo_right`, `entete_*`, `pied_*`,
   * and `papier_entete` (omit printed header/footer text when using pre-printed letterhead).
   * Pass `content` from your feature; reuse {@link #labeledField}, {@link #twoColumnFields}, {@link #dayPills}.
   */
  buildDocumentDefinition(options: BrandedPdfDocumentOptions): Record<string, unknown> {
    ensurePdfFonts();
    const accent = this.resolveAccent(options.company ?? undefined);
    const company = options.company;
    const skipPrintedLetterhead = company?.papier_entete === true;

    const headerStack: PdfContent[] = [];
    if (!skipPrintedLetterhead && company?.name) {
      headerStack.push({
        text: company.name,
        fontSize: 16,
        bold: true,
        color: PDF_TEXT_PRIMARY,
        margin: [0, 0, 0, 4],
      });
    }
    if (!skipPrintedLetterhead) {
      const entetes = [company?.entete_1, company?.entete_2, company?.entete_3].filter(Boolean) as string[];
      for (const line of entetes) {
        headerStack.push({ text: line, fontSize: 9, color: PDF_TEXT_MUTED, margin: [0, 0, 0, 2] });
      }
    }

    const centerStack: PdfContent[] =
      headerStack.length > 0 ? headerStack : [{ text: '\u200B', fontSize: 1 }];

    const headerColumns: PdfContent[] = [];
    const logoData =
      !skipPrintedLetterhead && company ? this.tryLoadLogoDataUrl(company) : undefined;
    if (!skipPrintedLetterhead && company?.logo_left && logoData) {
      headerColumns.push({ image: logoData, width: 56, margin: [0, 0, 12, 0] });
    }
    headerColumns.push({ width: '*', stack: centerStack });
    if (!skipPrintedLetterhead && company?.logo_right && logoData) {
      headerColumns.push({ image: logoData, width: 56, margin: [12, 0, 0, 0] });
    }

    const headerBody: PdfContent =
      headerColumns.length > 1 ? { columns: headerColumns } : { stack: centerStack };

    const header: PdfContent = {
      stack: [
        headerBody,
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: accent }],
          margin: [0, 10, 0, 0],
        },
      ],
    };

    const afterHeader: PdfContent[] = [
      {
        text: options.title,
        fontSize: 14,
        bold: true,
        color: PDF_TEXT_PRIMARY,
        margin: [0, 16, 0, 4],
      },
    ];
    if (options.subtitle) {
      afterHeader.push({
        text: options.subtitle,
        fontSize: 10,
        color: PDF_TEXT_MUTED,
        margin: [0, 0, 0, 16],
      });
    } else {
      afterHeader.push({ text: '', margin: [0, 0, 0, 12] });
    }

    const footerLines = skipPrintedLetterhead
      ? []
      : ([company?.pied_1, company?.pied_2, company?.pied_3].filter(Boolean) as string[]);

    return {
      pageSize: 'A4',
      pageMargins: PDF_DEFAULT_MARGINS,
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: PDF_TEXT_PRIMARY,
      },
      info: {
        title: options.info?.title ?? options.title,
        author: options.info?.author ?? company?.name ?? undefined,
        subject: options.info?.subject,
        keywords: options.info?.keywords,
      },
      header: () => header,
      footer: (currentPage: number, pageCount: number) => ({
        stack: [
          {
            canvas: [
              { type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: PDF_BORDER_LIGHT },
            ],
            margin: [0, 0, 0, 6],
          },
          ...footerLines.map((t) => ({
            text: t,
            fontSize: 8,
            color: PDF_TEXT_MUTED,
            alignment: 'center' as const,
          })),
          {
            text: `Page ${currentPage} / ${pageCount}`,
            fontSize: 8,
            color: PDF_TEXT_MUTED,
            alignment: 'center' as const,
            margin: [0, 6, 0, 0],
          },
        ],
        margin: [40, 0, 40, 0],
      }),
      content: [...afterHeader, ...options.content],
    };
  }

  async renderToBuffer(docDefinition: Record<string, unknown>): Promise<Buffer> {
    ensurePdfFonts();
    const pdf = pdfMake.createPdf(docDefinition);
    return pdf.getBuffer() as Promise<Buffer>;
  }

  /**
   * Convenience: definition + buffer in one call.
   */
  async generateBrandedPdf(options: BrandedPdfDocumentOptions): Promise<Buffer> {
    const def = this.buildDocumentDefinition(options);
    return this.renderToBuffer(def);
  }

  private tryLoadLogoDataUrl(company: { logo?: string | null }): string | undefined {
    const logo = company.logo?.trim();
    if (!logo) {
      return undefined;
    }
    const rel = logo.replace(/^\//, '');
    const abs = join(process.cwd(), rel);
    if (!existsSync(abs)) {
      this.logger.debug(`PDF logo not found on disk: ${abs}`);
      return undefined;
    }
    try {
      const buf = readFileSync(abs);
      const ext = abs.split('.').pop()?.toLowerCase();
      const mime =
        ext === 'png'
          ? 'image/png'
          : ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : ext === 'gif'
              ? 'image/gif'
              : ext === 'webp'
                ? 'image/webp'
                : 'application/octet-stream';
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch (e) {
      this.logger.warn(`Could not read logo for PDF: ${abs}`);
      return undefined;
    }
  }
}
