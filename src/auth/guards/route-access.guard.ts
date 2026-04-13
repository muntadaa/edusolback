import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PagesService } from '../../pages/pages.service';
import { PAGE_ROUTE_METADATA_KEY } from '../../common/decorators/require-page-route.decorator';

@Injectable()
export class RouteAccessGuard implements CanActivate {
  private readonly logger = new Logger(RouteAccessGuard.name);

  constructor(
    private reflector: Reflector,
    private pagesService: PagesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPageRoute = this.reflector.get<string>(PAGE_ROUTE_METADATA_KEY, context.getHandler());

    if (!requiredPageRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const companyId = user.company_id;
    if (!companyId) {
      throw new ForbiddenException('User must belong to a company');
    }

    const roleIds = (user.userRoles ?? [])
      .map((ur: { role_id?: number }) => ur.role_id)
      .filter((id: number | undefined): id is number => typeof id === 'number' && id > 0);

    if (roleIds.length === 0) {
      this.logger.warn(`User ${user.id} has no roles; denied page route '${requiredPageRoute}'`);
      throw new ForbiddenException('You do not have access to perform this action');
    }

    const hasAccess = await this.pagesService.hasAccessToRoute(roleIds, requiredPageRoute, companyId);

    if (!hasAccess) {
      this.logger.warn(
        `User ${user.id} denied: missing page route '${requiredPageRoute}' in company ${companyId}`,
      );
      throw new ForbiddenException(`You do not have access to this page: ${requiredPageRoute}`);
    }

    return true;
  }
}

