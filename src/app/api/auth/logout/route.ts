import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * 退出登录，清除 session Cookie
 */
export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('退出登录失败:', error);
    return NextResponse.json(
      { error: '退出登录失败' },
      { status: 500 },
    );
  }
}
