import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PagesService } from '../../pages/pages.service';

@Injectable()
export class RouteAccessGuard implements CanActivate {
  private readonly logger = new Logger(RouteAccessGuard.name);

  constructor(
    private reflector: Reflector,
    private pagesService: PagesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get route metadata (if set)
    const requiredRoute = this.reflector.get<string>('route', context.getHandler());
    
    // If no route metadata, skip this guard (not all routes need route-based protection)
    if (!requiredRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const profile = user.profile;
    const requestedRoute = request.path || requiredRoute;

    const companyId = user.company_id;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    // Admin has access to everything in their company
    if (profile === 'admin') {
      return true;
    }

    // Check if user's profile has access to this route in their company
    const hasAccess = await this.pagesService.hasAccessToRoute(profile, requestedRoute, companyId);

    if (!hasAccess) {
      this.logger.warn(`User ${user.id} with profile '${profile}' attempted to access route '${requestedRoute}' in company ${companyId}`);
      throw new ForbiddenException(`You do not have access to this route: ${requestedRoute}`);
    }

    return true;
  }
}

