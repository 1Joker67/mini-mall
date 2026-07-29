'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';

/** 订单详情数据结构 */
interface OrderDetail {
  id: number;
  originalAmount: number;
  discountRate: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: {
    productId: number;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
  }[];
}

/**
 * 订单详情页面
 */
export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const orderId = params.id as string;

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 401) {
        router.push('/login?redirect=/orders/' + orderId);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '获取订单详情失败');
        return;
      }
      setOrder(data);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // 执行订单操作（支付/取消）
  const handleAction = async (action: 'pay' | 'cancel') => {
    setActionLoading(action);
    setError('');

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '操作失败');
        return;
      }

      // 刷新订单数据
      await fetchOrder();
      router.refresh();
    } catch {
      setError('网络错误');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-gray-500 mb-4">{error || '订单不存在'}</p>
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            返回订单列表
          </Link>
        </div>
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
          <Link
            href="/orders"
            className="hover:text-blue-600 transition-colors"
          >
            我的订单
          </Link>
          <span>/</span>
          <span className="text-gray-900">订单详情</span>
        </nav>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* 订单头部 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gray-900">
              订单 #{order.id}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="text-xs text-gray-400">
            <p>
              创建时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
            </p>
            {order.status !== 'PENDING' && (
              <p className="mt-1">
                更新时间：{new Date(order.updatedAt).toLocaleString('zh-CN')}
              </p>
            )}
          </div>
        </div>

        {/* 商品明细 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 font-medium">
            商品明细
          </div>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 last:border-0"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-lg text-gray-300">📦</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.productId}`}
                  className="text-sm text-gray-900 hover:text-blue-600 line-clamp-1"
                >
                  {item.productName}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  ¥{item.price.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ¥{(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* 费用明细 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>商品原价</span>
              <span>¥{order.originalAmount.toLocaleString()}</span>
            </div>
            {order.discountRate < 1 && (
              <div className="flex justify-between text-amber-600">
                <span>
                  心悦折扣（{Math.round((1 - order.discountRate) * 100)}% off）
                </span>
                <span>
                  -¥
                  {(order.originalAmount - order.totalAmount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold pt-2 border-t border-gray-100">
              <span>实付金额</span>
              <span className="text-red-500">
                ¥{order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {order.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleAction('pay')}
                disabled={actionLoading === 'pay'}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'pay' ? '处理中...' : '确认支付（模拟）'}
              </button>
              <button
                onClick={() => handleAction('cancel')}
                disabled={actionLoading === 'cancel'}
                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'cancel' ? '处理中...' : '取消订单'}
              </button>
            </>
          )}
          {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
            <button
              onClick={() => handleAction('cancel')}
              disabled={actionLoading === 'cancel'}
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'cancel' ? '处理中...' : '取消订单'}
            </button>
          )}
          <Link
            href="/orders"
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center ml-auto"
          >
            返回列表
          </Link>
        </div>
      </div>
    </div>
  );
}
