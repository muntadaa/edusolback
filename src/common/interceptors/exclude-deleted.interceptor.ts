import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeDeletedInterceptor implements NestInterceptor {
  private readonly statusKeys = ['status', 'Status', 'statut', 'Statut'];

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => this.cleanData(data)));
  }

  private cleanData<T>(value: T): T | undefined {
    if (Array.isArray(value)) {
      const cleanedArray = value
        .map(item => this.cleanData(item))
        .filter(item => item !== undefined);
      return cleanedArray as unknown as T;
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    if (value instanceof Date || value instanceof RegExp || value instanceof Buffer) {
      return value;
    }

    if (this.isDeletedRecord(value as Record<string, any>)) {
      return undefined;
    }

    const cleanedObject: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      const cleanedValue = this.cleanData(val);
      if (cleanedValue !== undefined) {
        cleanedObject[key] = cleanedValue;
      }
    }

    return cleanedObject as T;
  }

  private isDeletedRecord(value: Record<string, any>): boolean {
    return this.statusKeys.some(key => value[key] === -2);
  }
}

