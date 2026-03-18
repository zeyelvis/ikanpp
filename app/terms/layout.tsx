import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '用户协议',
    description: 'iKanPP（爱看片片）用户服务协议 — 使用本站服务前请仔细阅读。',
    alternates: { canonical: '/terms' },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
