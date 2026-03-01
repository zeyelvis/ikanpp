'use client';

/**
 * SplashScreen - 手机端 5 秒开屏动画
 * 电影级视觉效果：光束、镜头光晕、胶片颗粒、动态粒子
 * 仅在移动端（<768px）首次访问时显示
 */

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const SPLASH_KEY = 'kvideo_splash_shown';

export function SplashScreen() {
    const [visible, setVisible] = useState(true);
    const [exiting, setExiting] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    const dismiss = useCallback(() => {
        setExiting(true);
        document.body.style.overflow = '';
        setTimeout(() => setVisible(false), 800);
    }, []);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const hasShown = sessionStorage.getItem(SPLASH_KEY);

        if (!isMobile || hasShown) {
            setVisible(false);
            return;
        }

        setShouldRender(true);
        sessionStorage.setItem(SPLASH_KEY, '1');
        document.body.style.overflow = 'hidden';

        const timer = setTimeout(dismiss, 5000);
        return () => {
            clearTimeout(timer);
            document.body.style.overflow = '';
        };
    }, [dismiss]);

    if (!visible || !shouldRender) return null;

    return (
        <div
            className={`splash-screen ${exiting ? 'splash-exit' : ''}`}
            aria-hidden="true"
            onClick={dismiss}
        >
            {/* 胶片颗粒噪点层 */}
            <div className="splash-grain" />

            {/* 电影光束 */}
            <div className="splash-beam splash-beam-1" />
            <div className="splash-beam splash-beam-2" />
            <div className="splash-beam splash-beam-3" />

            {/* 环形光晕（模拟镜头效果） */}
            <div className="splash-lens-flare" />
            <div className="splash-lens-ring splash-ring-1" />
            <div className="splash-lens-ring splash-ring-2" />

            {/* 流动光粒子 */}
            <div className="splash-particles">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="splash-particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                            width: `${2 + Math.random() * 4}px`,
                            height: `${2 + Math.random() * 4}px`,
                        }}
                    />
                ))}
            </div>

            {/* 水平光线扫描 */}
            <div className="splash-scanline" />

            {/* Logo */}
            <div className="splash-logo-container">
                <div className="splash-logo-aura" />
                <Image
                    src="/icon.png"
                    alt="theone58"
                    width={100}
                    height={100}
                    className="splash-logo"
                    priority
                />
            </div>

            {/* 品牌名 — 大号渐变文字 */}
            <h1 className="splash-brand">
                <span className="splash-brand-the">the</span>
                <span className="splash-brand-one">one</span>
                <span className="splash-brand-num">58</span>
                <span className="splash-brand-dot">.com</span>
            </h1>

            {/* 标语 */}
            <p className="splash-tagline">
                <span className="splash-tag-item">全网 VIP</span>
                <span className="splash-tag-sep">·</span>
                <span className="splash-tag-item">免费畅看</span>
                <span className="splash-tag-sep">·</span>
                <span className="splash-tag-item">极速搜播</span>
            </p>

            {/* 底部进度条 */}
            <div className="splash-progress">
                <div className="splash-progress-bar" />
                <div className="splash-progress-glow" />
            </div>

            {/* 跳过按钮 */}
            <button
                className="splash-skip"
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
            >
                跳过
            </button>
        </div>
    );
}
