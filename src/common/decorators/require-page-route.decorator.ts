import { SetMetadata } from '@nestjs/common';

/** Metadata key read by `RouteAccessGuard`. */
export const PAGE_ROUTE_METADATA_KEY = 'route';

/**
 * Declares which frontend page route (must match `pages.route` / role_pages) is required
 * to call this handler. Used with `RouteAccessGuard` + JWT.
 */
export const RequirePageRoute = (route: string) => SetMetadata(PAGE_ROUTE_METADATA_KEY, route);
