'use client';

/**
 * CheckInCard — 签到卡片组件
 * 展示最近 7 天签到日历 + 签到按钮 + 连续签到天数
 */
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Flame, Gift, Check, Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { getCheckInStatus, doCheckIn, getRecentCheckIns } from '@/lib/supabase/checkin';

interface DayInfo {
    date: string;
    weekDay: string;
    checkedIn: boolean;
    isToday: boolean;
}

export function CheckInCard() {
    const { user } = useUserStore();
    const [days, setDays] = useState<DayInfo[]>([]);
    const [checkedInToday, setCheckedInToday] = useState(false);
    const [streak, setStreak] = useState(0);
    const [totalDays, setTotalDays] = useState(0);
    const [todayReward, setTodayReward] = useState<{ hours: number; label: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [status, recent] = await Promise.all([
                getCheckInStatus(user.id),
                getRecentCheckIns(user.id),
            ]);
            setCheckedInToday(status.checkedInToday);
            setStreak(status.streak);
            setTotalDays(status.totalDays);
            setTodayReward(status.todayReward);
            setDays(recent);
        } catch (err) {
            console.error('加载签到数据失败:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCheckIn = async () => {
        if (!user?.id || checkedInToday || checkInLoading) return;
        setCheckInLoading(true);
        try {
            const result = await doCheckIn(user.id);
            if (result.success) {
                setSuccessMsg(result.message);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                await loadData(); // 刷新数据
            }
        } catch (err) {
            console.error('签到失败:', err);
        } finally {
            setCheckInLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--glass-bg)' }}>
            {/* 头部 */}
            <div className="p-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                        <Calendar size={18} className="text-emerald-400" />
                        每日签到
                    </h3>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-color-secondary)' }}>
                        <span className="flex items-center gap-1">
                            <Flame size={12} className="text-orange-400" />
                            连续 <b className="text-orange-400">{streak}</b> 天
                        </span>
                        <span>累计 {totalDays} 天</span>
                    </div>
                </div>

                {/* 7 天日历 */}
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 size={20} className="animate-spin text-emerald-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-1.5">
                        {days.map((day) => (
                            <div
                                key={day.date}
                                className={`flex flex-col items-center py-2 rounded-xl transition-all ${day.isToday
                                        ? 'bg-emerald-500/15 border border-emerald-500/30'
                                        : day.checkedIn
                                            ? 'bg-white/5'
                                            : 'bg-transparent'
                                    }`}
                            >
                                <span className="text-[10px] mb-1" style={{ color: 'var(--text-color-secondary)' }}>
                                    {day.isToday ? '今' : `周${day.weekDay}`}
                                </span>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${day.checkedIn
                                        ? 'bg-emerald-500 text-white'
                                        : day.isToday
                                            ? 'bg-white/10 text-emerald-400 border border-dashed border-emerald-500/50'
                                            : 'bg-white/5 text-white/20'
                                    }`}>
                                    {day.checkedIn
                                        ? <Check size={14} strokeWidth={3} />
                                        : day.date.split('-')[2]
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 签到按钮 */}
            <div className="px-5 pb-5">
                {checkedInToday ? (
                    <div className="w-full py-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                        <Check size={16} strokeWidth={3} />
                        今日已签到
                    </div>
                ) : (
                    <button
                        onClick={handleCheckIn}
                        disabled={checkInLoading}
                        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer
                            bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25
                            hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {checkInLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <Gift size={16} />
                                签到领 {todayReward?.label || '+2小时'} VIP
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* 签到成功提示 */}
            {showSuccess && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
                    <div className="px-6 py-3 bg-emerald-900/90 text-emerald-200 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-2 backdrop-blur-xl">
                        <span className="text-lg">🎉</span>
                        <span className="text-sm font-medium">{successMsg}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
