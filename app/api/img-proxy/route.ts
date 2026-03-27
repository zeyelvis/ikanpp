import { NextRequest, NextResponse } from 'next/server';
import { isSafeExternalUrl } from '@/lib/utils/security';

export const runtime = 'edge';

/**
 * 图片代理 API
 * 
 * 功能：
 * 1. 代理外部图片（解决豆瓣等 CDN 的防盗链 referer 限制）
 * 2. 设置长效缓存头（7 天），配合 Service Worker 做客户端缓存
 * 3. 保持 Edge Runtime 兼容（不依赖 sharp）
 * 
 * 用法：/api/img-proxy?url=https://img.douban.com/xxx.jpg
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // SSRF 防护
    if (!isSafeExternalUrl(url)) {
        return new NextResponse('URL not allowed', { status: 403 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                // 不发送 referer，绕过防盗链
                'Referer': '',
                'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
            },
            // @ts-ignore - Edge Runtime 不一定支持此选项，但部分环境有效
            referrerPolicy: 'no-referrer',
        });

        if (!response.ok) {
            return new NextResponse(`Upstream error: ${response.status}`, {
                status: response.status,
                headers: { 'Access-Control-Allow-Origin': '*' },
            });
        }

        const contentType = response.headers.get('Content-Type') || 'image/jpeg';

        // 只代理图片类型
        if (!contentType.startsWith('image/')) {
            return new NextResponse('Not an image', {
                status: 415,
                headers: { 'Access-Control-Allow-Origin': '*' },
            });
        }

        const imageData = await response.arrayBuffer();

        return new NextResponse(imageData, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                // 7 天强缓存 + CDN 缓存
                'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
                // 避免浏览器 CORS 污染
                'Vary': 'Origin',
            },
        });
    } catch (error) {
        console.error('[img-proxy] Error:', error);
        return new NextResponse('Image proxy failed', {
            status: 502,
            headers: { 'Access-Control-Allow-Origin': '*' },
        });
    }
}
