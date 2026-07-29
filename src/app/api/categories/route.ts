import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/categories
 * 分类列表接口，每个分类包含商品数量
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    // 转换数据格式：_count.products → productCount
    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      productCount: cat._count.products,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 },
    );
  }
}
