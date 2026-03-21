/**
 * 热搜关键词 Store
 * 从首页排行榜数据中提取热门电影/电视剧标题，缓存到 localStorage
 * 每次首页加载时自动刷新
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrendingKeyword {
    title: string;
    type: 'movie' | 'tv';
    rate?: string;
}

interface TrendingStore {
    keywords: TrendingKeyword[];
    lastUpdated: number;
    /** 从排行榜数据更新热搜词 — 电影 Top5 + 电视剧 Top5 */
    updateFromRanking: (
        movieRanking: Array<{ title: string; rate?: string }>,
        tvRanking: Array<{ title: string; rate?: string }>
    ) => void;
    /** 获取热搜词列表 */
    getKeywords: (limit?: number) => TrendingKeyword[];
}

export const useTrendingStore = create<TrendingStore>()(
    persist(
        (set, get) => ({
            keywords: [],
            lastUpdated: 0,

            updateFromRanking: (movieRanking, tvRanking) => {
                const prev = get().keywords;
                // 保留已有数据：如果传入空数组，则保留上次的
                const existingMovies = prev.filter(k => k.type === 'movie');
                const existingTv = prev.filter(k => k.type === 'tv');

                const movieTop = (movieRanking.length > 0 ? movieRanking : existingMovies)
                    .slice(0, 5)
                    .map(m => ({ title: m.title, type: 'movie' as const, rate: ('rate' in m ? m.rate : undefined) }));
                const tvTop = (tvRanking.length > 0 ? tvRanking : existingTv)
                    .slice(0, 5)
                    .map(m => ({ title: m.title, type: 'tv' as const, rate: ('rate' in m ? m.rate : undefined) }));

                // 交替排列
                const merged: TrendingKeyword[] = [];
                const maxLen = Math.max(movieTop.length, tvTop.length);
                for (let i = 0; i < maxLen; i++) {
                    if (movieTop[i]) merged.push(movieTop[i]);
                    if (tvTop[i]) merged.push(tvTop[i]);
                }

                set({ keywords: merged, lastUpdated: Date.now() });
            },

            getKeywords: (limit = 10) => {
                return get().keywords.slice(0, limit);
            },
        }),
        {
            name: 'kvideo-trending-keywords',
            version: 1,
        }
    )
);
