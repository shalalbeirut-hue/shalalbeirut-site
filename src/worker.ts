// Edge entry: canonical host redirect and noindex on preview hosts, then static assets.
interface Env { ASSETS: { fetch: (req: Request) => Promise<Response> } }

const CANONICAL_HOST = 'shalalbeirut.com';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === 'www.' + CANONICAL_HOST) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const res = await env.ASSETS.fetch(request);
    if (url.hostname === CANONICAL_HOST) return res;

    // Any other host (workers.dev previews) must never be indexed.
    const out = new Response(res.body, res);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  },
};
