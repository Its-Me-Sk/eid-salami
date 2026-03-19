import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { pass } = req.query;
  if (pass !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let cursor = 0;
    let allKeys = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: "eid:uid:*",
        count: 100,
      });
      cursor = parseInt(nextCursor);
      allKeys = allKeys.concat(keys);
    } while (cursor !== 0);

    let passed = 0, failed = 0, inProgress = 0;

    if (allKeys.length > 0) {
      const values = await Promise.all(allKeys.map(k => redis.get(k)));
      values.forEach(v => {
        if (v === "done")         passed++;
        else if (v === "failed")  failed++;
        else                      inProgress++;
      });
    }

    return res.status(200).json({
      totalVisitors: allKeys.length,
      passed,
      failed,
      inProgress,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Redis error" });
  }
}