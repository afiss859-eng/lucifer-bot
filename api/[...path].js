'use strict';

// Vercel Node Functions expose the incoming URL in req.url. The catch-all
// route parameter is not guaranteed to be present in req.query, which only
// contains query-string values in the Node runtime.
const ROUTES = new Map([
  ['status', ['GET']],
  ['paircode/poll', ['GET']],
  ['paircode', ['POST']],
]);

function reply(res, status, message) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.end(JSON.stringify({ error: message }));
}

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function getRoute(req) {
  const candidates = [req.url, req.originalUrl];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate) continue;
    try {
      const pathname = new URL(candidate, 'https://lucifer.invalid').pathname;
      const apiIndex = pathname.lastIndexOf('/api/');
      let route = apiIndex >= 0
        ? pathname.slice(apiIndex + '/api/'.length)
        : pathname.replace(/^\\/+/, '');

      route = route
        .split('/')
        .filter(Boolean)
        .map(decodeSegment)
        .join('/');

      // Ignore framework placeholders and try the next source instead.
      if (route && !route.includes('[...')) return route;
    } catch {
      // Try originalUrl or the legacy route parameter below.
    }
  }

  // Compatibility fallback for adapters that inject catch-all params.
  const rawPath = req.query && req.query.path;
  const parts = Array.isArray(rawPath)
    ? rawPath
    : typeof rawPath === 'string'
      ? rawPath.split('/')
      : [];
  return parts.map((part) => decodeSegment(String(part))).join('/');
}

module.exports = async function handler(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const route = getRoute(req);
  const allowedMethods = ROUTES.get(route);

  if (!allowedMethods || !allowedMethods.includes(method)) {
    return reply(res, 404, 'Route ou méthode non autorisée.');
  }

  const configuredUrl = String(process.env.BOT_API_URL || '').trim();
  if (!configuredUrl) {
    return reply(res, 503, 'Le moteur WhatsApp n’est pas encore relié. Configurez BOT_API_URL dans Vercel.');
  }

  let upstreamUrl;
  try {
    const base = new URL(configuredUrl);
    const isLocalHttp = base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname);
    if ((base.protocol !== 'https:' && !isLocalHttp) || base.username || base.password || base.search || base.hash) {
      return reply(res, 500, 'BOT_API_URL doit être une URL HTTPS valide, sans identifiants ni paramètres.');
    }

    const prefix = base.pathname.replace(/\\/+$/, '');
    base.pathname = `${prefix}/api/${route}`;
    base.search = '';

    for (const [key, value] of Object.entries(req.query || {})) {
      if (key === 'path' || value == null) continue;
      for (const item of Array.isArray(value) ? value : [value]) {
        base.searchParams.append(key, String(item));
      }
    }
    upstreamUrl = base;
  } catch {
    return reply(res, 500, 'BOT_API_URL n’est pas une URL valide.');
  }

  const headers = { Accept: 'application/json' };
  const contentType = req.headers && req.headers['content-type'];
  if (contentType) headers['Content-Type'] = String(contentType);

  const adminToken = req.headers && req.headers['x-admin-token'];
  if (typeof adminToken === 'string' && adminToken.length <= 256) {
    headers['x-admin-token'] = adminToken;
  }

  const clientIp = req.headers && req.headers['x-forwarded-for'];
  if (typeof clientIp === 'string' && clientIp.length <= 200) {
    headers['x-forwarded-for'] = clientIp;
  }

  let body;
  if (method !== 'GET' && method !== 'HEAD' && req.body !== undefined) {
    body = typeof req.body === 'string' || Buffer.isBuffer(req.body)
      ? req.body
      : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(upstreamUrl, { method, headers, body });
    const responseBody = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.send(responseBody);
  } catch {
    return reply(res, 502, 'Le serveur WhatsApp ne répond pas. Vérifiez le service qui exécute le bot.');
  }
};
