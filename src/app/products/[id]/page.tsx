import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 获取商品详情（带分类信息）
 */
async function getProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
  return product;
}

/**
 * 商品详情页
 */
export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            首页
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                href={`/?category=${product.category.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* 商品图片 */}
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <span className="text-8xl text-gray-300">📦</span>
            </div>

            {/* 商品信息 */}
            <div className="flex flex-col">
              {/* 分类标签 */}
              {product.category && (
                <Link
                  href={`/?category=${product.category.slug}`}
                  className="inline-block w-fit text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3 hover:bg-blue-100 transition-colors"
                >
                  {product.category.name}
                </Link>
              )}

              {/* 商品名称 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* 价格 */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-red-500">
                  ¥{product.price.toLocaleString()}
                </span>
              </div>

              {/* 库存状态 */}
              <div className="mb-6">
                {isOutOfStock ? (
                  <span className="inline-block px-4 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm">
                    暂时缺货
                  </span>
                ) : (
                  <span className="inline-block px-4 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm">
                    有货（库存 {product.stock} 件）
                  </span>
                )}
              </div>

              {/* 商品描述 */}
              <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-700 mb-2">
                  商品描述
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {product.description}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="mt-auto flex gap-3">
                <button
                  disabled={isOutOfStock}
                  className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isOutOfStock
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isOutOfStock ? '暂时无法购买' : '加入购物车'}
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center"
                >
                  返回首页
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
