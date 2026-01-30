import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests - authentication is handled client-side with localStorage
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
