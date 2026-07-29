import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    stock: number;
    category: { id: number; name: string; slug: string } | null;
  };
}

/**
 * 商品卡片组件，用于首页商品网格
 */
export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* 商品图片占位 */}
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-4xl text-gray-300">📦</span>
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        {/* 分类标签 */}
        {product.category && (
          <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-2">
            {product.category.name}
          </span>
        )}

        {/* 商品名称 */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* 价格和库存 */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-red-500">
            ¥{product.price.toLocaleString()}
          </span>
          {isOutOfStock ? (
            <span className="text-xs text-gray-400">已售罄</span>
          ) : (
            <span className="text-xs text-gray-400">库存 {product.stock}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
