import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * 管理员后台布局 — 侧边栏 + 内容区
 * 非 ADMIN 用户自动重定向到首页
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect('/login?redirect=/admin');
  }

  const navItems = [
    { href: '/admin', label: '控制台', icon: '📊' },
    { href: '/admin/products', label: '商品管理', icon: '📦' },
    { href: '/admin/orders', label: '订单管理', icon: '📋' },
    { href: '/admin/categories', label: '分类管理', icon: '🏷' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <aside className="w-56 bg-white border-r border-gray-200 shrink-0 hidden md:block">
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/" className="text-lg font-bold text-blue-600">
            🛍 Mini Mall
          </Link>
          <p className="text-xs text-gray-400 mt-1">管理后台</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 mt-auto border-t border-gray-100 pt-4 mx-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-600 transition-colors"
          >
            ← 返回前台
          </Link>
        </div>
      </aside>

      {/* 移动端底部导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-2 text-xs text-gray-500"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
    </div>
  );
}
