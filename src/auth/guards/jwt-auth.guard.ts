import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // If there's an error or no user, provide a helpful error message
    if (err || !user) {
      // Check if token is missing
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Authentication token is missing. Please provide a valid JWT token in the Authorization header as: Bearer <token>');
      }
      
      // Check for specific JWT errors
      if (info) {
        if (info.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Authentication token has expired. Please log in again.');
        }
        if (info.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid authentication token. Please log in again.');
        }
        if (info.name === 'NotBeforeError') {
          throw new UnauthorizedException('Authentication token is not yet valid.');
        }
      }
      
      // Generic error message
      throw new UnauthorizedException('Authentication failed. Please provide a valid JWT token.');
    }
    
    return user;
  }
}