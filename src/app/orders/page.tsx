'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';

/** 订单数据结构 */
interface OrderItem {
  id: number;
  originalAmount: number;
  discountRate: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemCount: number;
  items?: { productId: number; productName: string; quantity: number; price: number }[];
}

/**
 * 我的订单页面
 */
export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.status === 401) {
          router.push('/login?redirect=/orders');
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '获取订单失败');
          return;
        }
        setOrders(data);
      } catch {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 面包屑 */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            首页
          </Link>
          <span>/</span>
          <span className="text-gray-900">我的订单</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">我的订单</h1>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-500 mb-4">暂无订单</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              去逛逛
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    订单号 #{order.id}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">
                      {order.itemCount} 件商品
                    </p>
                    {order.discountRate < 1 && (
                      <p className="text-xs text-amber-500 mt-0.5">
                        心悦折扣 {Math.round((1 - order.discountRate) * 100)}% off
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-500">
                      ¥{order.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
