// Edge entry: canonical host, the operations API, app shells, then static assets.
import { api } from './system/api';
import type { Env } from './system/lib';
import { runDaily } from './system/cron';

const CANONICAL_HOST = 'shalalbeirut.com';

// Client-side apps: any path under these prefixes serves the app's shell page.
const SHELLS = ['/app/', '/my/', '/i/', '/r/'];

// Paths that only existed on the site previously hosted on this domain.
const GONE = ['/blog'];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === 'www.' + CANONICAL_HOST) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    // Pages from the domain's previous owner (not ours): tell search engines they are gone for good.
    if (GONE.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))) {
      return new Response(
        '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="robots" content="noindex"><title>الصفحة مو موجودة</title>' +
          '<body style="font-family:Tahoma,sans-serif;text-align:center;padding:60px 16px">الصفحة هذي مو موجودة. <a href="/">روح للصفحة الرئيسية</a></body></html>',
        { status: 410, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } },
      );
    }

    let res: Response;
    if (url.pathname.startsWith('/api/')) {
      res = await api.fetch(request, env, ctx);
    } else {
      const shell = SHELLS.find((p) => url.pathname.startsWith(p) || url.pathname + '/' === p);
      const isFile = /\.[a-z0-9]+$/i.test(url.pathname);
      if (shell && !isFile && url.pathname !== shell) {
        res = await env.ASSETS.fetch(new Request(new URL(shell, url), request));
      } else {
        res = await env.ASSETS.fetch(request);
      }
      if (shell) {
        res = new Response(res.body, res);
        res.headers.set('X-Robots-Tag', 'noindex, nofollow');
        res.headers.set('Cache-Control', 'no-store');
        return res;
      }
    }

    if (url.hostname === CANONICAL_HOST) return res;
    // Any other host (workers.dev previews, local dev) must never be indexed.
    const out = new Response(res.body, res);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  },

  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await runDaily(env);
  },
};
