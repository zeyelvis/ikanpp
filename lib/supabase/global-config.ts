/**
 * 全局配置模块 — Supabase global_config 表 CRUD
 * 管理员修改视频源后写入此表，所有用户启动时从此表读取
 */
import { supabase } from './client';
import type { VideoSource } from '@/lib/types';

// 缓存（避免频繁请求）
let _cache: Record<string, { value: any; updatedAt: string }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟缓存
let _lastFetchTime = 0;

/**
 * 读取全局配置
 */
async function getGlobalConfig(key: string): Promise<any | null> {
    // 检查缓存
    const now = Date.now();
    if (_cache[key] && (now - _lastFetchTime) < CACHE_TTL_MS) {
        return _cache[key].value;
    }

    try {
        const { data, error } = await supabase
            .from('global_config')
            .select('value, updated_at')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            console.warn(`读取全局配置 [${key}] 失败:`, error.message);
            return null;
        }

        if (!data) return null;

        _cache[key] = { value: data.value, updatedAt: data.updated_at };
        _lastFetchTime = now;
        return data.value;
    } catch (err) {
        console.warn(`读取全局配置 [${key}] 异常:`, err);
        return null;
    }
}

/**
 * 写入全局配置（仅管理员调用）
 */
async function setGlobalConfig(key: string, value: any, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('global_config')
        .upsert({
            key,
            value,
            updated_at: new Date().toISOString(),
            updated_by: userId,
        }, { onConflict: 'key' });

    if (error) {
        console.error(`写入全局配置 [${key}] 失败:`, error.message);
        return false;
    }

    // 更新缓存
    _cache[key] = { value, updatedAt: new Date().toISOString() };
    _lastFetchTime = Date.now();
    return true;
}

// ─── 视频源相关 ───

/**
 * 获取全局普通视频源
 */
export async function getGlobalSources(): Promise<VideoSource[] | null> {
    return getGlobalConfig('sources');
}

/**
 * 获取全局 Premium 视频源
 */
export async function getGlobalPremiumSources(): Promise<VideoSource[] | null> {
    return getGlobalConfig('premium_sources');
}

/**
 * 保存全局普通视频源（管理员调用）
 */
export async function setGlobalSources(sources: VideoSource[], userId: string): Promise<boolean> {
    return setGlobalConfig('sources', sources, userId);
}

/**
 * 保存全局 Premium 视频源（管理员调用）
 */
export async function setGlobalPremiumSources(sources: VideoSource[], userId: string): Promise<boolean> {
    return setGlobalConfig('premium_sources', sources, userId);
}

/**
 * 获取全局配置最后更新时间（用于判断是否需要同步）
 */
export async function getGlobalConfigTimestamps(): Promise<Record<string, string>> {
    const { data } = await supabase
        .from('global_config')
        .select('key, updated_at');

    if (!data) return {};
    const result: Record<string, string> = {};
    data.forEach((row: any) => {
        result[row.key] = row.updated_at;
    });
    return result;
}

/**
 * 初始化全局配置（首次建表后将硬编码源写入 Supabase）
 * 仅在配置为空时执行
 */
export async function initGlobalConfigIfEmpty(
    defaultSources: VideoSource[],
    defaultPremiumSources: VideoSource[],
    userId: string
): Promise<void> {
    const sources = await getGlobalSources();
    if (!sources || (Array.isArray(sources) && sources.length === 0)) {
        console.log('全局普通源为空，写入默认配置...');
        await setGlobalSources(defaultSources, userId);
    }

    const premiumSources = await getGlobalPremiumSources();
    if (!premiumSources || (Array.isArray(premiumSources) && premiumSources.length === 0)) {
        console.log('全局高级源为空，写入默认配置...');
        await setGlobalPremiumSources(defaultPremiumSources, userId);
    }
}

/**
 * 清除缓存（管理员保存后调用，让下次读取拿最新数据）
 */
export function clearGlobalConfigCache(): void {
    _cache = {};
    _lastFetchTime = 0;
}
