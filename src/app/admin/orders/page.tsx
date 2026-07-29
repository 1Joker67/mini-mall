'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: number; totalAmount: number; status: string; createdAt: string;
  user: { name: string; email: string };
  items: { product: { name: string }; quantity: number; price: number }[];
}

const STATUS_MAP: Record<string, string> = {
  PENDING: '待付款', PAID: '已支付', SHIPPED: '已发货',
  COMPLETED: '已完成', CANCELLED: '已取消',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const res = await fetch('/api/admin/orders');
    if (res.status === 403) { router.push('/login'); return; }
    setOrders(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatus = async (orderId: number, newStatus: string) => {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
  };

  if (loading) return <div className="p-6 text-gray-500">加载中...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">订单管理</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium">#{order.id}</span>
                <span className="text-xs text-gray-400 ml-3">
                  {order.user.name} ({order.user.email})
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                order.status === 'PAID' ? 'bg-blue-50 text-blue-600' :
                order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
                order.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                order.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500' :
                'bg-purple-50 text-purple-600'
              }`}>
                {STATUS_MAP[order.status] || order.status}
              </span>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              {order.items.map((item, i) => (
                <span key={i}>
                  {item.product.name} × {item.quantity}
                  {i < order.items.length - 1 ? '、' : ''}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-red-500">
                ¥{order.totalAmount.toLocaleString()}
              </span>

              <div className="flex gap-2">
                {order.status === 'PAID' && (
                  <button
                    onClick={() => handleStatus(order.id, 'SHIPPED')}
                    className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    发货
                  </button>
                )}
                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleStatus(order.id, 'COMPLETED')}
                    className="px-3 py-1.5 bg-green-50 text-green-600 text-xs rounded-lg hover:bg-green-100 transition-colors"
                  >
                    完成
                  </button>
                )}
                <span className="text-xs text-gray-400 self-center">
                  {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">暂无订单</div>
        )}
      </div>
    </div>
  );
}
