const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

interface Env {
  ASSETS: Fetcher;
  API_BASE_URL?: string;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (!env.API_BASE_URL) {
        return new Response(
          JSON.stringify({
            error:
              "API_BASE_URL is not configured on addreams-web. Set it in Worker vars to enable /api proxying.",
          }),
          { status: 500, headers: JSON_HEADERS },
        );
      }

      const upstreamUrl = new URL(`${url.pathname}${url.search}`, env.API_BASE_URL);
      const upstreamRequest = new Request(upstreamUrl, request);
      return fetch(upstreamRequest);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
