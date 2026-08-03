/**
 * 简易内存频率限制器
 * 每个 IP 在指定时间窗口内最多允许指定次数的请求
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 定期清理过期条目，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000);

/**
 * 检查是否超出频率限制
 * @param key  标识（通常是 IP 地址）
 * @param maxRequests  最大请求次数
 * @param windowMs  时间窗口（毫秒）
 * @returns { allowed: boolean, remaining: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  // 首次请求或窗口已过期，重置计数
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  const remaining = maxRequests - entry.count;

  if (remaining < 0) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining };
}

/**
 * 提取客户端 IP 地址
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}
