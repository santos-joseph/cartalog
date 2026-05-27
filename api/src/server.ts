import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'path'
import { env } from './config/env'
import { errorHandler } from './shared/errors/error-handler'
import { healthRoutes } from './modules/health/health.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { companiesRoutes } from './modules/companies/companies.routes'
import { vehiclesRoutes } from './modules/vehicles/vehicles.routes'
import { leadsRoutes } from './modules/leads/leads.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { catalogRoutes } from './modules/catalog/catalog.routes'

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

async function bootstrap() {
  // ---- Plugins ----
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? [env.FRONTEND_URL] : true,
    credentials: true,
  })

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  })

  await app.register(multipart, {
    limits: { fileSize: env.MAX_FILE_SIZE, files: 20 },
  })

  await app.register(staticFiles, {
    root: path.resolve(env.UPLOAD_DIR),
    prefix: '/uploads/',
  })

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: { title: 'Cartalog API', description: 'SaaS de catalogação de veículos', version: '1.0.0' },
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  })

  // ---- Routes ----
  app.register(healthRoutes)
  app.register(authRoutes, { prefix: '/api/v1/auth' })
  app.register(companiesRoutes, { prefix: '/api/v1/companies' })
  app.register(vehiclesRoutes, { prefix: '/api/v1/vehicles' })
  app.register(leadsRoutes, { prefix: '/api/v1/leads' })
  app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' })
  app.register(catalogRoutes, { prefix: '/api/v1/catalog' })

  // ---- Error handler ----
  app.setErrorHandler(errorHandler)

  // ---- Graceful shutdown ----
  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down...`)
    await app.close()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  await app.listen({ port: env.PORT, host: '0.0.0.0' })

  app.log.info(`🚀 API running at http://localhost:${env.PORT}`)
  app.log.info(`📚 Docs available at http://localhost:${env.PORT}/docs`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
