'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: { name: string; description: string; price: string; stock: string; categoryId: string }) => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
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

  return (
    <ProductForm
      title="新增商品"
      submitLabel="创建商品"
      onSubmit={handleSubmit}
    />
  );
}
