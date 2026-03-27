'use client';

import { useEffect, useRef } from 'react';

interface UseEpisodePrefetchProps {
    /** 下一集的播放 URL（m3u8），为空则不预加载 */
    nextEpisodeUrl: string | null;
    /** 是否处于 outro 区域（即将结束） */
    isOutroActive: boolean;
    /** 是否正在播放 */
    isPlaying: boolean;
}

/**
 * 下一集预加载 Hook
 * 
 * 当视频进入 outro 区域时，提前预热下一集的 HLS manifest：
 * 1. 预加载 manifest（DNS + TCP + TLS + manifest 下载）
 * 2. 通过 <link rel="prefetch"> 预热首个分片
 * 
 * 这样正式切换时，HLS 已有缓存，首帧延迟大幅降低。
 */
export function useEpisodePrefetch({
    nextEpisodeUrl,
    isOutroActive,
    isPlaying,
}: UseEpisodePrefetchProps) {
    const prefetchedUrlRef = useRef<string | null>(null);
    const linkElementRef = useRef<HTMLLinkElement | null>(null);

    useEffect(() => {
        // 触发条件：正在播放 + 进入 outro + 有下一集 URL
        if (!isOutroActive || !isPlaying || !nextEpisodeUrl) return;
        // 避免重复预加载同一 URL
        if (prefetchedUrlRef.current === nextEpisodeUrl) return;

        prefetchedUrlRef.current = nextEpisodeUrl;
        console.log('[Prefetch] 预加载下一集 manifest:', nextEpisodeUrl);

        // 1. fetch manifest（放入浏览器 HTTP 缓存 / SW 缓存）
        fetch(nextEpisodeUrl, { 
            mode: 'cors',
            credentials: 'omit',
            // @ts-ignore
            priority: 'low',
        }).then(async (res) => {
            if (!res.ok) return;
            const text = await res.text();

            // 2. 解析 manifest，找到第一个 ts 分片做 prefetch
            const lines = text.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    // 这是第一个分片 URL
                    let segmentUrl = trimmed;
                    if (!segmentUrl.startsWith('http')) {
                        // 相对路径转绝对路径
                        const base = nextEpisodeUrl.substring(0, nextEpisodeUrl.lastIndexOf('/') + 1);
                        segmentUrl = base + segmentUrl;
                    }

                    // 通过 <link rel="prefetch"> 预加载首个分片
                    if (typeof document !== 'undefined') {
                        // 清理旧的 prefetch link
                        if (linkElementRef.current) {
                            linkElementRef.current.remove();
                        }
                        const link = document.createElement('link');
                        link.rel = 'prefetch';
                        link.href = segmentUrl;
                        link.as = 'fetch';
                        document.head.appendChild(link);
                        linkElementRef.current = link;
                        console.log('[Prefetch] 预加载首个分片:', segmentUrl);
                    }
                    break;
                }
            }
        }).catch(() => {
            // 预加载失败不影响主流程，静默忽略
        });

        return () => {
            // 清理 prefetch link
            if (linkElementRef.current) {
                linkElementRef.current.remove();
                linkElementRef.current = null;
            }
        };
    }, [isOutroActive, isPlaying, nextEpisodeUrl]);

    // src 变更时重置
    useEffect(() => {
        prefetchedUrlRef.current = null;
        if (linkElementRef.current) {
            linkElementRef.current.remove();
            linkElementRef.current = null;
        }
    }, [nextEpisodeUrl]);
}
