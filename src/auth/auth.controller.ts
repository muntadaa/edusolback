import { Controller, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Request, Query, UnauthorizedException, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto, ResetPasswordWithTokenDto, ChangePasswordDto, SetPasswordDto, ValidateTokenDto } from './dto/auth.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { log } from 'console';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    log('registerDto');
    const user = await this.authService.register(registerDto);
    log
    return {
      message: 'User created successfully',
      user,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(
      forgotPasswordDto.email,
      forgotPasswordDto.captchaToken,
      forgotPasswordDto.captchaAnswer,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordWithTokenDto,
  ) {
    return await this.authService.resetPassword(token, resetPasswordDto.password);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const companyId = req.user.company_id || req.user.companyId;
    if (!companyId) {
      throw new UnauthorizedException('User must belong to a company');
    }
    return await this.authService.changePassword(req.user.id, changePasswordDto, companyId);
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body() validateTokenDto: ValidateTokenDto) {
    return await this.authService.validatePasswordSetToken(validateTokenDto.token);
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Body() setPasswordDto: SetPasswordDto) {
    return await this.authService.setPassword(setPasswordDto);
  }

  @Get('check-setup')
  @HttpCode(HttpStatus.OK)
  async checkSetup(@Query('company_id') companyId?: number) {
    return await this.authService.checkSystemSetup(companyId);
  }

  @Post('setup-admin')
  @HttpCode(HttpStatus.CREATED)
  async setupAdmin(@Body() setupAdminDto: SetupAdminDto) {
    return await this.authService.setupFirstAdmin(setupAdminDto);
  }
}