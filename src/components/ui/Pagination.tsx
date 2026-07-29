import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** 基础路径，用于生成链接，如 "/" 或 "/products" */
  basePath?: string;
  /** 额外的查询参数，如 "category=phone-digital" */
  queryParams?: string;
}

/**
 * 分页组件
 */
export default function Pagination({
  currentPage,
  totalPages,
  basePath = '/',
  queryParams = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(queryParams);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  };

  // 生成页码数组，始终显示最多 5 个页码
  const pages: (number | '...')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="分页导航">
      {/* 上一页 */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          上一页
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">
          上一页
        </span>
      )}

      {/* 页码 */}
      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`dots-${idx}`} className="px-2 py-2 text-gray-400">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={buildUrl(page)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            {page}
          </Link>
        ),
      )}

      {/* 下一页 */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          下一页
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">
          下一页
        </span>
      )}
    </nav>
  );
}
