import { NextResponse } from 'next/server';

// Temporary access lock for the paused project. Remove this file to resume public access.
export function proxy() {
  return new NextResponse(null, {
    status: 404,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export const config = {
  matcher: '/:path*',
};
