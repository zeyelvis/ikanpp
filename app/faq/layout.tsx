import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '常见问题 — iKanPP',
    description: '关于 iKanPP（爱看片片）的常见问题解答：海外华人如何免费看国产剧、支持哪些地区、是否需要注册等。',
    keywords: '爱看片片常见问题,海外看剧FAQ,iKanPP帮助,免费看剧',
    alternates: { canonical: '/faq' },
    openGraph: {
        title: '常见问题 — iKanPP',
        description: '关于 iKanPP（爱看片片）的常见问题解答',
        type: 'website',
    },
};

export default function FAQLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
