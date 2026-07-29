'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/** 购物车项数据结构 */
interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  categoryName: string | null;
  quantity: number;
  subtotal: number;
}

/**
 * 购物车页面
 */
export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 加载购物车数据
  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart');
      if (res.status === 401) {
        router.push('/login?redirect=/cart');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '获取购物车失败');
        return;
      }
      setItems(data.items);
      setTotalAmount(data.totalAmount);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 修改数量
  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQuantity }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || '更新失败');
      return;
    }
    setError('');
    fetchCart();
  };

  // 删除购物车项
  const deleteItem = async (itemId: number) => {
    const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || '删除失败');
      return;
    }
    setError('');
    fetchCart();
  };

  // 提交订单
  const submitOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/orders', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '下单失败');
        return;
      }
      // 跳转到订单详情页
      router.push(`/orders/${data.id}`);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 面包屑 */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            首页
          </Link>
          <span>/</span>
          <span className="text-gray-900">购物车</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">
          我的购物车
          {items.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({items.length} 件商品)
            </span>
          )}
        </h1>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* 空购物车 */}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">🛒</p>
            <p className="text-gray-500 mb-4">购物车是空的</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              去逛逛
            </Link>
          </div>
        ) : (
          <>
            {/* 商品列表 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              {/* 表头 */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs text-gray-500 font-medium">
                <div className="col-span-5">商品</div>
                <div className="col-span-2 text-center">单价</div>
                <div className="col-span-2 text-center">数量</div>
                <div className="col-span-2 text-center">小计</div>
                <div className="col-span-1"></div>
              </div>

              {/* 商品行 */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center"
                >
                  {/* 商品信息 */}
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-xl text-gray-300">📦</span>
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1 transition-colors"
                      >
                        {item.name}
                      </Link>
                      {item.categoryName && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.categoryName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 单价 */}
                  <div className="sm:col-span-2 flex sm:block items-center justify-between">
                    <span className="text-xs text-gray-500 sm:hidden">单价</span>
                    <span className="text-sm text-gray-700 text-center block">
                      ¥{item.price.toLocaleString()}
                    </span>
                  </div>

                  {/* 数量调整 */}
                  <div className="sm:col-span-2 flex sm:block items-center justify-between">
                    <span className="text-xs text-gray-500 sm:hidden">数量</span>
                    <div className="flex items-center justify-center gap-0">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 rounded border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {item.quantity >= item.stock && (
                      <p className="text-xs text-amber-500 text-center mt-1">
                        已达库存上限
                      </p>
                    )}
                  </div>

                  {/* 小计 */}
                  <div className="sm:col-span-2 flex sm:block items-center justify-between">
                    <span className="text-xs text-gray-500 sm:hidden">小计</span>
                    <span className="text-sm font-medium text-red-500 text-center block">
                      ¥{item.subtotal.toLocaleString()}
                    </span>
                  </div>

                  {/* 删除 */}
                  <div className="sm:col-span-1 flex sm:block justify-end">
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 底部合计 + 提交订单 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">合计</span>
                <span className="text-2xl font-bold text-red-500">
                  ¥{totalAmount.toLocaleString()}
                </span>
              </div>
              <button
                onClick={submitOrder}
                disabled={loading}
                className="w-full py-3 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading ? '提交中...' : '提交订单'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
