import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/[id]
 * 商品详情接口，包含关联的分类信息
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ error: '无效的商品 ID' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('获取商品详情失败:', error);
    return NextResponse.json(
      { error: '获取商品详情失败' },
      { status: 500 },
    );
  }
}
