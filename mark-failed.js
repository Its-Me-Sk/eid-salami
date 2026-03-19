// api/mark-failed.js — called when someone gets a wrong answer

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const key = `eid:visitor:${ip.replace(/[^a-zA-Z0-9:.]/g, "_")}`;

  try {
    const existing = await redis.get(key);
    // Only mark failed if they haven't already passed
    if (existing !== "done") {
      await redis.set(key, "failed", { ex: 60 * 60 * 24 * 365 });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: false });
  }
}