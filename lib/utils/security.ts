/**
 * 安全工具模块 — URL 验证 + 速率限制
 */

// ====== SSRF 防护：URL 白名单验证 ======

/** 豆瓣图片代理允许的域名 */
const DOUBAN_IMAGE_WHITELIST = [
    'doubanio.com',
    'douban.com',
    'img1.doubanio.com',
    'img2.doubanio.com',
    'img3.doubanio.com',
    'img9.doubanio.com',
];

/** 禁止访问的内网 IP 段 */
const PRIVATE_IP_PATTERNS = [
    /^127\./,                          // localhost
    /^10\./,                           // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./,     // 172.16.0.0/12
    /^192\.168\./,                     // 192.168.0.0/16
    /^169\.254\./,                     // Link-local
    /^0\./,                            // 0.0.0.0/8
    /^fc00:/i,                         // IPv6 ULA
    /^fe80:/i,                         // IPv6 Link-local
    /^::1$/,                           // IPv6 localhost
    /^localhost$/i,
    /^metadata\.google\.internal$/i,   // GCP metadata
];

/** 允许的 URL 协议 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * 验证 URL 是否为豆瓣图片域名
 */
export function isAllowedDoubanImageUrl(urlStr: string): boolean {
    try {
        const url = new URL(urlStr);
        if (!ALLOWED_PROTOCOLS.includes(url.protocol)) return false;
        const hostname = url.hostname.toLowerCase();
        return DOUBAN_IMAGE_WHITELIST.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
        );
    } catch {
        return false;
    }
}

/**
 * 验证 URL 是否安全（非内网、合法协议）
 */
export function isSafeExternalUrl(urlStr: string): boolean {
    try {
        const url = new URL(urlStr);
        // 仅允许 http/https
        if (!ALLOWED_PROTOCOLS.includes(url.protocol)) return false;
        const hostname = url.hostname.toLowerCase();
        // 禁止内网 IP/域名
        if (PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname))) return false;
        // 禁止无点的主机名（如 localhost, intranet）
        if (!hostname.includes('.')) return false;
        return true;
    } catch {
        return false;
    }
}

// ====== 速率限制（内存级，适用于 Edge Runtime） ======

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// 定期清理过期记录（每 60 秒）
let cleanupScheduled = false;
function scheduleCleanup() {
    if (cleanupScheduled) return;
    cleanupScheduled = true;
    setTimeout(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitMap) {
            if (now > entry.resetAt) rateLimitMap.delete(key);
        }
        cleanupScheduled = false;
    }, 60_000);
}

/**
 * 检查是否超过速率限制
 * @param key 限制维度（如 IP 地址）
 * @param maxRequests 窗口内最大请求数
 * @param windowMs 窗口时长（毫秒）
 * @returns true = 被限制，false = 放行
 */
export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
    scheduleCleanup();
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    entry.count++;
    return entry.count > maxRequests;
}

/**
 * 从请求中提取客户端 IP
 */
export function getClientIp(request: Request): string {
    const headers = request.headers;
    return headers.get('cf-connecting-ip') ||
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        'unknown';
}
