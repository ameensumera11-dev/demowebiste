// /api/analyze.js
// Vercel Serverless Function — fetches a given URL server side (avoids
// browser CORS restrictions) and reports back basic speed and SEO signals:
// response time, page size, title, meta description, viewport tag,
// HTTPS check and image count. This runs fresh on every request, so the
// numbers are real time for whatever URL is submitted.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid URL.' });
  }

  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'That URL does not look valid.' });
  }

  try {
    const start = Date.now();
    const response = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoderAmeenAnalyzer/1.0)' },
    });
    const html = await response.text();
    const responseTimeMs = Date.now() - start;

    const pageSizeKb = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
    const isHttps = parsed.protocol === 'https:';

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const description = descMatch ? descMatch[1].trim() : null;

    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);

    const imageMatches = html.match(/<img\b/gi) || [];
    const imageCount = imageMatches.length;

    const webpMatches = html.match(/\.webp/gi) || [];
    const usesWebp = webpMatches.length > 0;

    res.status(200).json({
      url: parsed.toString(),
      responseTimeMs,
      pageSizeKb,
      isHttps,
      title,
      description,
      hasViewport,
      hasCanonical,
      imageCount,
      usesWebp,
      statusCode: response.status,
    });
  } catch (err) {
    console.error('Analyze handler error:', err);
    return res.status(502).json({ error: "Couldn't reach that website. Please check the URL and try again." });
  }
}
