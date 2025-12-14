import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed script for local/development environment
 * 
 * Creates:
 * - Demo tenant: "Demo Family Office"
 * - SUPER_ADMIN user: superadmin@demo.com
 * - ADMIN user: admin@demo.com
 * - USER user: user@demo.com
 * 
 * Default passwords (for demo purposes):
 * - All users: Demo123!
 */

const DEFAULT_PASSWORD = 'Demo123!';

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password once for all users
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-family-office' },
    update: {},
    create: {
      name: 'Demo Family Office',
      slug: 'demo-family-office',
      isActive: true,
    },
  });

  console.log('✅ Tenant created:', tenant.name);

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
      tenantId: tenant.id,
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
      tenantId: tenant.id,
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
      tenantId: tenant.id,
      isActive: true,
    },
  });

  console.log('✅ USER created:', user.email);

  console.log('\n📋 Seed Summary:');
  console.log('================');
  console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`\nUsers created:`);
  console.log(`  - ${superAdmin.email} (${superAdmin.role})`);
  console.log(`  - ${admin.email} (${admin.role})`);
  console.log(`  - ${user.email} (${user.role})`);
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
