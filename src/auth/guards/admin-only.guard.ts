import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has admin role
    const hasAdminRole = user.userRoles?.some((ur: any) => ur.role?.code === 'admin') || false;

    if (!hasAdminRole) {
      throw new ForbiddenException('Only administrators can perform this action');
    }

    return true;
  }
}

