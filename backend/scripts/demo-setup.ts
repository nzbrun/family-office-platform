import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Demo setup script
 * Creates a comprehensive investment dataset for tenant A and tenant B
 * Run with: npm run demo:setup
 */

const DEFAULT_PASSWORD = 'Demo123!';

async function main() {
  console.log('🚀 Starting demo setup...\n');

  // Reset database (this will run seed first, then this script)
  console.log('📦 Database will be reset...\n');

  // Get tenants
  const tenantA = await prisma.tenant.findUnique({
    where: { slug: 'demo-family-office' },
  });
  const tenantB = await prisma.tenant.findUnique({
    where: { slug: 'demo-family-office-b' },
  });

  if (!tenantA || !tenantB) {
    throw new Error('Tenants not found. Please run seed first.');
  }

  console.log('✅ Tenants found\n');

  // Get admin users for each tenant
  const adminA = await prisma.user.findUnique({
    where: { email: 'admin@demo.com' },
  });
  const adminB = await prisma.user.findUnique({
    where: { email: 'admin.b@demo.com' },
  });

  if (!adminA || !adminB) {
    throw new Error('Admin users not found. Please run seed first.');
  }

  // Create legal entities
  console.log('🏢 Creating legal entities...');
  
  const legalEntityA1 = await prisma.legalEntity.upsert({
    where: { id: 'demo-legal-entity-a1' },
    update: {},
    create: {
      id: 'demo-legal-entity-a1',
      tenantId: tenantA.id,
      name: 'Tech Holdings LLC',
      type: 'LLC',
      country: 'US',
    },
  });

  const legalEntityA2 = await prisma.legalEntity.upsert({
    where: { id: 'demo-legal-entity-a2' },
    update: {},
    create: {
      id: 'demo-legal-entity-a2',
      tenantId: tenantA.id,
      name: 'Real Estate Trust',
      type: 'TRUST',
      country: 'US',
    },
  });

  const legalEntityB1 = await prisma.legalEntity.upsert({
    where: { id: 'demo-legal-entity-b1' },
    update: {},
    create: {
      id: 'demo-legal-entity-b1',
      tenantId: tenantB.id,
      name: 'Investment Corp B',
      type: 'CORPORATION',
      country: 'CA',
    },
  });

  console.log('✅ Legal entities created\n');

  // Create assets for Tenant A
  console.log('💼 Creating assets for Tenant A...');
  
  const assetsA = [
    {
      id: 'demo-asset-a1',
      tenantId: tenantA.id,
      name: 'Apple Inc. Stock',
      type: 'EQUITY',
      currency: 'USD',
      legalEntityId: legalEntityA1.id,
      metadata: { ticker: 'AAPL', exchange: 'NASDAQ', sector: 'Technology' },
    },
    {
      id: 'demo-asset-a2',
      tenantId: tenantA.id,
      name: 'Microsoft Corporation',
      type: 'EQUITY',
      currency: 'USD',
      legalEntityId: legalEntityA1.id,
      metadata: { ticker: 'MSFT', exchange: 'NASDAQ', sector: 'Technology' },
    },
    {
      id: 'demo-asset-a3',
      tenantId: tenantA.id,
      name: 'US Treasury Bond 10Y',
      type: 'BOND',
      currency: 'USD',
      legalEntityId: legalEntityA2.id,
      metadata: { maturity: '2034-01-15', coupon: 4.5 },
    },
    {
      id: 'demo-asset-a4',
      tenantId: tenantA.id,
      name: 'Gold ETF',
      type: 'COMMODITY',
      currency: 'USD',
      metadata: { ticker: 'GLD', assetClass: 'Precious Metals' },
    },
    {
      id: 'demo-asset-a5',
      tenantId: tenantA.id,
      name: 'Bitcoin',
      type: 'CRYPTO',
      currency: 'USD',
      metadata: { symbol: 'BTC', blockchain: 'Bitcoin' },
    },
    {
      id: 'demo-asset-a6',
      tenantId: tenantA.id,
      name: 'Commercial Property NYC',
      type: 'REAL_ESTATE',
      currency: 'USD',
      legalEntityId: legalEntityA2.id,
      metadata: { location: 'New York, NY', propertyType: 'Commercial' },
    },
    {
      id: 'demo-asset-a7',
      tenantId: tenantA.id,
      name: 'Tesla Inc. Stock',
      type: 'EQUITY',
      currency: 'USD',
      metadata: { ticker: 'TSLA', exchange: 'NASDAQ', sector: 'Automotive' },
    },
    {
      id: 'demo-asset-a8',
      tenantId: tenantA.id,
      name: 'European Stock Fund',
      type: 'FUND',
      currency: 'EUR',
      metadata: { fundType: 'Mutual Fund', region: 'Europe' },
    },
    // Assets without valuation (for reporting tests)
    {
      id: 'demo-asset-a9',
      tenantId: tenantA.id,
      name: 'Pending Investment',
      type: 'EQUITY',
      currency: 'USD',
      metadata: { status: 'pending' },
    },
    {
      id: 'demo-asset-a10',
      tenantId: tenantA.id,
      name: 'New Acquisition',
      type: 'REAL_ESTATE',
      currency: 'USD',
      metadata: { status: 'under_review' },
    },
  ];

  for (const assetData of assetsA) {
    await prisma.asset.upsert({
      where: { id: assetData.id },
      update: {},
      create: assetData,
    });
  }

  console.log(`✅ Created ${assetsA.length} assets for Tenant A\n`);

  // Create assets for Tenant B
  console.log('💼 Creating assets for Tenant B...');
  
  const assetsB = [
    {
      id: 'demo-asset-b1',
      tenantId: tenantB.id,
      name: 'Amazon.com Inc.',
      type: 'EQUITY',
      currency: 'USD',
      legalEntityId: legalEntityB1.id,
      metadata: { ticker: 'AMZN', exchange: 'NASDAQ', sector: 'E-commerce' },
    },
    {
      id: 'demo-asset-b2',
      tenantId: tenantB.id,
      name: 'Google LLC',
      type: 'EQUITY',
      currency: 'USD',
      legalEntityId: legalEntityB1.id,
      metadata: { ticker: 'GOOGL', exchange: 'NASDAQ', sector: 'Technology' },
    },
    {
      id: 'demo-asset-b3',
      tenantId: tenantB.id,
      name: 'Canadian Government Bond',
      type: 'BOND',
      currency: 'CAD',
      metadata: { maturity: '2035-06-01', coupon: 3.75 },
    },
    {
      id: 'demo-asset-b4',
      tenantId: tenantB.id,
      name: 'Silver ETF',
      type: 'COMMODITY',
      currency: 'USD',
      metadata: { ticker: 'SLV', assetClass: 'Precious Metals' },
    },
    {
      id: 'demo-asset-b5',
      tenantId: tenantB.id,
      name: 'Ethereum',
      type: 'CRYPTO',
      currency: 'USD',
      metadata: { symbol: 'ETH', blockchain: 'Ethereum' },
    },
    {
      id: 'demo-asset-b6',
      tenantId: tenantB.id,
      name: 'Residential Property Toronto',
      type: 'REAL_ESTATE',
      currency: 'CAD',
      legalEntityId: legalEntityB1.id,
      metadata: { location: 'Toronto, ON', propertyType: 'Residential' },
    },
    {
      id: 'demo-asset-b7',
      tenantId: tenantB.id,
      name: 'NVIDIA Corporation',
      type: 'EQUITY',
      currency: 'USD',
      metadata: { ticker: 'NVDA', exchange: 'NASDAQ', sector: 'Semiconductors' },
    },
    // Assets without valuation
    {
      id: 'demo-asset-b8',
      tenantId: tenantB.id,
      name: 'Future Investment',
      type: 'EQUITY',
      currency: 'USD',
      metadata: { status: 'planned' },
    },
  ];

  for (const assetData of assetsB) {
    await prisma.asset.upsert({
      where: { id: assetData.id },
      update: {},
      create: assetData,
    });
  }

  console.log(`✅ Created ${assetsB.length} assets for Tenant B\n`);

  // Create valuations for Tenant A assets (with different dates)
  console.log('📊 Creating valuations for Tenant A...');
  
  const valuationsA = [
    // Asset A1 - Multiple valuations
    {
      assetId: 'demo-asset-a1',
      tenantId: tenantA.id,
      date: new Date('2024-01-01'),
      value: 150000,
      currency: 'USD',
      source: 'MANUAL',
      notes: 'Q1 2024 valuation',
    },
    {
      assetId: 'demo-asset-a1',
      tenantId: tenantA.id,
      date: new Date('2024-02-01'),
      value: 155000,
      currency: 'USD',
      source: 'MANUAL',
      notes: 'Q1 2024 update',
    },
    {
      assetId: 'demo-asset-a1',
      tenantId: tenantA.id,
      date: new Date('2024-03-01'),
      value: 160000,
      currency: 'USD',
      source: 'MANUAL',
      notes: 'Latest valuation',
    },
    // Asset A2
    {
      assetId: 'demo-asset-a2',
      tenantId: tenantA.id,
      date: new Date('2024-01-15'),
      value: 200000,
      currency: 'USD',
      source: 'MANUAL',
    },
    {
      assetId: 'demo-asset-a2',
      tenantId: tenantA.id,
      date: new Date('2024-03-15'),
      value: 210000,
      currency: 'USD',
      source: 'MANUAL',
    },
    // Asset A3 (Bond)
    {
      assetId: 'demo-asset-a3',
      tenantId: tenantA.id,
      date: new Date('2024-01-01'),
      value: 500000,
      currency: 'USD',
      source: 'MANUAL',
    },
    {
      assetId: 'demo-asset-a3',
      tenantId: tenantA.id,
      date: new Date('2024-02-01'),
      value: 502000,
      currency: 'USD',
      source: 'MANUAL',
    },
    // Asset A4 (Gold)
    {
      assetId: 'demo-asset-a4',
      tenantId: tenantA.id,
      date: new Date('2024-01-10'),
      value: 75000,
      currency: 'USD',
      source: 'MARKET',
    },
    {
      assetId: 'demo-asset-a4',
      tenantId: tenantA.id,
      date: new Date('2024-03-10'),
      value: 78000,
      currency: 'USD',
      source: 'MARKET',
    },
    // Asset A5 (Crypto)
    {
      assetId: 'demo-asset-a5',
      tenantId: tenantA.id,
      date: new Date('2024-01-05'),
      value: 100000,
      currency: 'USD',
      source: 'EXCHANGE',
    },
    {
      assetId: 'demo-asset-a5',
      tenantId: tenantA.id,
      date: new Date('2024-02-05'),
      value: 95000,
      currency: 'USD',
      source: 'EXCHANGE',
    },
    {
      assetId: 'demo-asset-a5',
      tenantId: tenantA.id,
      date: new Date('2024-03-05'),
      value: 110000,
      currency: 'USD',
      source: 'EXCHANGE',
    },
    // Asset A6 (Real Estate)
    {
      assetId: 'demo-asset-a6',
      tenantId: tenantA.id,
      date: new Date('2024-01-01'),
      value: 2500000,
      currency: 'USD',
      source: 'APPRAISAL',
    },
    // Asset A7
    {
      assetId: 'demo-asset-a7',
      tenantId: tenantA.id,
      date: new Date('2024-02-20'),
      value: 120000,
      currency: 'USD',
      source: 'MANUAL',
    },
    // Asset A8 (EUR)
    {
      assetId: 'demo-asset-a8',
      tenantId: tenantA.id,
      date: new Date('2024-01-01'),
      value: 80000,
      currency: 'EUR',
      source: 'MANUAL',
    },
    {
      assetId: 'demo-asset-a8',
      tenantId: tenantA.id,
      date: new Date('2024-03-01'),
      value: 82000,
      currency: 'EUR',
      source: 'MANUAL',
    },
  ];

  for (const valuationData of valuationsA) {
    await prisma.valuation.upsert({
      where: {
        tenantId_assetId_date: {
          tenantId: valuationData.tenantId,
          assetId: valuationData.assetId,
          date: valuationData.date,
        },
      },
      update: {},
      create: valuationData,
    });
  }

  console.log(`✅ Created ${valuationsA.length} valuations for Tenant A\n`);

  // Create valuations for Tenant B
  console.log('📊 Creating valuations for Tenant B...');
  
  const valuationsB = [
    {
      assetId: 'demo-asset-b1',
      tenantId: tenantB.id,
      date: new Date('2024-01-01'),
      value: 180000,
      currency: 'USD',
      source: 'MANUAL',
    },
    {
      assetId: 'demo-asset-b1',
      tenantId: tenantB.id,
      date: new Date('2024-03-01'),
      value: 185000,
      currency: 'USD',
      source: 'MANUAL',
    },
    {
      assetId: 'demo-asset-b2',
      tenantId: tenantB.id,
      date: new Date('2024-01-15'),
      value: 220000,
      currency: 'USD',
      source: 'MANUAL',
    },
    {
      assetId: 'demo-asset-b3',
      tenantId: tenantB.id,
      date: new Date('2024-01-01'),
      value: 300000,
      currency: 'CAD',
      source: 'MANUAL',
    },
    {
      assetId: 'demo-asset-b4',
      tenantId: tenantB.id,
      date: new Date('2024-02-01'),
      value: 45000,
      currency: 'USD',
      source: 'MARKET',
    },
    {
      assetId: 'demo-asset-b5',
      tenantId: tenantB.id,
      date: new Date('2024-01-10'),
      value: 80000,
      currency: 'USD',
      source: 'EXCHANGE',
    },
    {
      assetId: 'demo-asset-b5',
      tenantId: tenantB.id,
      date: new Date('2024-03-10'),
      value: 85000,
      currency: 'USD',
      source: 'EXCHANGE',
    },
    {
      assetId: 'demo-asset-b6',
      tenantId: tenantB.id,
      date: new Date('2024-01-01'),
      value: 1200000,
      currency: 'CAD',
      source: 'APPRAISAL',
    },
    {
      assetId: 'demo-asset-b7',
      tenantId: tenantB.id,
      date: new Date('2024-02-15'),
      value: 150000,
      currency: 'USD',
      source: 'MANUAL',
    },
  ];

  for (const valuationData of valuationsB) {
    await prisma.valuation.upsert({
      where: {
        tenantId_assetId_date: {
          tenantId: valuationData.tenantId,
          assetId: valuationData.assetId,
          date: valuationData.date,
        },
      },
      update: {},
      create: valuationData,
    });
  }

  console.log(`✅ Created ${valuationsB.length} valuations for Tenant B\n`);

  console.log('📋 Demo Dataset Summary:');
  console.log('======================');
  console.log(`Tenant A: ${tenantA.name}`);
  console.log(`  - Legal Entities: 2`);
  console.log(`  - Assets: ${assetsA.length} (${assetsA.filter(a => !a.id.includes('a9') && !a.id.includes('a10')).length} with valuations, 2 without)`);
  console.log(`  - Valuations: ${valuationsA.length}`);
  console.log(`\nTenant B: ${tenantB.name}`);
  console.log(`  - Legal Entities: 1`);
  console.log(`  - Assets: ${assetsB.length} (${assetsB.filter(a => !a.id.includes('b8')).length} with valuations, 1 without)`);
  console.log(`  - Valuations: ${valuationsB.length}`);
  console.log('\n✨ Demo setup completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('  Tenant A Admin: admin@demo.com / Demo123!');
  console.log('  Tenant B Admin: admin.b@demo.com / Demo123!');
  console.log('  User: user@demo.com / Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during demo setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
