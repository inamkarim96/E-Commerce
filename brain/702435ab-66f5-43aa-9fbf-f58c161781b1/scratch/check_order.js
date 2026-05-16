const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = '8fab1b3d-d1d3-406c-be33-d5be34bc6e76';
  const items = await prisma.order_items.findMany({
    where: { order_id: orderId }
  });

  console.log('Order Items:', JSON.stringify(items, null, 2));

  for (const item of items) {
    const p = await prisma.products.findUnique({ where: { id: item.product_id } });
    console.log(`Product ${item.product_id}:`, p ? 'FOUND' : 'NOT FOUND');
    if (item.variant_id) {
      const v = await prisma.weight_variants.findUnique({ where: { id: item.variant_id } });
      console.log(`Variant ${item.variant_id}:`, v ? 'FOUND' : 'NOT FOUND');
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
