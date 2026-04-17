import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/offline.html',
  '/manifest.json',
  '/service-worker.js',
];

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/screenshots') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Check for auth session token (stored as httpOnly cookie by API routes)
  const sessionToken = request.cookies.get('__session')?.value;
  const isAuthenticated = Boolean(sessionToken);

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard and API routes (except public ones)
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isApiRoute = pathname.startsWith('/api/');
  const isDashboardRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/settings');

  if (!isAuthenticated && (isDashboardRoute || (isApiRoute && !isPublicRoute))) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect root to dashboard if authenticated, else to login
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isAuthenticated ? '/dashboard' : '/login', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
