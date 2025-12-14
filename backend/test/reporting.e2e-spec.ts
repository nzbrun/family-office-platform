import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Reporting (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantAId: string;
  let tenantBId: string;
  let adminAToken: string;
  let adminBToken: string;
  let legalEntityAId: string;
  let assetA1Id: string;
  let assetA2Id: string;
  let assetA3Id: string; // Without valuation
  let assetBId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Get tenant IDs
    const tenantA = await prisma.tenant.findUnique({
      where: { slug: 'demo-family-office' },
    });
    const tenantB = await prisma.tenant.findUnique({
      where: { slug: 'demo-family-office-b' },
    });

    if (!tenantA || !tenantB) {
      throw new Error('Tenants not found. Please run seed first: npm run db:seed');
    }

    tenantAId = tenantA.id;
    tenantBId = tenantB.id;
  });

  beforeEach(async () => {
    // Login to get tokens
    const adminALogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@demo.com', password: 'Demo123!' });
    adminAToken = adminALogin.body.access_token;

    const adminBLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin.b@demo.com', password: 'Demo123!' });
    adminBToken = adminBLogin.body.access_token;

    // Create legal entity for tenant A
    const legalEntity = await request(app.getHttpServer())
      .post('/legal-entities')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'Reporting Test Entity',
        type: 'LLC',
        country: 'US',
      })
      .expect(201);
    legalEntityAId = legalEntity.body.id;

    // Create assets for tenant A
    const assetA1 = await request(app.getHttpServer())
      .post('/assets')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'Asset A1 USD',
        type: 'EQUITY',
        currency: 'USD',
        legalEntityId: legalEntityAId,
      })
      .expect(201);
    assetA1Id = assetA1.body.id;

    const assetA2 = await request(app.getHttpServer())
      .post('/assets')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'Asset A2 EUR',
        type: 'BOND',
        currency: 'EUR',
      })
      .expect(201);
    assetA2Id = assetA2.body.id;

    const assetA3 = await request(app.getHttpServer())
      .post('/assets')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        name: 'Asset A3 No Valuation',
        type: 'EQUITY',
        currency: 'USD',
      })
      .expect(201);
    assetA3Id = assetA3.body.id;

    // Create valuations for A1 and A2
    await request(app.getHttpServer())
      .post('/valuations')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        assetId: assetA1Id,
        date: '2024-01-01T00:00:00.000Z',
        value: 100000,
        currency: 'USD',
        source: 'MANUAL',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/valuations')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        assetId: assetA2Id,
        date: '2024-01-01T00:00:00.000Z',
        value: 50000,
        currency: 'EUR',
        source: 'MANUAL',
      })
      .expect(201);

    // Create asset for tenant B
    const assetB = await request(app.getHttpServer())
      .post('/assets')
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({
        name: 'Asset B Tenant B',
        type: 'EQUITY',
        currency: 'USD',
      })
      .expect(201);
    assetBId = assetB.body.id;

    await request(app.getHttpServer())
      .post('/valuations')
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({
        assetId: assetBId,
        date: '2024-01-01T00:00:00.000Z',
        value: 200000,
        currency: 'USD',
        source: 'MANUAL',
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /reporting/assets', () => {
    it('should return assets with latest valuations for tenant A', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/assets')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);

      // All assets should belong to tenant A
      response.body.data.forEach((asset: any) => {
        expect(asset.tenantId).toBe(tenantAId);
      });
    });

    it('should filter by hasValuation=true', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/assets?hasValuation=true')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      response.body.data.forEach((asset: any) => {
        expect(asset.latestValuation).not.toBeNull();
      });
    });

    it('should filter by hasValuation=false', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/assets?hasValuation=false')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      response.body.data.forEach((asset: any) => {
        expect(asset.latestValuation).toBeNull();
      });
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/assets?type=EQUITY')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      response.body.data.forEach((asset: any) => {
        expect(asset.type).toBe('EQUITY');
      });
    });

    it('should filter by currency', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/assets?currency=USD')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      response.body.data.forEach((asset: any) => {
        expect(asset.currency).toBe('USD');
      });
    });

    it('should filter by legalEntityId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reporting/assets?legalEntityId=${legalEntityAId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      response.body.data.forEach((asset: any) => {
        expect(asset.legalEntityId).toBe(legalEntityAId);
      });
    });

    it('admin A should NOT see assets from tenant B', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/assets')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      const tenantBAssets = response.body.data.filter(
        (asset: any) => asset.id === assetBId,
      );
      expect(tenantBAssets).toHaveLength(0);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/assets?page=1&limit=2')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /reporting/summary', () => {
    it('should return correct summary for tenant A', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/summary')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalsByCurrency');
      expect(response.body).toHaveProperty('totalsByAssetType');
      expect(response.body).toHaveProperty('totalsByLegalEntity');
      expect(response.body).toHaveProperty('assetsWithoutValuationCount');
      expect(response.body).toHaveProperty('assetsCount');

      // Check totals by currency
      const usdTotal = response.body.totalsByCurrency.find(
        (t: any) => t.currency === 'USD',
      );
      expect(usdTotal).toBeDefined();
      expect(Number(usdTotal.total)).toBeGreaterThanOrEqual(100000);

      const eurTotal = response.body.totalsByCurrency.find(
        (t: any) => t.currency === 'EUR',
      );
      expect(eurTotal).toBeDefined();
      expect(Number(eurTotal.total)).toBeGreaterThanOrEqual(50000);

      // Check totals by asset type
      const equityTotal = response.body.totalsByAssetType.find(
        (t: any) => t.type === 'EQUITY',
      );
      expect(equityTotal).toBeDefined();

      // Check assets without valuation count
      expect(response.body.assetsWithoutValuationCount).toBeGreaterThanOrEqual(1);
    });

    it('admin A should NOT see summary data from tenant B', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/summary')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      // The summary should only include tenant A data
      // We know tenant B has an asset with 200000 USD valuation
      // So the total should not include that
      const usdTotal = response.body.totalsByCurrency.find(
        (t: any) => t.currency === 'USD',
      );
      // Tenant A has 100000 USD, tenant B has 200000 USD
      // Admin A should only see 100000
      if (usdTotal) {
        expect(Number(usdTotal.total)).toBeLessThan(200000);
      }
    });

    it('should include totalsByLegalEntity for assets with legalEntityId', async () => {
      const response = await request(app.getHttpServer())
        .get('/reporting/summary')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(Array.isArray(response.body.totalsByLegalEntity)).toBe(true);
      const legalEntityTotal = response.body.totalsByLegalEntity.find(
        (t: any) => t.legalEntityId === legalEntityAId,
      );
      expect(legalEntityTotal).toBeDefined();
      expect(legalEntityTotal.name).toBe('Reporting Test Entity');
    });
  });

  describe('Audit Logs for Reporting', () => {
    it('should record READ audit log when accessing /reporting/assets', async () => {
      await request(app.getHttpServer())
        .get('/reporting/assets')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      // Check audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'READ',
          entity: 'Reporting',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].entity).toBe('Reporting');
      expect(logs[0].metadata).toMatchObject({
        endpoint: '/reporting/assets',
      });
    });

    it('should record READ audit log when accessing /reporting/summary', async () => {
      await request(app.getHttpServer())
        .get('/reporting/summary')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      // Check audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'READ',
          entity: 'Reporting',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].metadata).toMatchObject({
        endpoint: '/reporting/summary',
      });
    });
  });
});
