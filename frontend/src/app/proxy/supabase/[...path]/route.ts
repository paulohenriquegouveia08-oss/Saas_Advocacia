import { NextRequest, NextResponse } from 'next/server';

const TARGET_BASE_URL = 'http://137.131.233.254:8010';

async function handleProxy(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const targetPath = url.pathname.replace(/^\/proxy\/supabase/, '') + url.search;
    const targetUrl = `${TARGET_BASE_URL}${targetPath}`;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Ignorar o host original para que o fetch monte o correto
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    const options: RequestInit = {
      method: req.method,
      headers,
      cache: 'no-store'
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const buffer = await req.arrayBuffer();
      if (buffer.byteLength > 0) {
        options.body = buffer;
      }
    }

    const res = await fetch(targetUrl, options);

    const resHeaders = new Headers();
    res.headers.forEach((value, key) => {
      resHeaders.set(key, value);
    });

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error('[Supabase Proxy Error]', error);
    return NextResponse.json({ error: 'Proxy Request Failed', details: error.message }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
