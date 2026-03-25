import { NextResponse } from 'next/server';
import { isAllowedDoubanImageUrl } from '@/lib/utils/security';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    // SSRF 防护：仅允许豆瓣图片域名
    if (!isAllowedDoubanImageUrl(imageUrl)) {
        return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
    }

    // ── Cloudflare Cache API ──────────────────────────
    // 用原始请求 URL 作为缓存键，same URL = same cache entry
    const cacheKey = new Request(request.url, { method: 'GET' });

    // 尝试从 Cloudflare 边缘缓存读取
    // @ts-ignore — caches.default 是 Cloudflare Workers 专有 API
    const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;

    if (cache) {
        try {
            const cached = await cache.match(cacheKey);
            if (cached) return cached;
        } catch {
            // 缓存读取失败，继续请求源站
        }
    }

    // ── 从豆瓣图床拉取图片 ────────────────────────────
    try {
        // 超时 8 秒
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const imageResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                Accept: 'image/jpeg,image/png,image/gif,*/*;q=0.8',
                Referer: 'https://movie.douban.com/',
            },
            signal: controller.signal,
        });

        clearTimeout(timer);

        if (!imageResponse.ok) {
            return NextResponse.json(
                { error: imageResponse.statusText },
                { status: imageResponse.status }
            );
        }

        const contentType = imageResponse.headers.get('content-type');

        if (!imageResponse.body) {
            return NextResponse.json(
                { error: 'Image response has no body' },
                { status: 500 }
            );
        }

        // 构建响应（需要 clone body 才能同时写缓存和返回）
        const body = await imageResponse.arrayBuffer();

        const headers = new Headers();
        if (contentType) headers.set('Content-Type', contentType);
        // 浏览器 + CDN 缓存 6 个月
        headers.set('Cache-Control', 'public, max-age=15720000, s-maxage=15720000');

        const response = new Response(body, { status: 200, headers });

        // 异步写入 Cloudflare 边缘缓存（不阻塞响应）
        if (cache) {
            try {
                // waitUntil 在 next.js edge 中不可用，用 cache.put 直接写
                // cache.put 是异步但不需要 await 阻塞响应
                const cacheResponse = new Response(body, { status: 200, headers });
                cache.put(cacheKey, cacheResponse).catch(() => {});
            } catch {
                // 缓存写入失败不影响正常响应
            }
        }

        return response;
    } catch (error: any) {
        // 超时或网络错误
        const isTimeout = error?.name === 'AbortError';
        return NextResponse.json(
            { error: isTimeout ? 'Image fetch timeout' : 'Error fetching image' },
            { status: isTimeout ? 504 : 500 }
        );
    }
}
