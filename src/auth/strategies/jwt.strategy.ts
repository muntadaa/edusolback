import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SECRET') ,
    });
  }

  async validate(payload: any) {
    try {
      // JWT payload uses companyId (camelCase) - see auth.service.ts line 29
      const companyId = payload.companyId || payload.company_id;
      if (!companyId) {
        throw new UnauthorizedException('Invalid token: missing company_id');
      }
      const user = await this.usersService.findOne(payload.userId, companyId);
      return user;
    } catch (error) {
      throw new UnauthorizedException('User not found');
    }
  }
}