import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// 启动时校验 JWT 密钥必须设置
if (!process.env.JWT_SECRET) {
  throw new Error('缺少 JWT_SECRET 环境变量，请检查 .env 文件');
}
const COOKIE_NAME = 'session';

/** 需要登录的路由 */
const PROTECTED_ROUTES = ['/cart', '/checkout', '/orders', '/profile'];

/** 需要管理员权限的路由 */
const ADMIN_ROUTES = ['/admin'];

/**
 * Next.js Proxy（原 Middleware）— 路由保护
 * - /cart、/checkout、/orders、/profile：需要登录
 * - /admin/*：需要管理员登录
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否需要登录
  const needsAuth = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const needsAdmin = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!needsAuth && !needsAdmin) {
    return NextResponse.next();
  }

  // 读取 session cookie，验证 JWT
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // 未登录，重定向到登录页
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // 需要管理员权限但用户不是管理员
    if (needsAdmin && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch {
    // JWT 无效或过期，重定向到登录页
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

/** proxy 匹配的路由 */
export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*', '/orders/:path*', '/profile/:path*', '/admin/:path*'],
};
