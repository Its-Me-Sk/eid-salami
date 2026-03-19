const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { pass } = req.query;
  if (pass !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Scan all eid:visitor:* keys and delete them all
    let cursor = 0;
    let allKeys = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: "eid:visitor:*",
        count: 100,
      });
      cursor = parseInt(nextCursor);
      allKeys = allKeys.concat(keys);
    } while (cursor !== 0);

    if (allKeys.length > 0) {
      await Promise.all(allKeys.map(k => redis.del(k)));
    }

    return res.status(200).json({ ok: true, deleted: allKeys.length });
  } catch (err) {
    console.error("reset-all error:", err);
    return res.status(500).json({ error: err.message });
  }
}

handler.config = { api: { bodyParser: false } };
module.exports = handler;