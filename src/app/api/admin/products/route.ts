import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const productSchema = z.object({
  name: z.string().min(1, '请输入商品名称'),
  description: z.string().min(1, '请输入商品描述'),
  price: z.number().positive('价格必须大于 0'),
  stock: z.number().int().min(0, '库存不能为负数'),
  categoryId: z.number().int().positive('请选择分类'),
  image: z.string().optional(),
});

/** GET /api/admin/products — 商品列表 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(products);
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
