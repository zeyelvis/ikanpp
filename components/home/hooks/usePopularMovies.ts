import { useState, useEffect, useCallback, useRef } from 'react';

interface DoubanMovie {
    id: string;
    title: string;
    cover: string;
    rate: string;
    url: string;
}

const PAGE_SIZE = 20;

// ── localStorage 缓存 ──────────────────────────
const CACHE_PREFIX = 'kvideo-popular-';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 分钟

interface CacheEntry {
    data: DoubanMovie[];
    ts: number;
}

function getCached(key: string): DoubanMovie[] | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const entry: CacheEntry = JSON.parse(raw);
        if (Date.now() - entry.ts > CACHE_TTL_MS) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function setCache(key: string, data: DoubanMovie[]) {
    try {
        const entry: CacheEntry = { data, ts: Date.now() };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // 缓存满了等情况静默忽略
    }
}

export function usePopularMovies(selectedTag: string, tags: any[], contentType: 'movie' | 'tv' = 'movie') {
    const [movies, setMovies] = useState<DoubanMovie[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const abortRef = useRef<AbortController | null>(null);

    // 解析标签值
    const resolveTagValue = useCallback((tag: string) => {
        if (!tags.length) return '热门'; // tags 还没加载时用默认值
        const matched = tags.find((t: any) => t.id === tag) || tags.find((t: any) => t.value === tag);
        return matched?.value || '热门';
    }, [tags]);

    // 加载指定页
    const loadPage = useCallback(async (tag: string, pageNum: number, signal?: AbortSignal) => {
        const tagValue = resolveTagValue(tag);
        const cacheKey = `${contentType}-${tagValue}-${pageNum}`;

        // 先尝试 localStorage 缓存（仅首页）
        if (pageNum === 0) {
            const cached = getCached(cacheKey);
            if (cached && cached.length > 0) {
                setMovies(cached);
                setHasMore(cached.length === PAGE_SIZE);
                // 后台静默刷新（不显示 loading）
                fetchFromNetwork(tagValue, pageNum, signal, cacheKey, true);
                return;
            }
        }

        setLoading(true);
        await fetchFromNetwork(tagValue, pageNum, signal, cacheKey, false);
    }, [resolveTagValue, contentType]);

    // 实际网络请求
    const fetchFromNetwork = useCallback(async (
        tagValue: string, pageNum: number, signal: AbortSignal | undefined,
        cacheKey: string, isSilent: boolean
    ) => {
        try {
            // 超时 12 秒
            const timeoutController = new AbortController();
            const timer = setTimeout(() => timeoutController.abort(), 12000);

            // 合并 signals
            const combinedSignal = signal
                ? (AbortSignal as any).any
                    ? (AbortSignal as any).any([signal, timeoutController.signal])
                    : timeoutController.signal
                : timeoutController.signal;

            const response = await fetch(
                `/api/douban/recommend?type=${contentType}&tag=${encodeURIComponent(tagValue)}&page_limit=${PAGE_SIZE}&page_start=${pageNum * PAGE_SIZE}`,
                { signal: combinedSignal }
            );

            clearTimeout(timer);

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            const newMovies = data.subjects || [];

            if (!signal?.aborted) {
                setMovies(newMovies);
                setHasMore(newMovies.length === PAGE_SIZE);
                if (!isSilent) setLoading(false);
                // 写入缓存
                if (newMovies.length > 0) setCache(cacheKey, newMovies);
            }
        } catch (error: any) {
            if (signal?.aborted) return;
            console.error('加载失败:', error);
            if (!isSilent) {
                setHasMore(false);
                setLoading(false);
            }
        }
    }, [contentType]);

    // 标签或类型变化时回到第 1 页
    useEffect(() => {
        // tags 未加载也发请求（用默认值 '热门'），避免卡住
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setPage(0);
        setMovies([]);
        setHasMore(true);
        loadPage(selectedTag, 0, controller.signal);

        return () => controller.abort();
    }, [selectedTag, contentType, tags.length]); // tags.length 变化时重新请求

    // 翻页
    const goToPage = useCallback((newPage: number) => {
        if (newPage < 0) return;
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setPage(newPage);
        loadPage(selectedTag, newPage, controller.signal);

        // 翻页后滚动到影片网格顶部
        setTimeout(() => {
            const grid = document.getElementById('movie-grid-top');
            if (grid) {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }, [selectedTag, loadPage]);

    return {
        movies,
        loading,
        page,
        hasMore,
        goToPage,
    };
}
