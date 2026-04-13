import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PagesService } from './pages/pages.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly pagesService: PagesService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const user = req.user;
    const roles = user.userRoles?.map((ur: any) => ur.role?.code).filter(Boolean) || [];
    const roleIds = user.userRoles?.map((ur: any) => ur.role?.id).filter(Boolean) || [];
    
    // Get allowed pages for this user's roles
    const allowedPages = await this.pagesService.getAllowedRoutes(roleIds, user.company_id);
    
    return {
      message: 'This is a protected route',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone || null,
        picture: user.picture || null,
        privacyPolicyAccepted: user.privacyPolicyAccepted || false,
        termsAccepted: user.termsAccepted || false,
        consentAcceptedAt: user.consentAcceptedAt || null,
        roles,
        allowedPages,
        company_id: user.company_id,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          email: user.company.email,
        } : null,
      },
    };
  }
}
