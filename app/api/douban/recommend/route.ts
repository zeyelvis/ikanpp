import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag') || '热门';
  const type = searchParams.get('type') || 'movie';

  // MED-3 修复：参数类型和范围验证
  if (!['movie', 'tv'].includes(type)) {
    return NextResponse.json({ subjects: [], error: 'Invalid type' }, { status: 400 });
  }
  const pageLimit = Math.min(Math.max(parseInt(searchParams.get('page_limit') || '20', 10) || 20, 1), 50);
  const pageStart = Math.max(parseInt(searchParams.get('page_start') || '0', 10) || 0, 0);

  try {
    const url = `https://movie.douban.com/j/search_subjects?type=${type}&tag=${encodeURIComponent(tag)}&sort=recommend&page_limit=${pageLimit}&page_start=${pageStart}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://movie.douban.com/',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Douban API returned ${response.status}`);
    }

    const data = await response.json();

    // 转换图片链接使用代理
    if (data.subjects && Array.isArray(data.subjects)) {
      data.subjects = data.subjects.map((item: any) => ({
        ...item,
        cover: item.cover ? `/api/douban/image?url=${encodeURIComponent(item.cover)}` : item.cover,
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Douban API error:', error);
    return NextResponse.json(
      { subjects: [], error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
