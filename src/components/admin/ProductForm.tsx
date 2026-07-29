'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
}

interface ProductFormProps {
  /** 初始数据（编辑模式传入，新增模式为空） */
  initialData?: ProductFormData;
  /** 提交回调，返回 true 表示成功 */
  onSubmit: (data: ProductFormData) => Promise<boolean>;
  /** 标题 */
  title: string;
  /** 提交按钮文字 */
  submitLabel: string;
}

const defaultData: ProductFormData = {
  name: '', description: '', price: '', stock: '', categoryId: '',
};

/**
 * 商品表单组件 — 新增和编辑共用
 */
export default function ProductForm({
  initialData = defaultData,
  onSubmit,
  title,
  submitLabel,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(initialData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 同步外部 initialData 变化（编辑模式下异步加载完成时更新）
  useEffect(() => {
    setForm(initialData);
  }, [initialData.name, initialData.price, initialData.categoryId]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await onSubmit(form);
      if (!success) {
        // 错误由父组件通过返回值判断，这里用通用提示
        setError('操作失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: keyof ProductFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm({ ...form, [field]: e.target.value });

  const fieldClass =
    'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{title}</h1>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
          <input required value={form.name} onChange={update('name')} className={fieldClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea required value={form.description} onChange={update('description')} className={fieldClass} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
            <input type="number" step="0.01" required value={form.price} onChange={update('price')} className={fieldClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
            <input type="number" required value={form.stock} onChange={update('stock')} className={fieldClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <select required value={form.categoryId} onChange={update('categoryId')} className={fieldClass}>
            <option value="">请选择分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '处理中...' : submitLabel}
          </button>
          <button
            type="button"
            onClick={() => history.back()}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
