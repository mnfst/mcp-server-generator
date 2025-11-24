import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Security headers with Helmet (relaxed for SSE)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow SSE
  }))

  // Enable CORS for all origins (POC - not for production)
  app.enableCors({
    origin: true,
    credentials: true
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  const port = process.env.BACKEND_PORT || 3001
  await app.listen(port)
  console.log(`Backend is running on http://localhost:${port}`)
}

bootstrap()
