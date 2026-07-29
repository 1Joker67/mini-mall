import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 9;

/**
 * GET /api/products
 * 商品列表接口，支持搜索、分类筛选、分页
 *
 * @param search  模糊搜索（匹配商品名称）
 * @param category  分类 slug 筛选
 * @param page  页码（默认 1）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim() || '';
  const categorySlug = searchParams.get('category')?.trim() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  try {
    // 构建查询条件
    const where: Record<string, unknown> = {};

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (search) {
      where.name = { contains: search };
    }

    // 并行查询：商品列表 + 总数
    const [products, total] = await Promise.all([
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

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    return NextResponse.json(
      { error: '获取商品列表失败' },
      { status: 500 },
    );
  }
}
