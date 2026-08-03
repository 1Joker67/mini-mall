import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.number().int().positive().optional(),
  image: z.string().optional(),
});

/** GET /api/admin/products/[id] — 商品详情 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { id } = await params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) return NextResponse.json({ error: '无效 ID' }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!product) return NextResponse.json({ error: '商品不存在' }, { status: 404 });

  return NextResponse.json(product);
}

/** PUT /api/admin/products/[id] — 更新商品 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) return NextResponse.json({ error: '无效 ID' }, { status: 400 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: parsed.data,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('更新商品失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

/** DELETE /api/admin/products/[id] — 删除商品 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) return NextResponse.json({ error: '无效 ID' }, { status: 400 });

    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除商品失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
