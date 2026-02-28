/**
 * Footer - 页面底部组件
 * 扁平化设计，sticky 固定底部
 * 向下滚动时出现，向上滚动时渐隐
 */

'use client';

import { useState, useEffect, useRef } from 'react';

export function Footer() {
    const currentYear = new Date().getFullYear();
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const onScroll = () => {
            if (ticking.current) return;
            ticking.current = true;
            requestAnimationFrame(() => {
                const currentY = window.scrollY;
                const isNearBottom = (window.innerHeight + currentY) >= (document.body.scrollHeight - 200);

                if (isNearBottom) {
                    // 接近底部 → 始终显示
                    setVisible(true);
                } else if (currentY < lastScrollY.current) {
                    // 向上滚动 → 隐藏
                    setVisible(false);
                } else {
                    // 向下滚动 → 显示
                    setVisible(true);
                }

                lastScrollY.current = currentY;
                ticking.current = false;
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <footer
            className="sticky bottom-0 z-10 border-t border-[var(--glass-border)] bg-[var(--background-color)]/95 backdrop-blur-xl transition-all duration-500 ease-in-out"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(100%)',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            {/* 单行扁平化布局 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5">
                    {/* 左：品牌 + 描述 */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold" style={{
                            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>theone58</span>
                        <span className="text-[10px] text-[var(--text-color-secondary)] hidden sm:inline">
                            全网影视一键搜索 · 海量片源极速聚合
                        </span>
                    </div>

                    {/* 中：功能标签 */}
                    <div className="hidden md:flex items-center gap-4 text-[10px] text-[var(--text-color-secondary)]">
                        <span>🎬 电影</span>
                        <span>📺 电视剧</span>
                        <span>🔍 多源搜索</span>
                        <span>📱 多平台</span>
                    </div>

                    {/* 右：版权 */}
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-color-secondary)]">
                        <span>© {currentYear} theone58</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">Made with ❤️</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
