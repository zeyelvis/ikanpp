import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'IPTV 直播 — 电视频道在线收看',
    description: 'iKanPP IPTV 直播功能，支持导入 M3U 源，在线收看央视、卫视、港澳台、海外电视频道。自定义直播源管理，高清流畅。',
    keywords: ['IPTV直播', '电视直播', 'M3U直播源', '在线电视', '央视直播', '卫视直播'],
    alternates: { canonical: '/iptv' },
    openGraph: {
        title: 'iKanPP IPTV 直播 — 电视频道在线看',
        description: '支持 M3U 源管理，央视卫视港澳台海外频道在线观看',
    },
};

export default function IPTVLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
