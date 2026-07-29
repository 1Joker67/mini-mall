import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/** DELETE /api/admin/categories/[id] — 删除分类 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  try {
    const { id } = await params;
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) return NextResponse.json({ error: '无效 ID' }, { status: 400 });

    // 检查分类下是否还有商品
    const productCount = await prisma.product.count({
      where: { categoryId },
    });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `该分类下还有 ${productCount} 个商品，请先移动或删除商品` },
        { status: 400 },
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
