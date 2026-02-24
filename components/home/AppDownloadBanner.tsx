'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DetectedPlatform = 'ios' | 'android' | 'macos' | null;

function detectMobilePlatform(): DetectedPlatform {
    if (typeof window === 'undefined') return null;
    const ua = navigator.userAgent.toLowerCase();
    // 已经是 PWA/standalone 模式则不显示
    if (window.matchMedia('(display-mode: standalone)').matches) return null;
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/macintosh|mac os/.test(ua)) return 'macos';
    return null;
}

const platformInfo: Record<string, { icon: string; text: string; action: string }> = {
    ios: { icon: '📱', text: 'iPhone / iPad', action: '下载 iOS 版' },
    android: { icon: '🤖', text: 'Android', action: '下载 APK' },
    macos: { icon: '💻', text: 'Mac', action: '下载桌面版' },
};

export function AppDownloadBanner() {
    const [platform, setPlatform] = useState<DetectedPlatform>(null);
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        // 检查是否已经关闭过
        const wasDismissed = sessionStorage.getItem('kvideo-download-dismissed');
        if (wasDismissed) return;

        const detected = detectMobilePlatform();
        if (detected) {
            setPlatform(detected);
            setDismissed(false);
        }
    }, []);

    if (dismissed || !platform) return null;

    const info = platformInfo[platform];

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                background: 'rgba(30, 30, 60, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                maxWidth: 'calc(100vw - 32px)',
                animation: 'slideUp 0.4s ease-out',
            }}
        >
            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

            <span style={{ fontSize: 24 }}>{info.icon}</span>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                    检测到 {info.text} 设备
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    获得更好的观影体验
                </div>
            </div>

            <Link
                href="/download"
                style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 10,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                }}
            >
                {info.action}
            </Link>

            <button
                onClick={() => {
                    setDismissed(true);
                    sessionStorage.setItem('kvideo-download-dismissed', '1');
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: '0 4px',
                    lineHeight: 1,
                }}
                aria-label="关闭"
            >
                ×
            </button>
        </div>
    );
}
