import { prisma } from '@/lib/prisma';

/**
 * 管理员控制台 — 数据概览
 * 注意：layout 已做 ADMIN 权限校验，此处无需重复
 */
export default async function AdminDashboard() {
  const [productCount, orderCount, userCount, totalRevenue] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } },
      }),
    ]);

  // 近期订单
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">控制台</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '商品总数', value: productCount, icon: '📦' },
          { label: '订单总数', value: orderCount, icon: '📋' },
          { label: '用户总数', value: userCount, icon: '👥' },
          {
            label: '营收总额',
            value: `¥${(totalRevenue._sum.totalAmount || 0).toLocaleString()}`,
            icon: '💰',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm p-5"
          >
            <p className="text-2xl mb-2">{card.icon}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 近期订单 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">近期订单</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-6 py-3 text-left">订单号</th>
              <th className="px-6 py-3 text-left">用户</th>
              <th className="px-6 py-3 text-right">金额</th>
              <th className="px-6 py-3 text-center">状态</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-gray-50 hover:bg-gray-50"
              >
                <td className="px-6 py-3">#{order.id}</td>
                <td className="px-6 py-3 text-gray-500">
                  {order.user.name}
                </td>
                <td className="px-6 py-3 text-right">
                  ¥{order.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-3 text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'PAID'
                        ? 'bg-blue-50 text-blue-600'
                        : order.status === 'PENDING'
                          ? 'bg-yellow-50 text-yellow-600'
                          : order.status === 'COMPLETED'
                            ? 'bg-green-50 text-green-600'
                            : order.status === 'CANCELLED'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
