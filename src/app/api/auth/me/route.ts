import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 * 未登录时返回 null
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 },
    );
  }
}
