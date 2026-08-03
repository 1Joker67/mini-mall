import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/** 加入购物车请求校验 */
const addToCartSchema = z.object({
  productId: z.number().int().positive('无效的商品 ID'),
  quantity: z.number().int().min(1, '数量至少为 1').max(999, '数量不能超过 999'),
});

/**
 * GET /api/cart
 * 获取当前用户的购物车列表（需登录）
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { category: { select: { name: true } } },
        },
      },
      orderBy: { id: 'desc' },
    });

    // 计算总价
    const totalAmount = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        stock: item.product.stock,
        categoryName: item.product.category?.name,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })),
      totalAmount,
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    return NextResponse.json(
      { error: '获取购物车失败' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/cart
 * 加入购物车
 * - 已有同商品则累加数量
 * - 超过库存则返回错误
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addToCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { productId, quantity } = parsed.data;

    // 检查商品是否存在且有库存
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    }

    // 查找购物车中已有的该商品
    const existingItem = await prisma.cartItem.findFirst({
      where: { userId: user.id, productId },
    });

    const totalQuantity = (existingItem?.quantity || 0) + quantity;

    // 检查库存
    if (totalQuantity > product.stock) {
      return NextResponse.json(
        {
          error: `库存不足，当前库存为 ${product.stock} 件，购物车已有 ${existingItem?.quantity || 0} 件`,
        },
        { status: 400 },
      );
    }

    if (existingItem) {
      // 更新已有项的数量
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: totalQuantity },
      });
    } else {
      // 新增购物车项
      await prisma.cartItem.create({
        data: { userId: user.id, productId, quantity },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('加入购物车失败:', error);
    return NextResponse.json(
      { error: '加入购物车失败' },
      { status: 500 },
    );
  }
}
