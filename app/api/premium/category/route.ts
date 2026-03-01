import { NextResponse } from 'next/server';

export const runtime = 'edge';
// We still import this type but won't rely on the empty array
import { PREMIUM_SOURCES } from '@/lib/api/premium-sources';

/**
 * 构建正确的采集站 API URL
 * baseUrl 可能只是域名（如 https://hsckzy888.com），
 * 需要拼接 searchPath（如 /api.php/provide/vod）才能形成完整的 API 端点
 */
function buildSourceUrl(source: any): URL {
    const base = source.baseUrl.replace(/\/$/, '');
    const path = source.searchPath || source.detailPath || '';
    return new URL(base + path);
}

async function handleCategoryRequest(
    sourceList: any[],
    categoryParam: string,
    page: number,
    limit: number
) {
    try {
        const enabledSources = sourceList.filter(s => s.enabled !== false);

        if (enabledSources.length === 0) {
            return NextResponse.json({ videos: [], error: 'No enabled sources provided or found' }, { status: 500 });
        }

        // 判断是分类模式还是关键词搜索模式
        // 分类模式：categoryParam 包含 ":" (如 "source1:3,source2:5")
        // 关键词搜索模式：categoryParam 是纯文本（如 "伦理"）
        const isKeywordSearch = categoryParam && !categoryParam.includes(':');

        if (isKeywordSearch) {
            // 关键词搜索模式 — 向所有启用的源搜索
            const fetchPromises = enabledSources.map(async (source: any) => {
                try {
                    const url = buildSourceUrl(source);
                    url.searchParams.set('ac', 'detail');
                    url.searchParams.set('wd', categoryParam);
                    url.searchParams.set('pg', page.toString());

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);

                    const response = await fetch(url.toString(), {
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                        },
                        next: { revalidate: 1800 },
                    });

                    clearTimeout(timeoutId);
                    if (!response.ok) return [];

                    const data = await response.json();
                    return (data.list || []).map((item: any) => ({
                        vod_id: item.vod_id,
                        vod_name: item.vod_name,
                        vod_pic: item.vod_pic,
                        vod_remarks: item.vod_remarks,
                        type_name: item.type_name,
                        source: source.id,
                    }));
                } catch (error) {
                    console.error(`Failed to search from ${source.name}:`, error);
                    return [];
                }
            });

            const results = await Promise.all(fetchPromises);

            // 交错合并结果
            const interleavedVideos: any[] = [];
            const maxLen = Math.max(...results.map(r => r.length), 0);
            for (let i = 0; i < maxLen; i++) {
                for (let j = 0; j < results.length; j++) {
                    if (results[j][i]) {
                        interleavedVideos.push(results[j][i]);
                    }
                }
            }

            return NextResponse.json({ videos: interleavedVideos });
        }

        // 分类模式 — 原有逻辑
        const sourceMap = new Map<string, string>(); // sourceId -> typeId

        if (categoryParam) {
            const parts = categoryParam.split(',');
            parts.forEach(part => {
                if (part.includes(':')) {
                    const [sId, tId] = part.split(':');
                    sourceMap.set(sId, tId);
                }
            });
        }

        let targetSources = [];
        if (sourceMap.size > 0) {
            targetSources = enabledSources.filter(s => sourceMap.has(s.id));
        } else {
            targetSources = enabledSources;
        }

        if (targetSources.length === 0) {
            return NextResponse.json({ videos: [], error: 'No matching sources found' }, { status: 500 });
        }

        const fetchPromises = targetSources.map(async (source: any) => {
            try {
                const url = buildSourceUrl(source);
                url.searchParams.set('ac', 'detail');
                url.searchParams.set('pg', page.toString());

                if (sourceMap.has(source.id)) {
                    url.searchParams.set('t', sourceMap.get(source.id)!);
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const response = await fetch(url.toString(), {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    },
                    next: { revalidate: 1800 },
                });

                clearTimeout(timeoutId);

                if (!response.ok) return [];

                const data = await response.json();
                return (data.list || []).map((item: any) => ({
                    vod_id: item.vod_id,
                    vod_name: item.vod_name,
                    vod_pic: item.vod_pic,
                    vod_remarks: item.vod_remarks,
                    type_name: item.type_name,
                    source: source.id,
                }));
            } catch (error) {
                console.error(`Failed to fetch from ${source.name}:`, error);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);

        const interleavedVideos: any[] = [];
        const maxLen = Math.max(...results.map(r => r.length), 0);

        for (let i = 0; i < maxLen; i++) {
            for (let j = 0; j < results.length; j++) {
                if (results[j][i]) {
                    interleavedVideos.push(results[j][i]);
                }
            }
        }

        return NextResponse.json({ videos: interleavedVideos });

    } catch (error) {
        console.error('Category content error:', error);
        return NextResponse.json(
            { videos: [], error: 'Failed to fetch category content' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sources, category, page, limit } = body;

        // Use provided sources
        return await handleCategoryRequest(
            sources || [],
            category || '',
            parseInt(page || '1'),
            parseInt(limit || '20')
        );
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET(request: Request) {
    // Legacy GET support - currently BROKEN since ADULT_SOURCES is empty
    // But kept for structure. It will likely return 500 "No enabled sources"
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    return await handleCategoryRequest(PREMIUM_SOURCES, categoryParam, page, limit);
}
