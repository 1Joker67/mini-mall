import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 创建管理员
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@minimall.com' },
    update: {},
    create: {
      email: 'admin@minimall.com',
      password: adminPassword,
      name: '管理员',
      role: 'ADMIN',
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  // 创建测试用户
  const userPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@minimall.com' },
    update: {},
    create: {
      email: 'user@minimall.com',
      password: userPassword,
      name: '测试用户',
      role: 'USER',
    },
  });
  console.log(`  ✅ User: ${user.email}`);

  // 创建分类
  const categories = [
    { name: '手机数码', slug: 'phone-digital', description: '手机、平板、数码配件' },
    { name: '电脑办公', slug: 'computer-office', description: '笔记本、台式机、办公设备' },
    { name: '家用电器', slug: 'home-appliance', description: '电视、冰箱、洗衣机等家电' },
    { name: '服饰鞋包', slug: 'fashion', description: '服装、鞋子、箱包配饰' },
    { name: '食品生鲜', slug: 'food-fresh', description: '零食、生鲜、酒水饮料' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✅ Categories: ${categories.length} 个`);

  // 获取分类 ID
  const phoneCat = await prisma.category.findUnique({ where: { slug: 'phone-digital' } });
  const computerCat = await prisma.category.findUnique({ where: { slug: 'computer-office' } });
  const homeCat = await prisma.category.findUnique({ where: { slug: 'home-appliance' } });
  const fashionCat = await prisma.category.findUnique({ where: { slug: 'fashion' } });
  const foodCat = await prisma.category.findUnique({ where: { slug: 'food-fresh' } });

  // 创建商品
  const products = [
    { name: 'iPhone 16 Pro Max', description: '256GB 原色钛金属 5G手机', price: 9999, stock: 100, categoryId: phoneCat!.id },
    { name: '华为 Mate 70 Pro', description: '12GB+512GB 昆仑玻璃', price: 6999, stock: 80, categoryId: phoneCat!.id },
    { name: '小米 15 Ultra', description: '16GB+1TB 徕卡光学镜头', price: 6499, stock: 120, categoryId: phoneCat!.id },
    { name: 'AirPods Pro 3', description: '主动降噪 自适应音频', price: 1899, stock: 200, categoryId: phoneCat!.id },
    { name: 'MacBook Pro 14', description: 'M4 Pro芯片 18GB+512GB', price: 14999, stock: 50, categoryId: computerCat!.id },
    { name: 'ThinkPad X1 Carbon', description: 'Ultra 9 32GB+1TB 2.8K屏', price: 12999, stock: 30, categoryId: computerCat!.id },
    { name: 'iPad Pro M4', description: '11英寸 OLED屏 256GB', price: 7499, stock: 60, categoryId: computerCat!.id },
    { name: '索尼 65寸 OLED电视', description: 'A95L系列 XR认知芯片', price: 19999, stock: 15, categoryId: homeCat!.id },
    { name: '戴森 V16 吸尘器', description: '激光探测 智能吸力调节', price: 4999, stock: 45, categoryId: homeCat!.id },
    { name: '格力 变频空调 1.5匹', description: '一级能效 自清洁', price: 3299, stock: 70, categoryId: homeCat!.id },
    { name: 'Nike Air Max 270', description: '经典气垫 休闲运动鞋', price: 899, stock: 150, categoryId: fashionCat!.id },
    { name: '北面 1996羽绒服', description: '700蓬松度 经典复刻', price: 2699, stock: 40, categoryId: fashionCat!.id },
    { name: '三只松鼠 坚果大礼包', description: '每日坚果 30袋装 750g', price: 99, stock: 500, categoryId: foodCat!.id },
    { name: '茅台 飞天53度', description: '500ml 酱香型白酒', price: 1499, stock: 20, categoryId: foodCat!.id },
    { name: '农夫山泉 矿泉水', description: '550ml×24瓶 整箱装', price: 29.9, stock: 999, categoryId: foodCat!.id },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log(`  ✅ Products: ${products.length} 个`);

  console.log('\n🎉 Seed complete!');
  console.log('   管理员: admin@minimall.com / admin123');
  console.log('   用户:   user@minimall.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
