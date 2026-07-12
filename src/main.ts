import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import * as morgan from 'morgan';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/iclock', express.text({ type: '*/*' }));
  app.use(morgan('dev'));
  app.enableCors();
  setupSwagger(app);
  await app.listen(process.env.PORT);
}
bootstrap();
