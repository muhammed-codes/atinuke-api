// Simple health check to verify Vercel serves serverless functions
module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
};
