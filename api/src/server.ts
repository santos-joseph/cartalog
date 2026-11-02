import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'path'
import { readFile } from 'node:fs/promises'
import { env } from './config/env'
import { errorHandler } from './shared/errors/error-handler'
import { healthRoutes } from './modules/health/health.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { companiesRoutes } from './modules/companies/companies.routes'
import { vehiclesRoutes } from './modules/vehicles/vehicles.routes'
import { leadsRoutes } from './modules/leads/leads.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { catalogRoutes } from './modules/catalog/catalog.routes'
import { usersRoutes } from './modules/users/users.routes'
import { demoRoutes } from './modules/demo/demo.routes'
import { platformRoutes } from './modules/platform/platform.routes'
import { auditStoreResponse } from './shared/audit/store-audit'
import { registerRouteMetadata } from './docs/route-metadata'

const app = Fastify({
  trustProxy: env.TRUST_PROXY,
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

async function bootstrap() {
  app.addHook('onSend', auditStoreResponse)
  registerRouteMetadata(app)
  // ---- Plugins ----
  await app.register(cors, {
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin:
      env.NODE_ENV === 'production'
        ? (origin, cb) => {
            if (
              !origin ||
              origin === `https://${env.BASE_DOMAIN}` ||
              origin.endsWith(`.${env.BASE_DOMAIN}`)
            ) {
              cb(null, true)
            } else {
              cb(new Error('CORS not allowed'), false)
            }
          }
        : true,
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
      info: {
        title: 'Cartalog API',
        description: 'Rotas agrupadas por área do sistema. Use **Authorize** para informar o token JWT. [Ver diagrama do banco de dados](/docs/database) · [Abrir DBML para dbdiagram](/docs/banco-de-dados.dbml) · [Baixar SQL do schema](/docs/banco-de-dados.sql).',
        version: '2.0.0',
      },
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'none', filter: true, deepLinking: true, displayRequestDuration: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
    theme: {
      title: 'Cartalog · Documentação da API',
      css: [{
        filename: 'cartalog-docs.css',
        content: '.swagger-ui .topbar{background:#19191d;border-bottom:3px solid #d60824}.swagger-ui .topbar .topbar-wrapper img{display:none}.swagger-ui .topbar .topbar-wrapper a:before{content:"Cartalog / API";color:#fff;font:700 21px system-ui,sans-serif;letter-spacing:-.04em}.swagger-ui .info .title{letter-spacing:-.04em}.swagger-ui .btn.authorize{color:#c9001e;border-color:#c9001e}.swagger-ui .btn.authorize svg{fill:#c9001e}.swagger-ui .filter .operation-filter-input{border-radius:8px}',
      }],
    },
  })

  const readProjectDoc = async (fileName: string) => {
    const root = process.cwd()
    try {
      return await readFile(path.join(root, '..', 'docs', fileName))
    } catch {
      return readFile(path.join(root, 'docs', fileName))
    }
  }
  app.get('/docs/database', { schema: { hide: true } }, async (_request, reply) => {
    return reply.type('text/html; charset=utf-8').send(await readProjectDoc('banco-de-dados.html'))
  })
  app.get('/docs/banco-de-dados.sql', { schema: { hide: true } }, async (_request, reply) => {
    return reply.type('text/plain; charset=utf-8').send(await readProjectDoc('banco-de-dados.sql'))
  })
  app.get('/docs/banco-de-dados.dbml', { schema: { hide: true } }, async (_request, reply) => {
    return reply.type('text/plain; charset=utf-8').send(await readProjectDoc('banco-de-dados.dbml'))
  })

  // ---- Routes ----
  app.register(healthRoutes)
  app.register(authRoutes, { prefix: '/api/v1/auth' })
  app.register(companiesRoutes, { prefix: '/api/v1/companies' })
  app.register(vehiclesRoutes, { prefix: '/api/v1/vehicles' })
  app.register(leadsRoutes, { prefix: '/api/v1/leads' })
  app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' })
  app.register(catalogRoutes, { prefix: '/api/v1/catalog' })
  app.register(usersRoutes, { prefix: '/api/v1/users' })
  app.register(demoRoutes, { prefix: '/api/v1/demo-requests' })
  app.register(platformRoutes, { prefix: '/api/v1/platform' })

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
  app.log.info(`🌐 Base domain: ${env.BASE_DOMAIN}`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
