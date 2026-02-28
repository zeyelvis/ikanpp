/**
 * Footer - 页面底部组件
 * 提供站点信息、法律声明和品牌标识
 */

'use client';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-16 border-t border-[var(--glass-border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* 上方：三栏布局 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
                    {/* 品牌 */}
                    <div>
                        <h3 className="text-base font-bold text-[var(--text-color)] mb-2">theone58</h3>
                        <p className="text-xs text-[var(--text-color-secondary)] leading-relaxed">
                            海量片源极速聚合<br />
                            全网影视一键搜索播放平台
                        </p>
                    </div>

                    {/* 功能 */}
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider mb-2">功能</h4>
                        <ul className="space-y-1.5 text-xs text-[var(--text-color-secondary)]">
                            <li>🎬 电影排行</li>
                            <li>📺 电视剧排行</li>
                            <li>🔍 多源聚合搜索</li>
                            <li>⭐ 收藏与历史</li>
                        </ul>
                    </div>

                    {/* 平台 */}
                    <div>
                        <h4 className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider mb-2">支持平台</h4>
                        <ul className="space-y-1.5 text-xs text-[var(--text-color-secondary)]">
                            <li>📱 iOS / Android</li>
                            <li>💻 Web 浏览器</li>
                            <li>🖥️ macOS / Windows</li>
                            <li>📺 智能电视</li>
                        </ul>
                    </div>
                </div>

                {/* 分隔线 */}
                <div className="border-t border-[var(--glass-border)] pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <p className="text-[10px] text-[var(--text-color-secondary)]">
                            © {currentYear} theone58. 本站不存储任何视频文件，仅提供搜索聚合服务。
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-[var(--text-color-secondary)]">
                            <span>数据来源：豆瓣</span>
                            <span>·</span>
                            <span>Made with ❤️</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
