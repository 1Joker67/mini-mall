'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Product {
  id: number; name: string; price: number; stock: number;
  category: { name: string } | null; createdAt: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    const res = await fetch('/api/admin/products');
    if (res.status === 403) { router.push('/login'); return; }
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除「${name}」？`)) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  if (loading) return <div className="p-6 text-gray-500">加载中...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">商品管理</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          新增商品
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">名称</th>
              <th className="px-6 py-3 text-right">价格</th>
              <th className="px-6 py-3 text-center">库存</th>
              <th className="px-6 py-3 text-left">分类</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3">{p.id}</td>
                <td className="px-6 py-3">{p.name}</td>
                <td className="px-6 py-3 text-right">¥{p.price.toLocaleString()}</td>
                <td className="px-6 py-3 text-center">{p.stock}</td>
                <td className="px-6 py-3 text-gray-500">{p.category?.name || '-'}</td>
                <td className="px-6 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-red-500 hover:text-red-600"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
