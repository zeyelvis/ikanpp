'use client';

import { useEffect, useRef } from 'react';
import type Hls from 'hls.js';

interface UseStallDetectionProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    hlsRef: React.MutableRefObject<Hls | null>;
    isPlaying: boolean;
    isDraggingProgressRef: React.MutableRefObject<boolean>;
    setIsLoading: (loading: boolean) => void;
    isTransitioningToNextEpisode: boolean;
}

/**
 * 卡顿检测 + 自动恢复
 * 
 * 检测阈值：200ms（显示 loading）
 * 恢复梯度：
 *   - 3s：小幅前进 0.1s 尝试跳过 buffer 空洞
 *   - 8s：调用 hls.startLoad() 重新加载分片
 *   - 15s：调用 hls.recoverMediaError() 最终恢复
 */
export function useStallDetection({
    videoRef,
    hlsRef,
    isPlaying,
    isDraggingProgressRef,
    setIsLoading,
    isTransitioningToNextEpisode
}: UseStallDetectionProps) {
    const lastTimeRef = useRef<number>(0);
    const lastUpdateTimeRef = useRef<number>(Date.now());
    const isStalledByMeRef = useRef<boolean>(false);
    // 记录恢复尝试，避免重复执行
    const recoveryAttemptRef = useRef<number>(0);

    useEffect(() => {
        if (!videoRef.current) return;

        const checkStall = () => {
            if (!videoRef.current) return;

            const isVideoPaused = videoRef.current.paused;
            const currentTime = videoRef.current.currentTime;
            const now = Date.now();

            if (isPlaying && !isVideoPaused && !isDraggingProgressRef.current && !isTransitioningToNextEpisode) {
                if (currentTime !== lastTimeRef.current) {
                    // 时间在前进 — 播放正常
                    if (isStalledByMeRef.current) {
                        setIsLoading(false);
                        isStalledByMeRef.current = false;
                        recoveryAttemptRef.current = 0;
                    }
                    lastTimeRef.current = currentTime;
                    lastUpdateTimeRef.current = now;
                } else {
                    // 时间没动 — 可能卡顿
                    const stallDuration = now - lastUpdateTimeRef.current;

                    if (stallDuration > 200) {
                        setIsLoading(true);
                        isStalledByMeRef.current = true;
                    }

                    // === 梯度恢复机制 ===
                    const video = videoRef.current;
                    const hls = hlsRef.current;

                    // 第一级（3s）：小幅前进跳过 buffer 空洞
                    if (stallDuration > 3000 && recoveryAttemptRef.current === 0) {
                        recoveryAttemptRef.current = 1;
                        console.warn('[StallDetection] 卡顿 3s，尝试小幅前进 0.1s');
                        video.currentTime = currentTime + 0.1;
                    }

                    // 第二级（8s）：强制 HLS 重新加载分片
                    if (stallDuration > 8000 && recoveryAttemptRef.current === 1) {
                        recoveryAttemptRef.current = 2;
                        console.warn('[StallDetection] 卡顿 8s，强制 HLS startLoad');
                        if (hls) {
                            hls.startLoad(currentTime);
                        } else {
                            // 原生 HLS（Safari） — 用 currentTime 触发重新缓冲
                            video.currentTime = currentTime + 0.5;
                        }
                    }

                    // 第三级（15s）：recoverMediaError 最终恢复
                    if (stallDuration > 15000 && recoveryAttemptRef.current === 2) {
                        recoveryAttemptRef.current = 3;
                        console.warn('[StallDetection] 卡顿 15s，执行 recoverMediaError');
                        if (hls) {
                            hls.recoverMediaError();
                        } else {
                            // 原生 HLS 最终手段：重新加载视频源
                            const currentSrc = video.src;
                            const savedTime = currentTime;
                            video.src = '';
                            video.src = currentSrc;
                            video.currentTime = savedTime;
                            video.play().catch(() => {});
                        }
                    }
                }
            } else {
                // 暂停、拖拽或换集 — 重置所有追踪
                lastTimeRef.current = currentTime;
                lastUpdateTimeRef.current = now;
                recoveryAttemptRef.current = 0;
                if (isStalledByMeRef.current) {
                    setIsLoading(false);
                    isStalledByMeRef.current = false;
                }
            }
        };

        const interval = setInterval(checkStall, 100);
        return () => {
            clearInterval(interval);
            if (isStalledByMeRef.current) {
                setIsLoading(false);
                isStalledByMeRef.current = false;
            }
        };
    }, [isPlaying, videoRef, hlsRef, isDraggingProgressRef, setIsLoading, isTransitioningToNextEpisode]);
}
