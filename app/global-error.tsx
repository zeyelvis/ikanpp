'use client';

/**
 * 全局错误边界 — 捕获并显示客户端崩溃的具体信息
 * 用于调试 Cloudflare Pages 部署后的 Hydration 错误
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: '2rem', fontFamily: 'monospace', background: '#1a1a2e', color: '#eee' }}>
        <h1 style={{ color: '#ff6b6b' }}>⚠️ 应用崩溃 — 调试信息</h1>
        <div style={{ background: '#2d2d44', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <p><strong>错误消息:</strong></p>
          <pre style={{ color: '#ffd93d', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {error.message}
          </pre>
        </div>
        {error.digest && (
          <div style={{ background: '#2d2d44', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <p><strong>Digest:</strong> {error.digest}</p>
          </div>
        )}
        <div style={{ background: '#2d2d44', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <p><strong>堆栈跟踪:</strong></p>
          <pre style={{ color: '#a8a8a8', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '12px' }}>
            {error.stack}
          </pre>
        </div>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          重试
        </button>
      </body>
    </html>
  );
}
