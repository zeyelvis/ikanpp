import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'App 下载 — iKanPP 全平台客户端',
    description: 'iKanPP（爱看片片）客户端下载，支持 iOS、Android、macOS、TV 全平台。影视聚合搜索引擎，电影电视剧综艺动漫一站式搜索播放。',
    keywords: ['iKanPP下载', '爱看片片App', '影视搜索App', '电影App下载', '影视聚合App'],
    alternates: { canonical: '/download' },
    openGraph: {
        title: 'iKanPP App 下载 — 全平台客户端',
        description: '支持 iOS、Android、macOS、TV 全平台客户端下载，影视聚合搜索引擎',
    },
};

export default function DownloadLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
