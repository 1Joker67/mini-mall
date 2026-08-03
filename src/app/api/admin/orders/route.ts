import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/** GET /api/admin/orders — 所有订单列表 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}
