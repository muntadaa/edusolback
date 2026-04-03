import type { Company } from '../company/entities/company.entity';

/** Minimal company fields used for PDF branding (matches DB / API shape). */
export type PdfCompanyBranding = Pick<
  Company,
  | 'name'
  | 'logo'
  | 'primaryColor'
  | 'entete_1'
  | 'entete_2'
  | 'entete_3'
  | 'pied_1'
  | 'pied_2'
  | 'pied_3'
  | 'logo_left'
  | 'logo_right'
  | 'papier_entete'
>;

/** pdfmake content node (loosely typed — pdfmake has no official TS defs). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PdfContent = any;

/** Options for building a full branded document. */
export interface BrandedPdfDocumentOptions {
  /** Shown under the company block (e.g. document type). */
  title: string;
  subtitle?: string;
  company?: PdfCompanyBranding | null;
  /** Main body — use helpers on {@link PdfLayoutService} for field rows / pills. */
  content: PdfContent[];
  /** pdfmake metadata */
  info?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

export interface LabeledFieldOptions {
  required?: boolean;
}

export interface DayPillOptions {
  /** e.g. ['Mon','Tue',...] — defaults to Mon–Sun */
  labels?: string[];
}
