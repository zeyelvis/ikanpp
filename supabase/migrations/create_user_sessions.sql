-- =============================================
-- 多设备登录限制：user_sessions 表
-- 请在 Supabase SQL Editor 中执行此脚本
-- =============================================

-- 1. 创建会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT DEFAULT 'unknown',
    ip_address TEXT,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 索引：按用户查询活跃会话
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- 3. 唯一约束：同一用户同一设备只保留一条记录
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_unique ON user_sessions(user_id, device_id);

-- 4. 启用 RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略：用户只能操作自己的会话
CREATE POLICY "用户管理自己的会话" ON user_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
