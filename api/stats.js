const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { pass } = req.query;
  if (pass !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Scan all visitor keys
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

    let passed = 0, failed = 0, inProgress = 0;
    let visitors = [];

    if (allKeys.length > 0) {
      const values = await Promise.all(allKeys.map(k => redis.get(k)));

      allKeys.forEach((key, i) => {
        const status = values[i] || "unknown";
        if (status === "done")        passed++;
        else if (status === "failed") failed++;
        else                          inProgress++;

        // Extract IP from key: "eid:visitor:1_2_3_4" → "1.2.3.4"
        const rawIP = key.replace("eid:visitor:", "").replace(/_/g, ".");
        visitors.push({
          key,           // full key (used for targeted reset)
          ip: maskIP(rawIP),
          status,
          statusLabel: status === "done" ? "✅ Passed" : status === "failed" ? "❌ Failed" : "👀 Browsing",
        });
      });
    }

    // Sort: passed first, then failed, then browsing
    const order = { done: 0, failed: 1, started: 2, unknown: 3 };
    visitors.sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

    return res.status(200).json({
      totalVisitors: allKeys.length,
      passed,
      failed,
      inProgress,
      visitors,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Redis error: " + err.message });
  }
};

function maskIP(ip) {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return ip.substring(0, 10) + "...";
}