import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { ExcludeDeletedInterceptor } from './common/interceptors/exclude-deleted.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.enableCors({
    origin: true,
    global: true,
    credentials: true,
  });

  process.on('SIGINT', async () => {
    await app.close();
    process.exit(0);
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true, 
  }));
  app.useGlobalInterceptors(new ExcludeDeletedInterceptor());

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('School Auth API')
      .setDescription('Comprehensive API documentation for the School Auth platform.')
      .setVersion('1.0.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide the JWT access token issued during authentication',
      })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'School Auth API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
      },
    });
  } else {
    app.get(WINSTON_MODULE_NEST_PROVIDER).log('Swagger documentation is disabled in production.');
  }

  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
