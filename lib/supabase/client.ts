/**
 * Supabase 客户端初始化
 * 用于会员系统的用户认证和数据存储
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // 持久化 session 到 localStorage
        persistSession: true,
        // 自动刷新 token
        autoRefreshToken: true,
    },
});
