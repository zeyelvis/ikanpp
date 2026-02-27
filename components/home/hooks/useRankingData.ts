'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface RankingMovie {
    id: string;
    title: string;
    cover: string;
    rate: string;
    url: string;
    // 详情字段（异步加载）
    description?: string;
    directors?: string[];
    actors?: string[];
    year?: string;
    types?: string[];
    region?: string[];
}

interface UseRankingDataOptions {
    limit?: number;
}

/**
 * 获取排行榜数据：电影、电视剧各取热门 Top N，按评分降序
 * 同时异步加载每部影片的简介信息
 */
export function useRankingData({ limit = 10 }: UseRankingDataOptions = {}) {
    const [movieRanking, setMovieRanking] = useState<RankingMovie[]>([]);
    const [tvRanking, setTvRanking] = useState<RankingMovie[]>([]);
    const [loading, setLoading] = useState(true);
    const fetchedRef = useRef(false);

    // 获取单个影片详情
    const fetchDetail = async (movie: RankingMovie): Promise<RankingMovie> => {
        try {
            const res = await fetch(`/api/douban/detail?id=${movie.id}`);
            if (!res.ok) return movie;
            const detail = await res.json();
            return {
                ...movie,
                description: detail.description || '',
                directors: detail.directors || [],
                actors: detail.actors || [],
                year: detail.year || '',
                types: detail.types || [],
                region: detail.region || [],
            };
        } catch {
            return movie; // 详情获取失败也不影响基本展示
        }
    };

    const fetchRanking = useCallback(async () => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        setLoading(true);

        try {
            const [movieRes, tvRes] = await Promise.all([
                fetch(`/api/douban/recommend?type=movie&tag=${encodeURIComponent('热门')}&page_limit=${limit}&page_start=0`),
                fetch(`/api/douban/recommend?type=tv&tag=${encodeURIComponent('热门')}&page_limit=${limit}&page_start=0`),
            ]);

            const [movieData, tvData] = await Promise.all([
                movieRes.ok ? movieRes.json() : { subjects: [] },
                tvRes.ok ? tvRes.json() : { subjects: [] },
            ]);

            const sortByRate = (a: RankingMovie, b: RankingMovie) =>
                parseFloat(b.rate || '0') - parseFloat(a.rate || '0');

            const movies = (movieData.subjects || []).sort(sortByRate).slice(0, limit);
            const tvs = (tvData.subjects || []).sort(sortByRate).slice(0, limit);

            // 先展示基本数据（无描述）
            setMovieRanking(movies);
            setTvRanking(tvs);
            setLoading(false);

            // 后台异步加载详情（简介、导演、演员等）
            const enrichMovies = Promise.all(movies.map(fetchDetail));
            const enrichTvs = Promise.all(tvs.map(fetchDetail));

            enrichMovies.then(enriched => setMovieRanking(enriched));
            enrichTvs.then(enriched => setTvRanking(enriched));
        } catch (error) {
            console.error('获取排行榜数据失败:', error);
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchRanking();
    }, [fetchRanking]);

    return { movieRanking, tvRanking, loading };
}
