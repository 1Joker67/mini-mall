import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Mini Mall — 微型电商',
  description: '一个轻量级全栈电商应用',
};

/**
 * 根布局，包含全局导航栏
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              🛍 Mini Mall
            </Link>

            {/* 导航链接 */}
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/cart"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                购物车
              </Link>
              <Link
                href="/orders"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                我的订单
              </Link>
              <Link
                href="/login"
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                登录
              </Link>
            </nav>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="flex-1">{children}</main>

        {/* 页脚 */}
        <footer className="bg-white border-t border-gray-200 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
            <p>© 2026 Mini Mall. 仅供学习使用。</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
