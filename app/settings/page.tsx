'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 旧 Settings 路由重定向到 /profile
 */
export default function SettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/profile?tab=player');
  }, [router]);
  return null;
}
