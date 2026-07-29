import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/product/ProductCard';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';

const PAGE_SIZE = 9;

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * 首页 — 商品网格展示 + 搜索框 + 分类标签切换 + 分页
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  const search = typeof params.search === 'string' ? params.search.trim() : '';
  const categorySlug =
    typeof params.category === 'string' ? params.category.trim() : '';
  const page = Math.max(
    1,
    parseInt(typeof params.page === 'string' ? params.page : '1', 10),
  );

  // 构建查询条件
  const where: Record<string, unknown> = {};
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (search) {
    where.name = { contains: search };
  }

  // 并行获取分类列表和商品数据
  const [categories, productsResult, total] = await Promise.all([
    prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 构建纯查询参数字符串（供 Pagination 组件和内部使用）
  const buildQueryString = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    const finalSearch =
      overrides.search !== undefined ? overrides.search : search;
    const finalCategory =
      overrides.category !== undefined ? overrides.category : categorySlug;
    if (finalSearch) p.set('search', finalSearch);
    if (finalCategory) p.set('category', finalCategory);
    return p.toString();
  };

  // 构建带路径的完整 URL（供 Link 组件使用）
  const buildUrl = (overrides: Record<string, string>) => {
    const qs = buildQueryString(overrides);
    return qs ? `/?${qs}` : '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 搜索栏 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <form className="flex gap-2 max-w-xl mx-auto">
            {categorySlug && (
              <input type="hidden" name="category" value={categorySlug} />
            )}
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="搜索商品..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              搜索
            </button>
          </form>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Link
            href={buildUrl({ category: '' })}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !categorySlug
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            全部
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl({ category: cat.slug })}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categorySlug === cat.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name} ({cat._count.products})
            </Link>
          ))}
        </div>
      </div>

      {/* 商品网格 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {productsResult.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500">未找到相关商品</p>
            {search && (
              <p className="text-gray-400 text-sm mt-1">
                没有找到包含 &quot;{search}&quot; 的商品
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsResult.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              queryParams={buildQueryString({})}
            />
          </>
        )}
      </div>
    </div>
  );
}
