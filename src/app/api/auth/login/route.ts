import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSession } from '@/lib/auth';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

// 登录请求校验
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

/**
 * POST /api/auth/login
 * 用户登录接口
 *
 * 安全策略：登录失败时不区分"用户不存在"和"密码错误"，
 * 统一返回"邮箱或密码错误"，防止撞库攻击。
 */
export async function POST(request: NextRequest) {
  try {
    // 频率限制：每个 IP 每分钟最多 5 次登录尝试
    const ip = getClientIP(request);
    const { allowed } = checkRateLimit(`login:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 防御时序攻击：无论用户是否存在，都执行 bcrypt.compare
    // 用户不存在时使用一个固定的 dummy hash，确保耗时一致
    const passwordValid = await verifyPassword(
      password,
      user?.password ?? '$2a$10$dummyhashfordefenseagainsttimingattack',
    );

    if (!user || !passwordValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 },
      );
    }

    // 写入 session cookie
    await setSession(user.id, user.role);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
