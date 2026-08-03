'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [initialData, setInitialData] = useState({
    name: '', description: '', price: '', stock: '', categoryId: '',
  });
  const [loading, setLoading] = useState(true);

  // 直接获取单个商品详情
  useEffect(() => {
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setInitialData({
          name: data.name || '',
          description: data.description || '',
          price: String(data.price || ''),
          stock: String(data.stock || ''),
          categoryId: String(data.categoryId || ''),
        });
        setLoading(false);
      });
  }, [productId]);

  const handleSubmit = async (data: { name: string; description: string; price: string; stock: string; categoryId: string }) => {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        categoryId: parseInt(data.categoryId),
      }),
    });
    if (!res.ok) return false;
    router.push('/admin/products');
    return true;
  };

  if (loading) {
    return <div className="p-6 text-gray-500">加载中...</div>;
  }

  return (
    <ProductForm
      title="编辑商品"
      submitLabel="保存修改"
      initialData={initialData}
      onSubmit={handleSubmit}
    />
  );
}
