'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddToCartButtonProps {
  productId: number;
  stock: number;
}

/**
 * 加入购物车按钮组件
 * 点击后将商品加入购物车，成功时提示并可跳转到购物车
 */
export default function AddToCartButton({
  productId,
  stock,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  const isOutOfStock = stock <= 0;

  const handleAddToCart = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push('/login?redirect=/products/' + productId);
        return;
      }

      if (!res.ok) {
        setError(data.error || '加入购物车失败');
        return;
      }

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || loading}
        className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
          added
            ? 'bg-green-500 text-white'
            : isOutOfStock
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {added
          ? '已加入购物车 ✓'
          : isOutOfStock
            ? '暂时无法购买'
            : loading
              ? '加入中...'
              : '加入购物车'}
      </button>
    </div>
  );
}
