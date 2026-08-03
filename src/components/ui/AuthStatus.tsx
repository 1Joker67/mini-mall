'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuthStatusProps {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    membershipLevel: number;
  } | null;
}

/** 会员等级名称映射 */
const LEVEL_NAMES: Record<number, string> = {
  0: '普通会员',
  1: '心悦1',
  2: '心悦2',
  3: '心悦3',
};

/**
 * 导航栏认证状态组件
 * 根据登录状态显示不同内容：
 * - 未登录：显示登录按钮
 * - 已登录：显示用户名、会员等级、退出按钮
 */
export default function AuthStatus({ user }: AuthStatusProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
      >
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* 会员等级标签 */}
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          user.membershipLevel > 0
            ? 'bg-amber-50 text-amber-600'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {LEVEL_NAMES[user.membershipLevel] || '普通会员'}
      </span>

      {/* 用户名 — 点击跳转个人主页 */}
      <Link
        href="/profile"
        className="text-sm text-gray-700 font-medium hover:text-blue-600 transition-colors"
      >
        {user.name}
      </Link>

      {/* 退出按钮 */}
      <button
        onClick={handleLogout}
        className="text-sm text-gray-400 hover:text-red-500 transition-colors"
      >
        退出
      </button>
    </div>
  );
}
