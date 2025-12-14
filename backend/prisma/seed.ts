import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed script for local/development environment
 * 
 * Creates:
 * - Tenant A: "Demo Family Office" (slug: demo-family-office)
 *   - SUPER_ADMIN user: superadmin@demo.com
 *   - ADMIN user: admin@demo.com
 *   - USER user: user@demo.com
 * - Tenant B: "Demo Family Office B" (slug: demo-family-office-b)
 *   - ADMIN user: admin.b@demo.com
 * 
 * Default passwords (for demo purposes):
 * - All users: Demo123!
 */

const DEFAULT_PASSWORD = 'Demo123!';

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password once for all users
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Create demo tenant A
  const tenantA = await prisma.tenant.upsert({
    where: { slug: 'demo-family-office' },
    update: {},
    create: {
      name: 'Demo Family Office',
      slug: 'demo-family-office',
      isActive: true,
    },
  });

  console.log('✅ Tenant A created:', tenantA.name);

  // Create demo tenant B
  const tenantB = await prisma.tenant.upsert({
    where: { slug: 'demo-family-office-b' },
    update: {},
    create: {
      name: 'Demo Family Office B',
      slug: 'demo-family-office-b',
      isActive: true,
    },
  });

  console.log('✅ Tenant B created:', tenantB.name);

  // Create SUPER_ADMIN user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@demo.com' },
    update: {},
    create: {
      email: 'superadmin@demo.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  console.log('✅ SUPER_ADMIN created:', superAdmin.email);

  // Create ADMIN user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  console.log('✅ ADMIN created:', admin.email);

  // Create USER user
  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: Role.USER,
      tenantId: tenantA.id,
      isActive: true,
    },
  });

  console.log('✅ USER created:', user.email);

  // Create ADMIN user for tenant B
  const adminB = await prisma.user.upsert({
    where: { email: 'admin.b@demo.com' },
    update: {},
    create: {
      email: 'admin.b@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Tenant B',
      role: Role.ADMIN,
      tenantId: tenantB.id,
      isActive: true,
    },
  });

  console.log('✅ ADMIN (Tenant B) created:', adminB.email);

  console.log('\n📋 Seed Summary:');
  console.log('================');
  console.log(`\nTenant A: ${tenantA.name} (${tenantA.slug})`);
  console.log(`  - ${superAdmin.email} (${superAdmin.role})`);
  console.log(`  - ${admin.email} (${admin.role})`);
  console.log(`  - ${user.email} (${user.role})`);
  console.log(`\nTenant B: ${tenantB.name} (${tenantB.slug})`);
  console.log(`  - ${adminB.email} (${adminB.role})`);
  console.log(`\n🔑 Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
