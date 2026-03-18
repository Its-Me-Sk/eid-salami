// api/check-visitor.js
// Checks if this IP has visited before, and stamps it if not.

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // Allow CORS for same-origin fetch
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Get the real IP (Vercel sets x-forwarded-for)
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  // Sanitize IP for use as a Redis key
  const key = `eid:visitor:${ip.replace(/[^a-zA-Z0-9:.]/g, "_")}`;

  try {
    const existing = await redis.get(key);

    if (req.method === "POST") {
      // Mark this IP as having visited — called when user first loads the page
      if (!existing) {
        // Expire after 30 days
        await redis.set(key, "started", { ex: 60 * 60 * 24 * 30 });
      }
      return res.status(200).json({ ok: true });
    }

    // GET — just check status
    return res.status(200).json({
      visited: !!existing,
      status: existing || null,
    });
  } catch (err) {
    console.error("Redis error:", err);
    // On error, fail open (don't block the user)
    return res.status(200).json({ visited: false, error: true });
  }
}