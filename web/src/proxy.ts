import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost'

function extractSlug(host: string): string | null {
  const hostname = host.split(':')[0]
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, hostname.length - '.localhost'.length)
    if (sub && sub !== 'www' && sub !== 'api') return sub
  }
  if (BASE_DOMAIN !== 'localhost' && hostname.endsWith('.' + BASE_DOMAIN)) {
    const sub = hostname.slice(0, hostname.length - BASE_DOMAIN.length - 1)
    if (sub && sub !== 'www' && sub !== 'api') return sub
  }
  return null
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const slug = extractSlug(host)
  if (!slug) return NextResponse.next()

  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/brand/')) return NextResponse.next()

  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/dashboard') || pathname.startsWith('/platform')) {
    const url = request.nextUrl.clone()
    url.hostname = BASE_DOMAIN
    return NextResponse.redirect(url)
  }

  // Se a URL ainda tem o slug no path (ex: staging.dominio.com/staging/veiculos),
  // redireciona para a URL limpa (staging.dominio.com/veiculos)
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    const cleanPath = pathname === `/${slug}` ? '/' : pathname.slice(slug.length + 1)
    const url = request.nextUrl.clone()
    url.pathname = cleanPath || '/'
    return NextResponse.redirect(url, 301)
  }

  // Reescreve internamente /veiculos → /staging/veiculos para o roteamento Next.js
  const url = request.nextUrl.clone()
  url.pathname = `/${slug}${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
