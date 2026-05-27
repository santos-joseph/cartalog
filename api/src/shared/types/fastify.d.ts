import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      companyId: string
      role: string
    }
    user: {
      sub: string
      companyId: string
      role: string
    }
  }
}
