// api/[...slug].js
// Catch‑all Vercel serverless function that forwards every /api/* request to the existing Express app.

import app from '../Backend/src/app';
import connectDB from '../Backend/src/config/db';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel DB Connection Error]', err.message);
  }
  return app(req, res);
}
