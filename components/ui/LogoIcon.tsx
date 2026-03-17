'use client';

/**
 * iKanPP Logo — SVG 矢量组件
 * 基于品牌设计稿：橙色圆润角色 + 3D 眼镜 + 播放元素
 * 亮色/暗色主题自适应
 */

interface LogoIconProps {
    size?: number;
    className?: string;
}

export function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
    const uid = `ik-${size}`;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="iKanPP"
        >
            <defs>
                {/* 橙色主体渐变 */}
                <linearGradient id={`${uid}-body`} x1="40" y1="20" x2="160" y2="180" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFB020" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#E67E22" />
                </linearGradient>
                {/* 光泽高光 */}
                <radialGradient id={`${uid}-shine`} cx="0.35" cy="0.25" r="0.6">
                    <stop offset="0%" stopColor="#FFE066" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#FFB020" stopOpacity="0" />
                </radialGradient>
                {/* 3D 眼镜蓝色镜片 */}
                <linearGradient id={`${uid}-blue`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                {/* 3D 眼镜红色镜片 */}
                <linearGradient id={`${uid}-red`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FB7185" />
                    <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
            </defs>

            {/* ===== 主体：橙色圆润形状 ===== */}
            <ellipse cx="100" cy="108" rx="78" ry="72" fill={`url(#${uid}-body)`} />
            {/* 头顶弧度 */}
            <ellipse cx="100" cy="80" rx="68" ry="58" fill={`url(#${uid}-body)`} />
            {/* 顶部光泽 */}
            <ellipse cx="85" cy="65" rx="45" ry="35" fill={`url(#${uid}-shine)`} />

            {/* ===== 3D 眼镜框 ===== */}
            {/* 眼镜横杠 */}
            <rect x="32" y="82" width="136" height="8" rx="4" fill="#1a1a2e" />
            {/* 左镜框 */}
            <rect x="32" y="68" width="56" height="40" rx="10" fill="#1a1a2e" />
            {/* 右镜框 */}
            <rect x="112" y="68" width="56" height="40" rx="10" fill="#1a1a2e" />
            {/* 左蓝色镜片 */}
            <rect x="37" y="73" width="46" height="30" rx="7" fill={`url(#${uid}-blue)`} />
            {/* 右红色镜片 */}
            <rect x="117" y="73" width="46" height="30" rx="7" fill={`url(#${uid}-red)`} />
            {/* 镜片反光 */}
            <rect x="41" y="76" width="18" height="8" rx="4" fill="white" opacity="0.35" />
            <rect x="121" y="76" width="18" height="8" rx="4" fill="white" opacity="0.35" />

            {/* ===== 嘴巴（开心微笑） ===== */}
            <path
                d="M72 128 Q100 152 128 128"
                stroke="#8B4513"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />

            {/* ===== 小星星装饰 ===== */}
            <g fill="#FFD700" opacity="0.9">
                {/* 左上星星 */}
                <polygon points="30,30 33,22 36,30 44,30 38,35 40,43 33,38 26,43 28,35 22,30" />
                {/* 右上星星 */}
                <polygon points="160,18 163,10 166,18 174,18 168,23 170,31 163,26 156,31 158,23 152,18" />
                {/* 右上小星星 */}
                <polygon points="178,42 180,38 182,42 186,42 183,44 184,48 180,46 176,48 177,44 174,42" />
            </g>
        </svg>
    );
}
