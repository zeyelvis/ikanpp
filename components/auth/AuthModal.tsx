/**
 * AuthModal — 爱奇艺风格登录/注册弹窗
 * 左右分栏布局：左侧宣传图 + 右侧表单
 * 使用 Portal 渲染到 body 层级
 */
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, UserPlus, LogIn, Gift, Eye, EyeOff, Loader2, Crown, Sparkles } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { Turnstile } from '@/components/auth/Turnstile';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
    const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [agreed, setAgreed] = useState(true);

    const { login, register, loading } = useUserStore();

    // 从 URL 或 localStorage 读取邀请码
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            if (ref) {
                setReferralCode(ref.toUpperCase());
                setTab('register');
            } else {
                // 从 localStorage 读取（ReferralCapture 存入的）
                const stored = localStorage.getItem('kvideo-referral-code');
                if (stored) {
                    setReferralCode(stored);
                    setTab('register');
                }
            }
        }
    }, []);

    useEffect(() => {
        setTab(defaultTab);
    }, [defaultTab]);

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
    };

    const verifyTurnstile = async (): Promise<boolean> => {
        if (!turnstileToken) {
            setError('请完成人机验证');
            return false;
        }
        try {
            const res = await fetch('/api/verify-turnstile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: turnstileToken }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || '人机验证失败，请重试');
                setTurnstileToken('');
                return false;
            }
            return true;
        } catch {
            setError('验证服务异常，请稍后重试');
            return false;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('请填写邮箱和密码'); return; }
        const verified = await verifyTurnstile();
        if (!verified) return;
        try {
            await login(email, password);
            onClose();
            resetForm();
        } catch (err: any) {
            setTurnstileToken('');
            setError(err.message === 'Invalid login credentials' ? '邮箱或密码错误' : err.message || '登录失败');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('请填写邮箱和密码'); return; }
        if (password.length < 6) { setError('密码至少 6 位'); return; }
        if (password !== confirmPassword) { setError('两次密码不一致'); return; }
        if (!agreed) { setError('请先同意用户协议'); return; }
        const verified = await verifyTurnstile();
        if (!verified) return;
        try {
            await register(email, password, referralCode || undefined);
            // 标记新注册用户（用于个人中心显示邮箱认证提醒）
            if (typeof window !== 'undefined') {
                localStorage.setItem('kvideo-just-registered', 'true');
            }
            // 检查是否自动登录成功
            const { user: currentUser } = useUserStore.getState();
            if (currentUser) {
                // 自动登录成功，关闭弹窗
                onClose();
                resetForm();
            } else {
                // 自动登录失败（可能邮箱确认开启），显示成功提示
                setSuccess('🎉 注册成功！请查收邮箱完成认证后登录');
                setTimeout(() => { onClose(); resetForm(); }, 3000);
            }
        } catch (err: any) {
            setTurnstileToken('');
            if (err.message?.includes('already registered')) {
                setError('该邮箱已注册，请直接登录');
            } else {
                setError(err.message || '注册失败');
            }
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* 弹窗主体 - 左右分栏 */}
            <div className="relative w-full max-w-[820px] flex rounded-2xl overflow-hidden shadow-2xl"
                style={{ maxHeight: '90vh' }}>

                {/* ===== 左侧宣传区 ===== */}
                <div className="hidden md:flex w-[340px] shrink-0 flex-col justify-between relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 30%, #302b63 60%, #24243e 100%)',
                    }}>
                    {/* 装饰光效 */}
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)' }} />
                    <div className="absolute bottom-20 left-0 w-64 h-64 rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)' }} />

                    {/* 顶部 Logo */}
                    <div className="p-8">
                        <div className="text-xl font-bold text-white tracking-wide" style={{
                            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>theone58</div>
                        <p className="text-xs text-white/40 mt-1">全网 VIP · 免费畅看 · 极速搜播</p>
                    </div>

                    {/* 中间权益展示 */}
                    <div className="px-8 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))' }}>
                                <Crown size={24} className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-lg">解锁专属特权</p>
                                <p className="text-white/50 text-xs">登录享会员专属内容</p>
                            </div>
                        </div>

                        {/* 权益列表 */}
                        <div className="space-y-4">
                            {[
                                { icon: '🎬', text: '全网影视免费聚合搜索' },
                                { icon: '👑', text: 'VIP 专属 Premium 内容' },
                                { icon: '☁️', text: '收藏 · 历史 · 云同步' },
                                { icon: '🎁', text: '邀请好友赚 VIP 天数' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-white/70 text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 底部文案 */}
                    <div className="p-8">
                        <p className="text-white font-bold text-xl leading-snug">
                            注册即送<br />
                            <span className="text-amber-400">30 天 VIP 体验</span>
                        </p>
                        <p className="text-white/40 text-xs mt-2">新用户专属福利</p>
                    </div>
                </div>

                {/* ===== 右侧表单区 ===== */}
                <div className="flex-1 bg-[#1a1a2e] flex flex-col overflow-y-auto" style={{ maxHeight: '90vh' }}>
                    {/* 关闭按钮 */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-10"
                    >
                        <X size={18} />
                    </button>

                    {/* 手机端标题（仅移动端显示） */}
                    <div className="md:hidden p-6 pb-0">
                        <div className="text-xl font-bold text-white tracking-wide" style={{
                            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>theone58</div>
                        <p className="text-xs text-white/40 mt-1">注册即送 30 天 VIP 体验</p>
                    </div>

                    {/* Tab 切换 */}
                    <div className="flex items-center gap-6 px-6 md:px-10 pt-8 md:pt-10">
                        <button
                            onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                            className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer ${tab === 'login' ? 'text-white' : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            密码登录
                            {tab === 'login' && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-emerald-400" />
                            )}
                        </button>
                        <button
                            onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
                            className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer ${tab === 'register' ? 'text-white' : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            注册账号
                            {tab === 'register' && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-emerald-400" />
                            )}
                        </button>
                    </div>

                    {/* 表单 */}
                    <form onSubmit={tab === 'login' ? handleLogin : handleRegister}
                        className="flex-1 flex flex-col px-6 md:px-10 pt-6 pb-6">
                        <div className="flex-1 space-y-4 min-h-[260px]">
                            {/* 邮箱 */}
                            <div className="relative group">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                                <input
                                    type="email"
                                    placeholder="请输入邮箱地址"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-all"
                                    autoComplete="email"
                                />
                            </div>

                            {/* 密码 */}
                            <div className="relative group">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="请输入密码"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-11 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-all"
                                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* 确认密码 (仅注册) */}
                            {tab === 'register' && (
                                <div className="relative group">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="请再次输入密码"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-all"
                                        autoComplete="new-password"
                                    />
                                </div>
                            )}

                            {/* 邀请码 (仅注册) */}
                            {tab === 'register' && (
                                <div className="relative group">
                                    <Gift size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-amber-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="邀请码（可选，填写可获额外奖励）"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                        maxLength={6}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all uppercase tracking-widest"
                                    />
                                </div>
                            )}

                            {/* Turnstile 人机验证 */}
                            <div className="flex justify-center">
                                <Turnstile
                                    onVerify={(token) => setTurnstileToken(token)}
                                    onExpire={() => setTurnstileToken('')}
                                    onError={() => setTurnstileToken('')}
                                    theme="dark"
                                />
                            </div>

                            {/* 错误/成功提示 */}
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
                                    <span className="text-red-400">⚠</span> {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 flex items-center gap-2">
                                    <Sparkles size={14} /> {success}
                                </div>
                            )}
                        </div>

                        {/* 提交按钮 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg mt-4"
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                            }}
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : tab === 'login' ? (
                                <>登录</>
                            ) : (
                                <>注册</>
                            )}
                        </button>

                        {/* 协议同意 */}
                        <div className="flex items-center gap-2 mt-4 justify-center">
                            <button
                                type="button"
                                onClick={() => setAgreed(!agreed)}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${agreed ? 'border-emerald-400 bg-emerald-400' : 'border-white/20'
                                    }`}
                            >
                                {agreed && <span className="text-[8px] text-white font-bold">✓</span>}
                            </button>
                            <span className="text-xs text-white/30">
                                同意《<span className="text-white/50 hover:text-emerald-400 cursor-pointer">用户协议</span>》和《<span className="text-white/50 hover:text-emerald-400 cursor-pointer">隐私条款</span>》
                            </span>
                        </div>

                        {/* 底部切换 */}
                        <p className="text-center text-xs text-white/30 mt-4">
                            {tab === 'login' ? (
                                <>还没有账号？<button type="button" onClick={() => { setTab('register'); setError(''); }} className="text-emerald-400 hover:underline cursor-pointer">立即注册</button></>
                            ) : (
                                <>已有账号？<button type="button" onClick={() => { setTab('login'); setError(''); }} className="text-emerald-400 hover:underline cursor-pointer">去登录</button></>
                            )}
                        </p>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
