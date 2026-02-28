'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRankingData } from './hooks/useRankingData';

// 自动轮播间隔（ms）
const AUTO_PLAY_INTERVAL = 5000;

interface RankingCarouselProps {
    /** 当前内容类型，与 PopularFeatures 的三联按钮联动 */
    contentType: 'movie' | 'tv';
}

export function RankingCarousel({ contentType }: RankingCarouselProps) {
    const router = useRouter();
    const { movieRanking, tvRanking, loading } = useRankingData({ limit: 10 });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const touchStartRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentData = contentType === 'movie' ? movieRanking : tvRanking;

    // 自动播放
    const startAutoPlay = useCallback(() => {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        autoPlayRef.current = setInterval(() => {
            setIsTransitioning(true);
            setCurrentIndex(prev => (prev + 1) % (currentData.length || 1));
        }, AUTO_PLAY_INTERVAL);
    }, [currentData.length]);

    const stopAutoPlay = useCallback(() => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
            autoPlayRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (currentData.length > 0) {
            startAutoPlay();
        }
        return stopAutoPlay;
    }, [currentData.length, startAutoPlay, stopAutoPlay]);

    // 切换 tab 时重置
    useEffect(() => {
        setCurrentIndex(0);
        setIsTransitioning(false);
    }, [contentType]);

    // 过渡结束
    useEffect(() => {
        if (isTransitioning) {
            const timer = setTimeout(() => setIsTransitioning(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isTransitioning, currentIndex]);

    // 手动切换
    const goTo = (index: number) => {
        setIsTransitioning(true);
        setCurrentIndex(index);
        startAutoPlay(); // 重置计时器
    };

    const goNext = () => {
        goTo((currentIndex + 1) % currentData.length);
    };

    const goPrev = () => {
        goTo((currentIndex - 1 + currentData.length) % currentData.length);
    };

    // 触摸滑动
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
        stopAutoPlay();
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStartRef.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goNext();
            else goPrev();
        }
        startAutoPlay();
    };

    // 键盘操作（TV 遥控器）
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') { goPrev(); e.preventDefault(); }
        if (e.key === 'ArrowRight') { goNext(); e.preventDefault(); }
        if (e.key === 'Enter' && currentData[currentIndex]) {
            handleMovieClick(currentData[currentIndex]);
            e.preventDefault();
        }
    };

    const handleMovieClick = (movie: any) => {
        const params = new URLSearchParams();
        params.set('title', movie.title);
        params.set('type', contentType); // 'movie' | 'tv' — 用于消歧义
        if (movie.year) params.set('year', movie.year);
        router.push(`/player?${params.toString()}`);
    };

    if (loading) {
        return (
            <div className="mb-6">
                {/* 骨架屏 */}
                <div className="h-[200px] sm:h-[300px] lg:h-[360px] bg-[var(--glass-bg)] rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (currentData.length === 0) return null;

    const current = currentData[currentIndex];
    if (!current) return null;

    return (
        <div className="mb-3">

            {/* 幻灯片主体 */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-lg group cursor-pointer"
                style={{ isolation: 'isolate' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseEnter={stopAutoPlay}
                onMouseLeave={startAutoPlay}
                onKeyDown={handleKeyDown}
                onClick={() => handleMovieClick(current)}
                tabIndex={0}
                data-focusable
                role="region"
                aria-label="排行榜幻灯片"
                aria-roledescription="carousel"
            >
                {/* === 手机端布局：全幅海报 + 底部渐变叠加信息 === */}
                <div className="sm:hidden relative h-[360px] w-full">
                    {/* 海报作为主视觉（全尺寸） */}
                    <div className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                        <Image
                            src={current.cover}
                            alt={current.title}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                            unoptimized
                        />
                        {/* 底部强渐变（确保文字在任何海报颜色上可读） */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10" />
                        {/* 顶部微渐变 */}
                        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
                    </div>

                    {/* 底部叠加信息 */}
                    <div className={`absolute inset-x-0 bottom-0 p-4 pb-5 transition-opacity duration-500 z-10 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                        {/* 排名 + 标题 */}
                        <div className="flex items-end gap-3 mb-2">
                            <span
                                className="text-5xl font-black leading-none shrink-0"
                                style={{
                                    background: 'linear-gradient(180deg, #FFD700, #FF8C00)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 2px 6px rgba(255,215,0,0.4))',
                                }}
                            >
                                #{currentIndex + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-2xl font-bold text-white truncate drop-shadow-lg">
                                    {current.title}
                                </h2>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {current.rate && parseFloat(current.rate) > 0 && (
                                        <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                                            ★ {current.rate}
                                        </span>
                                    )}
                                    {current.types && current.types.length > 0 && (
                                        <div className="flex gap-1">
                                            {current.types.slice(0, 3).map((t, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-white/15 text-white/80 text-xs rounded">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {current.region && (
                                        <span className="text-white/50 text-xs">
                                            {Array.isArray(current.region) ? current.region.join(' / ') : current.region}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 简介（如果有） */}
                        {current.description && (
                            <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-2">
                                {current.description}
                            </p>
                        )}

                        {/* 播放按钮 */}
                        <button
                            className="w-full py-2.5 bg-[var(--accent-color)] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-[0.98] transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMovieClick(current);
                            }}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            立即播放
                        </button>
                    </div>

                    {/* 顶部排行标签 */}
                    <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white/80 text-xs rounded-full border border-white/10">
                            🔥 {contentType === 'movie' ? '电影' : '电视剧'}热门榜
                        </span>
                    </div>
                </div>

                {/* === 桌面端布局：模糊背景 + 左侧信息 + 右侧大海报 === */}
                <div className="hidden sm:block relative h-[340px] lg:h-[400px] w-full">
                    {/* 第一层：模糊放大背景 */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-600 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <Image
                            src={current.cover}
                            alt=""
                            fill
                            className="object-cover scale-125 blur-2xl brightness-[0.35] saturate-150"
                            sizes="100vw"
                            unoptimized
                            aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/40" />
                    </div>

                    {/* 第二层：左右分栏内容 */}
                    <div
                        className={`absolute inset-0 flex transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                    >
                        {/* 左侧：排名 + 信息 */}
                        <div className="flex-1 flex flex-col justify-between p-8 lg:p-10 min-w-0 z-10">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <span
                                        className="text-6xl lg:text-7xl font-black leading-none shrink-0"
                                        style={{
                                            background: 'linear-gradient(180deg, #FFD700, #FF8C00)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            filter: 'drop-shadow(0 2px 6px rgba(255,215,0,0.3))',
                                        }}
                                    >
                                        #{currentIndex + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-2xl lg:text-3xl font-bold text-white truncate drop-shadow-lg">
                                            {current.title}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {current.rate && parseFloat(current.rate) > 0 && (
                                                <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                                                    ★ {current.rate}
                                                </span>
                                            )}
                                            {current.year && (
                                                <span className="text-white/50 text-xs">{current.year}</span>
                                            )}
                                            {current.types && current.types.length > 0 && (
                                                <div className="flex gap-1">
                                                    {current.types.slice(0, 3).map((t, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-white/10 text-white/70 text-xs rounded">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {current.region && (
                                                <span className="text-white/40 text-xs">
                                                    {Array.isArray(current.region) ? current.region.join(' / ') : current.region}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 简介 */}
                                {current.description && (
                                    <p className="text-white/60 text-sm leading-relaxed line-clamp-3 max-w-lg mb-3">
                                        {current.description}
                                    </p>
                                )}

                                {/* 导演 / 主演 */}
                                {(current.directors?.length || current.actors?.length) ? (
                                    <div className="flex flex-col gap-1 text-xs text-white/50 max-w-lg">
                                        {current.directors && current.directors.length > 0 && (
                                            <p className="truncate">
                                                <span className="text-white/30">导演：</span>
                                                {current.directors.join(' / ')}
                                            </p>
                                        )}
                                        {current.actors && current.actors.length > 0 && (
                                            <p className="truncate">
                                                <span className="text-white/30">主演：</span>
                                                {current.actors.slice(0, 4).join(' / ')}
                                            </p>
                                        )}
                                    </div>
                                ) : null}

                                {/* 无简介时：迷你排行榜填充空白 */}
                                {!current.description && (!current.directors?.length && !current.actors?.length) && currentData.length > 1 && (
                                    <div className="mt-2 max-w-md">
                                        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">排行榜</p>
                                        <div className="flex flex-col gap-1.5">
                                            {currentData.slice(0, 5).map((item, idx) => (
                                                <div key={idx} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${idx === currentIndex ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                                                    <span className="w-4 text-right font-bold text-yellow-400/70">{idx + 1}</span>
                                                    <span className="truncate flex-1">{item.title}</span>
                                                    {item.rate && parseFloat(item.rate) > 0 && <span className="text-yellow-400/60 text-[10px]">★ {item.rate}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 播放按钮 */}
                            <div className="flex items-center gap-3 mt-3">
                                <button
                                    className="px-7 py-2.5 bg-[var(--accent-color)] text-white rounded-full text-base font-semibold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMovieClick(current);
                                    }}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    立即播放
                                </button>
                                <span className="text-white/30 text-xs">
                                    {contentType === 'movie' ? '电影' : '电视剧'} · 热门排行
                                </span>
                            </div>
                        </div>

                        {/* 右侧：大海报 */}
                        <div className="flex items-center justify-center pr-8 lg:pr-10 shrink-0 z-10 py-5">
                            <div className="relative h-full aspect-2/3 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15"
                                style={{ minWidth: '160px' }}
                            >
                                <Image
                                    src={current.cover}
                                    alt={current.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 200px, 250px"
                                    priority
                                    unoptimized
                                />
                                <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* 左右箭头（桌面端） */}
                    <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 cursor-pointer z-20"
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        aria-label="上一个"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 cursor-pointer z-20"
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        aria-label="下一个"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>

                {/* 底部分页点（手机端增大点击区域） */}
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 flex items-center gap-1 sm:gap-1.5">
                    {currentData.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); goTo(idx); }}
                            className={`rounded-full transition-all duration-300 cursor-pointer p-1 ${idx === currentIndex
                                ? 'w-7 h-3 sm:w-6 sm:h-2 bg-white'
                                : 'w-3 h-3 sm:w-2 sm:h-2 bg-white/40 hover:bg-white/70'
                                }`}
                            aria-label={`第 ${idx + 1} 项`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
