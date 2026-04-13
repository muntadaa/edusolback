import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MailTemplateService {
  /**
   * Resolves the path to a template file, checking dist first then src (so new templates work before rebuild).
   */
  private getTemplatePath(templateName: string): string {
    const fileName = `${templateName}.template.html`;
    const distPath = join(__dirname, 'templates', fileName);
    if (existsSync(distPath)) return distPath;
    const srcPath = join(process.cwd(), 'src', 'mail', 'templates', fileName);
    if (existsSync(srcPath)) return srcPath;
    throw new Error(`Template file not found: ${distPath}`);
  }

  /**
   * Loads and renders an email template with provided variables
   * @param templateName Name of the template file (without .template.html extension)
   * @param variables Object with key-value pairs to replace in template
   * @returns Rendered HTML string
   */
  renderTemplate(templateName: string, variables: Record<string, string>): string {
    try {
      const templatePath = this.getTemplatePath(templateName);

      let template = readFileSync(templatePath, 'utf-8');

      // Replace all {{variable}} placeholders with actual values
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, value);
      });

      return template;
    } catch (error) {
      throw new Error(`Failed to load email template: ${templateName}. Error: ${error.message}`);
    }
  }
}

