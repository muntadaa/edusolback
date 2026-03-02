import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CaptchaService } from './captcha.service';
import { VerifyCaptchaDto } from './dto/verify-captcha.dto';
import { GenerateCaptchaResponseDto } from './dto/generate-captcha.dto';

@ApiTags('captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a new CAPTCHA challenge' })
  @ApiResponse({
    status: 200,
    description: 'CAPTCHA challenge generated successfully',
    type: GenerateCaptchaResponseDto,
  })
  async generate(): Promise<GenerateCaptchaResponseDto> {
    return await this.captchaService.generateCaptcha();
  }

  @Post('pre-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Pre-verify CAPTCHA answer without consuming token',
    description: 'Verifies the CAPTCHA answer immediately but keeps the token valid for form submission. Use this when the user solves the CAPTCHA in the UI, then submit the token with your form.'
  })
  @ApiResponse({
    status: 200,
    description: 'CAPTCHA pre-verified successfully, token is now valid for 5 minutes',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        message: { type: 'string', example: 'CAPTCHA pre-verified successfully. You can now submit your form with this token.' },
        token: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid CAPTCHA answer or token',
  })
  async preVerify(@Body() verifyCaptchaDto: VerifyCaptchaDto): Promise<{
    valid: boolean;
    message: string;
    token: string;
  }> {
    await this.captchaService.preVerifyCaptcha(
      verifyCaptchaDto.token,
      verifyCaptchaDto.answer,
    );
    return {
      valid: true,
      message: 'CAPTCHA pre-verified successfully. You can now submit your form with this token.',
      token: verifyCaptchaDto.token,
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify CAPTCHA answer (consumes the token)' })
  @ApiResponse({
    status: 200,
    description: 'CAPTCHA verified successfully',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        message: { type: 'string', example: 'CAPTCHA verified successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid CAPTCHA answer or token',
  })
  async verify(@Body() verifyCaptchaDto: VerifyCaptchaDto): Promise<{
    valid: boolean;
    message: string;
  }> {
    await this.captchaService.verifyCaptcha(
      verifyCaptchaDto.token,
      verifyCaptchaDto.answer,
    );
    return {
      valid: true,
      message: 'CAPTCHA verified successfully',
    };
  }

  @Get('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate CAPTCHA token (without consuming it)' })
  @ApiResponse({
    status: 200,
    description: 'Token validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
      },
    },
  })
  async validate(@Query('token') token: string): Promise<{ valid: boolean }> {
    const isValid = await this.captchaService.validateToken(token);
    return { valid: isValid };
  }

  @Get('token-status/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed CAPTCHA token status (for debugging)' })
  @ApiResponse({
    status: 200,
    description: 'Token status details',
  })
  async getTokenStatus(@Param('token') token: string): Promise<any> {
    return await this.captchaService.getTokenStatus(token);
  }
}
