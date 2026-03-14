'use client';

/**
 * Cloudflare Turnstile 人机验证组件
 * 文档：https://developers.cloudflare.com/turnstile/
 */

import { useEffect, useRef, useCallback } from 'react';

// Turnstile 类型定义
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (error: any) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  language?: string;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: any) => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

// Turnstile site key
// 本地开发使用测试密钥（始终通过），线上使用正式密钥
const isLocalDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const TURNSTILE_SITE_KEY = isLocalDev
  ? '1x00000000000000000000AA'  // Cloudflare 官方测试密钥（始终通过）
  : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA');

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (scriptLoading) return;
    scriptLoading = true;

    window.onTurnstileLoad = () => {
      scriptLoaded = true;
      scriptLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

export function Turnstile({ onVerify, onExpire, onError, theme = 'dark', className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const handleVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);

  useEffect(() => {
    let mounted = true;

    const initWidget = async () => {
      await loadTurnstileScript();
      
      if (!mounted || !containerRef.current || !window.turnstile) return;

      // 清理旧 widget
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: handleVerify,
        'expired-callback': onExpire,
        'error-callback': onError,
        theme,
        size: 'normal',
        language: 'zh-cn',
      });
    };

    initWidget();

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
    };
  }, [handleVerify, onExpire, onError, theme]);

  return <div ref={containerRef} className={className} />;
}

/**
 * 重置 Turnstile widget（提交失败后需要重新验证）
 */
export function resetTurnstile(widgetId: string) {
  if (window.turnstile) {
    window.turnstile.reset(widgetId);
  }
}
