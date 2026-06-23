import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';

async function bootstrap() {
  const adapter = new FastifyAdapter({ bodyLimit: 16 * 1024 * 1024 });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  // Multipart for logo uploads (single file, 8 MB cap).
  await app.register(multipart, {
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  });

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // Everything is under /api EXCEPT the uploaded-file route, which serves at
  // /uploads/:filename (matching the public URLs stored on sites/sections).
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'uploads/:filename', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // NOTE: implicit conversion is intentionally OFF — it corrupts arrays of
      // objects (e.g. navItems) by coercing each element to the array type.
      // Query/route numbers are converted explicitly in controllers instead.
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Website Builder API')
    .setDescription('CRUD + public rendering API for the no-code site builder.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen({ port, host: '0.0.0.0' });
  // eslint-disable-next-line no-console
  console.log(`API ready on http://localhost:${port}  (docs: /docs)`);
}

void bootstrap();
