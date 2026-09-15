import { NextResponse, type NextRequest } from 'next/server';

const CANONICAL_HOST = 'checkmyprofolio.vercel.app';

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get('host');

  if (!hostHeader) {
    return NextResponse.next();
  }

  const hostname = hostHeader.split(':')[0];

  if (hostname === CANONICAL_HOST || isLocalHost(hostname)) {
    return NextResponse.next();
  }

  const canonicalUrl = request.nextUrl.clone();
  canonicalUrl.protocol = 'https';
  canonicalUrl.host = CANONICAL_HOST;

  return NextResponse.redirect(canonicalUrl, 308);
}

export const config = {
  matcher: '/:path*',
};
