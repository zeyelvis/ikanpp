import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware — SEO 统一域名
 * 将 ikanpp.com（无 www）301 重定向到 www.ikanpp.com
 * 避免搜索引擎重复收录
 */
export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const url = request.nextUrl.clone();

    // 非 www → www 301 重定向（仅在生产环境，排除 localhost）
    if (
        host === 'ikanpp.com' &&
        !host.startsWith('localhost') &&
        !host.startsWith('127.0.0.1')
    ) {
        url.host = 'www.ikanpp.com';
        return NextResponse.redirect(url, 301);
    }

    return NextResponse.next();
}

// 仅匹配页面路由，排除静态资源和 API
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|icon.png|og-image.png|manifest.json|robots.txt|sitemap.xml|api/).*)',
    ],
};
