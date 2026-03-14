'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 旧 Referral 路由重定向到 /profile?tab=referral
 */
export default function ReferralRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/profile?tab=referral');
    }, [router]);
    return null;
}
