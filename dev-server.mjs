// Local development server.
// Serves the static site and runs the Vercel-style functions in /api
// (chat + analyze) so the chatbot and website analyzer work locally.
//
// Run with:  node --env-file=.env dev-server.mjs
// Then open: http://localhost:3000
//
// This file is for local development only — Vercel ignores it in production.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

import chatHandler from './api/chat.js';
import analyzeHandler from './api/analyze.js';

const PORT = process.env.PORT || 3000;
const ROOT = import.meta.dirname;

const API_ROUTES = {
  '/api/chat': chatHandler,
  '/api/analyze': analyzeHandler,
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Minimal shim for the Vercel res API (status().json()) used by /api handlers.
function wrapRes(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(payload) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload));
      return this;
    },
    setHeader: (...args) => res.setHeader(...args),
    end: (...args) => res.end(...args),
  };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  const apiHandler = API_ROUTES[url.pathname];
  if (apiHandler) {
    req.body = await readJsonBody(req);
    try {
      await apiHandler(req, wrapRes(res));
    } catch (err) {
      console.error(`Error in ${url.pathname}:`, err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Static files
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = join(ROOT, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));

  try {
    const data = await readFile(filePath);
    res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
  console.log(`GROQ_API_KEY loaded: ${process.env.GROQ_API_KEY ? 'yes' : 'NO — chat will not work'}`);
});
