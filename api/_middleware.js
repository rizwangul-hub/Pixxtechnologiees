// api/_middleware.js
// Edge Middleware that adds CORS headers to every API request
// Allows the front‑end at https://pixxtechnologiees.vercel.app to call the API

import { NextResponse } from '@vercel/edge';

export function middleware(req) {
  const origin = req.headers.get('origin') || '*';
  // Only allow the known front‑end domain; fall back to * for any other origin
  const allowedOrigin = origin === 'https://pixxtechnologiees.vercel.app' ? origin : '*';

  const corsHeaders = new Headers({
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  });

  // Handle pre‑flight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // For all other requests, continue processing and attach the CORS headers to the response
  const response = NextResponse.next();
  corsHeaders.forEach((value, name) => {
    response.headers.set(name, value);
  });
  return response;
}
