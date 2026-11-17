import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/session'

// Anyone without a genuine, unexpired login is shown the login page instead of
// being left on a page that spins forever waiting for data it is not allowed to
// see. This is only a convenience: the real protection is still the check inside
// every API route (lib/auth.ts), which reads role and customer from the database.
// It uses a rewrite (the login page is served at the same address) rather than a
// redirect, so it does not depend on the Host header that nginx passes through.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/login') return NextResponse.next()
  if (verifySession(request.cookies.get('ps_user')?.value)) return NextResponse.next()
  return NextResponse.rewrite(new URL('/login', request.url))
}

export const config = {
  // Pages only: skip API routes (they answer 401 themselves), Next.js internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)'],
}
