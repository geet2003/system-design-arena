import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !request.cookies.has('sds_token')) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    // Prevent caching so the browser doesn't serve a stale authenticated page
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
