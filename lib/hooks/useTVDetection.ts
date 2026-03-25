/**
 * useTVDetection
 * 检测用户是否在电视/机顶盒浏览器上。
 * 支持 localStorage 手动覆盖。
 */

import { useState, useEffect } from 'react';

// 电视浏览器 UA 关键词
const TV_USER_AGENT_PATTERNS = [
  /smarttv/i,
  /tizen/i,
  /webos/i,
  /firetv/i,
  /android tv/i,
  /googletv/i,
  /crkey/i,       // Chromecast
  /aftt/i,        // Amazon Fire TV Stick
  /aftm/i,        // Amazon Fire TV
  /bravia/i,      // Sony Bravia
  /netcast/i,     // LG NetCast
  /viera/i,       // Panasonic Viera
  /hbbtv/i,
  /vidaa/i,       // 海信 VIDAA
  /whale/i,       // 三星 Whale
  /mibox/i,       // 小米盒子
  /roku/i,        // Roku
  /silk/i,        // Amazon Silk (Fire TV / tablets)
  /philipstv/i,   // Philips 飞利浦
  /sharp/i,       // Sharp TV
  /\\btv\\b/i,    // 通用 "TV" 关键词（需要词边界避免误匹配 captive 等词）
];

const STORAGE_KEY = 'kvideo-tv-mode';

export function useTVDetection(): boolean {
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    // 1. 手动覆盖优先（用户在设置中切换）
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'on') {
      setIsTV(true);
      return;
    }
    if (stored === 'off') {
      setIsTV(false);
      return;
    }

    // 2. UA 匹配
    const ua = navigator.userAgent;
    const uaMatch = TV_USER_AGENT_PATTERNS.some(pattern => pattern.test(ua));

    if (uaMatch) {
      setIsTV(true);
      return;
    }

    // 3. 启发式：大屏 + 无触摸 = 很可能是 TV
    //    放宽条件：不再要求低 DPI（很多现代 TV 也有高分屏）
    const isLargeScreen = window.innerWidth >= 1200;
    const hasNoTouch = !('ontouchstart' in window) && navigator.maxTouchPoints === 0;

    if (isLargeScreen && hasNoTouch) {
      setIsTV(true);
      return;
    }

    setIsTV(false);
  }, []);

  return isTV;
}

/**
 * 手动设置 TV 模式（设置页面调用）
 * @param mode 'on' = 强制启用, 'off' = 强制关闭, 'auto' = 自动检测
 */
export function setTVMode(mode: 'on' | 'off' | 'auto') {
  if (mode === 'auto') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, mode);
  }
  // 刷新页面让检测生效
  window.location.reload();
}
