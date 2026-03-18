import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '隐私政策',
    description: 'iKanPP（爱看片片）隐私政策 — 了解我们如何收集、使用和保护您的个人信息。',
    alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
