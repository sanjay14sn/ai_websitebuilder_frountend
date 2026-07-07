export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;

    let subdomain = '';
    const parts = host.split('.');

    const defaultDomain = env.DEFAULT_DOMAIN || 'gripforumglobal.com';

    if (host === 'localhost' || host === '127.0.0.1') {
      subdomain = url.searchParams.get('subdomain') || '';
    } else if (parts.length > 2) {
      if (parts[0] !== 'www') {
        subdomain = parts[0];
      } else if (parts.length > 3) {
        subdomain = parts[1];
      }
    } else if (parts.length === 2 && host !== defaultDomain) {
      subdomain = parts[0];
    }

    // api.gripforumglobal.com → website builder REST API (proxy to origin server)
    if (subdomain === 'api') {
      return proxyApiRequest(request, env);
    }

    // Path-based URL resolution fallback (e.g. /companyname/chaptername/zonename)
    if (!subdomain || subdomain === 'www') {
      const pathSegments = url.pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 1) {
        const company = pathSegments[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
        const chapter = pathSegments[1] ? pathSegments[1].toLowerCase().replace(/[^a-z0-9]+/g, '') : '';
        const zone = pathSegments[2] ? pathSegments[2].toLowerCase().replace(/[^a-z0-9]+/g, '') : '';
        
        let pathSubdomain = company;
        if (chapter) pathSubdomain += `-${chapter}`;
        if (zone) pathSubdomain += `-${zone}`;
        
        if (pathSubdomain) {
          subdomain = pathSubdomain;
        }
      }
    }

    if (!subdomain) {
      return new Response(renderMainGatewayHTML(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    try {
      // Fetch compiled HTML from KV using the key sites:subdomain
      let html = null;
      if (typeof env.WEBSITE_STORE !== 'undefined') {
        html = await env.WEBSITE_STORE.get(`sites:${subdomain}`);
      }

      if (!html) {
        return new Response(render404HTML(subdomain), {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // Log page view analytics (non-blocking)
      ctx.waitUntil(
        logPageView(subdomain, env.BACKEND_API_URL)
      );

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });

    } catch (err) {
      return new Response(`Error rendering site: ${err.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
};

const API_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function proxyApiRequest(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: API_CORS_HEADERS });
  }

  const origin = (env.API_ORIGIN || env.BACKEND_API_URL || '').replace(/\/$/, '');
  if (!origin) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'API origin is not configured. Set API_ORIGIN in the Cloudflare worker.',
      }),
      { status: 503, headers: { ...API_CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const target = new URL(`${url.pathname}${url.search}`, origin);

  const headers = new Headers(request.headers);
  headers.delete('host');

  const proxyRequest = new Request(target.toString(), {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'follow',
  });

  try {
    const response = await fetch(proxyRequest);
    const responseHeaders = new Headers(response.headers);
    Object.entries(API_CORS_HEADERS).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: `API proxy error: ${err.message}` }),
      { status: 502, headers: { ...API_CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

async function logPageView(slug, apiUrl) {
  if (!apiUrl) return;
  try {
    await fetch(`${apiUrl}/api/analytics/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug,
        eventType: 'view',
        details: { referrer: 'cloudflare-worker' },
      }),
    });
  } catch (err) {
    console.error('Failed to log page view analytics:', err.message);
  }
}

function renderMainGatewayHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to the Website Platform</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 flex items-center justify-center min-h-screen">
      <div class="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center">
        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
        </div>
        <h1 class="text-3xl font-extrabold text-gray-900 mb-2">Website Engine</h1>
        <p class="text-gray-500 mb-6">This server hosts published business subdomains dynamically. Navigate to a valid subdomain to view the website.</p>
      </div>
    </body>
    </html>
  `;
}

function render404HTML(subdomain) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Not Found - 404</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 flex items-center justify-center min-h-screen">
      <div class="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center">
        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">404 - Website Not Found</h1>
        <p class="text-gray-500 mb-6">The website for domain <strong class="text-gray-800 font-semibold">"${subdomain}"</strong> has not been registered or published yet.</p>
      </div>
    </body>
    </html>
  `;
}
