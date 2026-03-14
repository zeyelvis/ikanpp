/**
 * 签到系统 API
 * 每日签到送 VIP 天数：连续签到天数越多奖励越高
 * - 第 1-6 天：+0.1 天 VIP
 * - 第 7 天（满周）：+1 天 VIP（额外奖励）
 */
import { supabase } from './client';
import { addVipDays } from './auth';

// 签到奖励规则：连续签到第 N 天的奖励（VIP 小时数）
const CHECK_IN_REWARDS: Record<number, { hours: number; label: string }> = {
    1: { hours: 2, label: '+2小时' },
    2: { hours: 3, label: '+3小时' },
    3: { hours: 4, label: '+4小时' },
    4: { hours: 5, label: '+5小时' },
    5: { hours: 6, label: '+6小时' },
    6: { hours: 8, label: '+8小时' },
    7: { hours: 24, label: '+1天🎉' },
};

/**
 * 获取奖励信息
 */
function getReward(streak: number) {
    const day = ((streak - 1) % 7) + 1; // 1-7 循环
    return CHECK_IN_REWARDS[day] || CHECK_IN_REWARDS[1];
}

/**
 * 获取用户签到状态
 */
export async function getCheckInStatus(userId: string) {
    // 获取今日日期（北京时间）
    const today = getBeijingDateStr();

    // 查询今日是否已签到
    const { data: todayRecord } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .single();

    // 查询连续签到天数 — 从昨天往前查
    const streak = await calculateStreak(userId, today);

    // 获取总签到天数
    const { count } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    return {
        checkedInToday: !!todayRecord,
        streak: todayRecord ? streak : streak, // 当前连续天数
        totalDays: count || 0,
        todayReward: getReward(streak + 1), // 今天签到将获得的奖励
        nextReward: getReward(streak + 2), // 明天签到将获得的奖励
    };
}

/**
 * 执行签到
 */
export async function doCheckIn(userId: string) {
    const today = getBeijingDateStr();

    // 检查是否已签到
    const { data: existing } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .single();

    if (existing) {
        return { success: false, message: '今日已签到', streak: 0, reward: null };
    }

    // 计算连续签到天数
    const previousStreak = await calculateStreak(userId, today);
    const newStreak = previousStreak + 1;
    const reward = getReward(newStreak);

    // 插入签到记录
    const { error } = await supabase.from('check_ins').insert({
        user_id: userId,
        check_in_date: today,
        streak: newStreak,
        reward_hours: reward.hours,
    });

    if (error) {
        console.error('签到失败:', error);
        return { success: false, message: '签到失败，请重试', streak: 0, reward: null };
    }

    // 增加 VIP 时长（转换为天数）
    await addVipDays(userId, reward.hours / 24);

    return {
        success: true,
        message: `签到成功！${reward.label} VIP`,
        streak: newStreak,
        reward,
    };
}

/**
 * 获取最近 7 天签到记录（用于日历展示）
 */
export async function getRecentCheckIns(userId: string) {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(formatDate(d));
    }

    const { data } = await supabase
        .from('check_ins')
        .select('check_in_date, streak, reward_hours')
        .eq('user_id', userId)
        .in('check_in_date', dates)
        .order('check_in_date', { ascending: true });

    return dates.map(date => ({
        date,
        weekDay: getWeekDay(date),
        checkedIn: (data || []).some(r => r.check_in_date === date),
        isToday: date === getBeijingDateStr(),
    }));
}

// ---- 工具函数 ----

/**
 * 计算连续签到天数（不含今天）
 */
async function calculateStreak(userId: string, today: string): Promise<number> {
    let streak = 0;
    let checkDate = getPreviousDate(today);

    // 最多查 30 天
    for (let i = 0; i < 30; i++) {
        const { data } = await supabase
            .from('check_ins')
            .select('id')
            .eq('user_id', userId)
            .eq('check_in_date', checkDate)
            .single();

        if (!data) break;
        streak++;
        checkDate = getPreviousDate(checkDate);
    }

    return streak;
}

function getBeijingDateStr(): string {
    const now = new Date();
    // 转换到北京时间 (UTC+8)
    const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return bjTime.toISOString().split('T')[0];
}

function formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
}

function getPreviousDate(dateStr: string): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return formatDate(d);
}

function getWeekDay(dateStr: string): string {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[new Date(dateStr).getDay()];
}
