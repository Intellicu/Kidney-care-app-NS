import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Session management is handled client-side in KidneyCareApp
  // Middleware only needs to pass through requests
  return NextResponse.next({
    request,
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
