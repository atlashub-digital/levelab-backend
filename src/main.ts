import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length ? origins : false,
    credentials: true,
  });

  const port = Number(config.get<string>('PORT') ?? 8080);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
