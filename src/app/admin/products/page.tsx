'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';

interface Product {
  id: number; name: string; price: number; stock: number;
  category: { name: string } | null; createdAt: string;
}

interface Category {
  id: number; name: string;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const categoryId = searchParams.get('categoryId') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (page > 1) params.set('page', String(page));

    const res = await fetch(`/api/admin/products?${params}`);
    if (res.status === 403) { router.push('/login'); return; }
    const data = await res.json();
    setProducts(data.products);
    setTotalPages(data.totalPages);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [categoryId, page]);

  useEffect(() => {
    // 加载分类列表（筛选下拉用）
    fetch('/api/admin/categories').then(r => r.json()).then(setCategories);
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除「${name}」？`)) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const handleFilter = (newCategoryId: string) => {
    const params = new URLSearchParams();
    if (newCategoryId) params.set('categoryId', newCategoryId);
    router.push(`/admin/products?${params}`);
  };

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

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500">分类筛选：</label>
        <select
          value={categoryId}
          onChange={(e) => handleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {categoryId && (
          <button
            onClick={() => handleFilter('')}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            清除筛选
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 py-8 text-center">加载中...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          暂无商品
        </div>
      ) : (
        <>
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
                      <Link href={`/admin/products/${p.id}/edit`} className="text-blue-600 hover:text-blue-700">编辑</Link>
                      <button onClick={() => handleDelete(p.id, p.name)} className="text-red-500 hover:text-red-600">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/admin/products"
            queryParams={categoryId ? `categoryId=${categoryId}` : ''}
          />
        </>
      )}
    </div>
  );
}

/**
 * 商品管理页面（Suspense 包裹 useSearchParams）
 */
export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">加载中...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
