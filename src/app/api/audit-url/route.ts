import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');

  if (!target) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    const targetObj = new URL(target);
    let fetchUrl = target;

    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (compatible; OptimarkSeoAuditBot/1.0; +https://optimark.ai)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Host': targetObj.host,
      'x-forwarded-host': targetObj.host,
      'x-forwarded-proto': 'https',
    };

    // Anti Hairpin NAT: If calling internal landing page container
    if (
      targetObj.hostname === 'optimark-staging-landing.dritech.co.id' ||
      targetObj.hostname.includes('landing')
    ) {
      fetchUrl = `http://landing-page:3000${targetObj.pathname}${targetObj.search}`;
    }

    const startTime = performance.now();
    const res = await fetch(fetchUrl, {
      headers: reqHeaders,
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    const html = await res.text();

    return NextResponse.json({
      url: target,
      statusCode: res.status,
      responseTimeMs,
      html,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch target URL' },
      { status: 500 }
    );
  }
}
