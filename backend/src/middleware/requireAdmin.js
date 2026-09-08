const { auth } = require("../auth");

async function requireAdmin(req, res, next) {
  const session = await auth.api.getSession({ headers: toFetchHeaders(req.headers) });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.adminUser = session.user;
  next();
}

function toFetchHeaders(headers) {
  const fetchHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    fetchHeaders.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return fetchHeaders;
}

module.exports = { requireAdmin };
