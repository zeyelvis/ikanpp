'use client';

/**
 * ReferralCapture — 全局邀请码捕获组件
 * 挂载在根 layout 中，自动读取 URL `?ref=xxx` 参数并存入 localStorage
 * AuthModal 注册时会读取此值作为邀请码
 */
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const REFERRAL_STORAGE_KEY = 'kvideo-referral-code';

export function ReferralCapture() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref && ref.length >= 4) {
            // 存入 localStorage，注册时 AuthModal 会读取
            localStorage.setItem(REFERRAL_STORAGE_KEY, ref.toUpperCase());
        }
    }, [searchParams]);

    return null; // 不渲染任何 UI
}

/**
 * 获取存储的邀请码（供 AuthModal 使用）
 */
export function getStoredReferralCode(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
}

/**
 * 清除存储的邀请码（注册成功后调用）
 */
export function clearStoredReferralCode(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
}
