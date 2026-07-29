import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getMembershipLevel } from '@/lib/membership';

/** 状态更新请求校验 */
const updateStatusSchema = z.object({
  action: z.enum(['pay', 'cancel']),
});

/**
 * GET /api/orders/[id]
 * 订单详情（需登录，只能查看自己的订单）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: '无效的订单 ID' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      originalAmount: order.originalAmount,
      discountRate: order.discountRate,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.image,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    return NextResponse.json(
      { error: '获取订单详情失败' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/orders/[id]
 * 订单操作：模拟支付（PENDING → PAID）或取消
 * 支付成功后累加消费金额、自动升级会员等级
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
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: '无效的订单 ID' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '无效的操作，支持 pay（支付）或 cancel（取消）' },
        { status: 400 },
      );
    }

    const { action } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (action === 'cancel') {
      // 取消订单：从任意状态改为 CANCELLED，恢复库存
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });

        // 恢复库存
        const items = await tx.orderItem.findMany({
          where: { orderId },
        });

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });

      return NextResponse.json({ status: 'CANCELLED' });
    }

    if (action === 'pay') {
      if (order.status !== 'PENDING') {
        return NextResponse.json(
          { error: '当前订单状态不允许支付' },
          { status: 400 },
        );
      }

      // 模拟支付：PENDING → PAID，累加消费金额，升级会员
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
        });

        // 累加用户消费金额
        await tx.user.update({
          where: { id: user.id },
          data: { totalSpent: { increment: order.totalAmount } },
        });
      });

      // 重新读取用户，计算会员等级升级
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (updatedUser) {
        const newLevel = getMembershipLevel(updatedUser.totalSpent);
        if (newLevel.level !== updatedUser.membershipLevel) {
          await prisma.user.update({
            where: { id: user.id },
            data: { membershipLevel: newLevel.level },
          });
        }
      }

      return NextResponse.json({ status: 'PAID' });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json(
      { error: '更新订单失败' },
      { status: 500 },
    );
  }
}
