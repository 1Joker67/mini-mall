import { getCurrentUser } from '@/lib/auth';
import { MEMBERSHIP_LEVELS } from '@/lib/membership';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

/**
 * 个人主页
 */
export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // 查询订单数量
  const orderCount = await prisma.order.count({
    where: { userId: user.id },
  });

  const currentLevel = MEMBERSHIP_LEVELS[user.membershipLevel];
  const nextLevel =
    user.membershipLevel < 3
      ? MEMBERSHIP_LEVELS[user.membershipLevel + 1]
      : null;

  // 距离下一级的消费差
  const remaining =
    nextLevel && nextLevel.threshold > user.totalSpent
      ? nextLevel.threshold - user.totalSpent
      : 0;

  // 升级进度百分比
  const progress =
    nextLevel && nextLevel.threshold > 0
      ? Math.min(100, Math.round((user.totalSpent / nextLevel.threshold) * 100))
      : 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 面包屑 */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            首页
          </Link>
          <span>/</span>
          <span className="text-gray-900">个人主页</span>
        </nav>

        {/* 用户卡片 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {/* 头像占位 */}
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl text-blue-600 font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">会员等级</p>
              <p
                className={`text-sm font-semibold ${
                  user.membershipLevel > 0
                    ? 'text-amber-600'
                    : 'text-gray-700'
                }`}
              >
                {currentLevel.name}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">累计消费</p>
              <p className="text-sm font-semibold text-gray-900">
                ¥{user.totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">当前折扣</p>
              <p className="text-sm font-semibold text-gray-900">
                {currentLevel.discountLabel}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">订单数量</p>
              <p className="text-sm font-semibold text-gray-900">
                {orderCount} 笔
              </p>
            </div>
          </div>
        </div>

        {/* 等级升级进度 */}
        {nextLevel && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">
              升级进度
            </h2>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>{currentLevel.name}</span>
              <span>{nextLevel.name}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {remaining > 0 ? (
              <p className="text-xs text-gray-400">
                还差 ¥{remaining.toLocaleString()} 升级到{nextLevel.name}
                （{nextLevel.discountLabel}）
              </p>
            ) : (
              <p className="text-xs text-green-600">
                已满足升级条件，下次支付后自动升级
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
