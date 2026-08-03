import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const categorySchema = z.object({
  name: z.string().min(1, '请输入分类名称'),
  slug: z.string().min(1, '请输入分类标识'),
  description: z.string().optional(),
});

/** GET /api/admin/categories — 分类列表 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(categories);
}

/** POST /api/admin/categories — 创建分类 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: parsed.data.name }, { slug: parsed.data.slug }] },
    });
    if (existing) {
      return NextResponse.json({ error: '分类名或标识已存在' }, { status: 409 });
    }

    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('创建分类失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
