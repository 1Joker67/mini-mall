import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const PAGE_SIZE = 10;

const productSchema = z.object({
  name: z.string().min(1, '请输入商品名称'),
  description: z.string().min(1, '请输入商品描述'),
  price: z.number().positive('价格必须大于 0'),
  stock: z.number().int().min(0, '库存不能为负数'),
  categoryId: z.number().int().positive('请选择分类'),
  image: z.string().optional(),
});

/** GET /api/admin/products — 商品列表（支持分类筛选 + 分页） */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const categoryId = parseInt(searchParams.get('categoryId') || '0', 10);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const where: Record<string, unknown> = {};
  if (categoryId > 0) {
    where.categoryId = categoryId;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
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
}

/** POST /api/admin/products — 创建商品 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('创建商品失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
