'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: number; name: string; slug: string; description: string | null;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories');
    setCategories(await res.json());
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description: desc }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '创建失败'); return; }
      setName(''); setSlug(''); setDesc('');
      fetchCategories();
    } catch { setError('网络错误'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('删除分类？（只能删除无商品的分类）')) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setError(data.error || '删除失败'); return; }
    fetchCategories();
  };

  // 自动生成 slug
  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">分类管理</h1>

      {/* 新增表单 */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">分类名称</label>
            <input required value={name} onChange={e => handleNameChange(e.target.value)}
              placeholder="如：手机数码"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">标识 (slug)</label>
            <input required value={slug} onChange={e => setSlug(e.target.value)}
              placeholder="如：phone-digital"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 shrink-0">
            {loading ? '添加中...' : '添加'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </form>

      {/* 分类列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-6 py-3 text-left">分类名称</th>
              <th className="px-6 py-3 text-left">标识</th>
              <th className="px-6 py-3 text-center">商品数</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{c.name}</td>
                <td className="px-6 py-3 text-gray-500">{c.slug}</td>
                <td className="px-6 py-3 text-center">{c._count.products}</td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-500 hover:text-red-600 text-xs"
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
