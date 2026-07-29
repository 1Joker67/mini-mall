import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getMembershipLevel, getDiscountRate } from '@/lib/membership';

/**
 * GET /api/orders
 * 获取当前用户的订单列表（需登录）
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      orders.map((order) => ({
        id: order.id,
        originalAmount: order.originalAmount,
        discountRate: order.discountRate,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.length,
        items: order.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.image,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
    );
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json(
      { error: '获取订单列表失败' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders
 * 从购物车创建订单（需登录）
 * 事务：创建订单 → 扣减库存 → 清空购物车
 */
export async function POST(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 从数据库获取用户最新信息（含会员等级）
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userData) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    // 获取购物车商品
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: '购物车为空' }, { status: 400 });
    }

    // 校验库存，缺货时返回具体商品名
    const outOfStock: string[] = [];
    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        outOfStock.push(
          `${item.product.name}（库存 ${item.product.stock}，需要 ${item.quantity}）`,
        );
      }
    }

    if (outOfStock.length > 0) {
      return NextResponse.json(
        { error: `以下商品库存不足：${outOfStock.join('、')}` },
        { status: 400 },
      );
    }

    // 计算订单金额 + 心悦折扣
    const originalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const discountRate = getDiscountRate(userData.membershipLevel);
    const totalAmount = Math.round(originalAmount * discountRate * 100) / 100;

    // 数据库事务：创建订单 → 扣库存 → 清空购物车
    const order = await prisma.$transaction(async (tx) => {
      // 1. 创建订单
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          originalAmount,
          discountRate,
          totalAmount,
          status: 'PENDING',
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price, // 下单时价格快照
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. 扣减库存
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. 清空购物车
      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      return newOrder;
    });

    return NextResponse.json(
      {
        id: order.id,
        originalAmount: order.originalAmount,
        discountRate: order.discountRate,
        totalAmount: order.totalAmount,
        status: order.status,
        itemCount: order.items.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json(
      { error: '创建订单失败，请稍后重试' },
      { status: 500 },
    );
  }
}
