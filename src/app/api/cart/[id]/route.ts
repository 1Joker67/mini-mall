import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/** 修改数量请求校验 */
const updateCartSchema = z.object({
  quantity: z.number().int().min(1, '数量至少为 1').max(999, '数量不能超过 999'),
});

/**
 * PUT /api/cart/[id]
 * 修改购物车项的数量（需登录）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = parseInt(id, 10);

    if (isNaN(cartItemId)) {
      return NextResponse.json({ error: '无效的购物车项 ID' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { quantity } = parsed.data;

    // 查找购物车项，确保属于当前用户
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true },
    });

    if (!cartItem || cartItem.userId !== user.id) {
      return NextResponse.json(
        { error: '购物车项不存在' },
        { status: 404 },
      );
    }

    // 检查库存
    if (quantity > cartItem.product.stock) {
      return NextResponse.json(
        { error: `库存不足，当前库存为 ${cartItem.product.stock} 件` },
        { status: 400 },
      );
    }

    // 更新数量
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新购物车失败:', error);
    return NextResponse.json(
      { error: '更新购物车失败' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/cart/[id]
 * 删除购物车项（需登录）
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = parseInt(id, 10);

    if (isNaN(cartItemId)) {
      return NextResponse.json({ error: '无效的购物车项 ID' }, { status: 400 });
    }

    // 查找购物车项，确保属于当前用户
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.userId !== user.id) {
      return NextResponse.json(
        { error: '购物车项不存在' },
        { status: 404 },
      );
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除购物车项失败:', error);
    return NextResponse.json(
      { error: '删除购物车项失败' },
      { status: 500 },
    );
  }
}
