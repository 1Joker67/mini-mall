import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const statusSchema = z.object({
  status: z.enum(['SHIPPED', 'COMPLETED']),
});

/** PUT /api/admin/orders/[id] — 更新订单状态（SHIPPED/COMPLETED） */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) return NextResponse.json({ error: '无效 ID' }, { status: 400 });

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });

    if (parsed.data.status === 'SHIPPED' && order.status !== 'PAID') {
      return NextResponse.json({ error: '只能对已支付订单发货' }, { status: 400 });
    }
    if (parsed.data.status === 'COMPLETED' && order.status !== 'SHIPPED') {
      return NextResponse.json({ error: '只能对已发货订单完成' }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ status: parsed.data.status });
  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
