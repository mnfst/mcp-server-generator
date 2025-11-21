import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Security headers with Helmet
  app.use(helmet())

  // Enable CORS for specific origins only
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175'
      ]

  app.enableCors({
    origin: allowedOrigins,
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
