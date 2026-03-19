const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const key = `eid:visitor:${ip.replace(/[^a-zA-Z0-9:.]/g, "_")}`;

  try {
    const existing = await redis.get(key);

    if (req.method === "POST") {
      if (!existing) {
        await redis.set(key, "started", { ex: 60 * 60 * 24 * 30 });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({
      visited: !!existing,
      status: existing || null,
    });
  } catch (err) {
    console.error("Redis error:", err);
    return res.status(200).json({ visited: false, error: true });
  }
};