import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Investments Domain (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantAId: string;
  let tenantBId: string;
  let adminAToken: string;
  let adminBToken: string;
  let legalEntityAId: string;
  let assetAId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Legal Entities', () => {
    it('admin A should create a legal entity', async () => {
      const response = await request(app.getHttpServer())
        .post('/legal-entities')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Test Holdings LLC',
          type: 'LLC',
          country: 'US',
        })
        .expect(201);

      expect(response.body.name).toBe('Test Holdings LLC');
      expect(response.body.tenantId).toBe(tenantAId);
      legalEntityAId = response.body.id;
    });

    it('admin A should list legal entities from their tenant only', async () => {
      const response = await request(app.getHttpServer())
        .get('/legal-entities')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((entity: any) => {
        expect(entity.tenantId).toBe(tenantAId);
      });
    });

    it('admin A should NOT access legal entity from tenant B (403)', async () => {
      // Create entity in tenant B
      const entityB = await request(app.getHttpServer())
        .post('/legal-entities')
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          name: 'Tenant B Holdings',
          type: 'LLC',
          country: 'US',
        })
        .expect(201);

      // Try to access from tenant A
      await request(app.getHttpServer())
        .get(`/legal-entities/${entityB.body.id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(403);
    });
  });

  describe('Assets', () => {
    it('admin A should create an asset', async () => {
      const response = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Apple Inc. Stock',
          type: 'EQUITY',
          currency: 'USD',
          legalEntityId: legalEntityAId,
          metadata: { ticker: 'AAPL', exchange: 'NASDAQ' },
        })
        .expect(201);

      expect(response.body.name).toBe('Apple Inc. Stock');
      expect(response.body.tenantId).toBe(tenantAId);
      expect(response.body.legalEntityId).toBe(legalEntityAId);
      assetAId = response.body.id;
    });

    it('admin A should list assets from their tenant only', async () => {
      const response = await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((asset: any) => {
        expect(asset.tenantId).toBe(tenantAId);
      });
    });

    it('admin A should NOT access asset from tenant B (403)', async () => {
      // Create asset in tenant B
      const assetB = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          name: 'Tenant B Asset',
          type: 'EQUITY',
          currency: 'USD',
        })
        .expect(201);

      // Try to access from tenant A
      await request(app.getHttpServer())
        .get(`/assets/${assetB.body.id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(403);
    });

    it('admin A should filter assets by legalEntityId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/assets?legalEntityId=${legalEntityAId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((asset: any) => {
        expect(asset.legalEntityId).toBe(legalEntityAId);
      });
    });
  });

  describe('Valuations', () => {
    it('admin A should create a valuation for an asset', async () => {
      const response = await request(app.getHttpServer())
        .post('/valuations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          assetId: assetAId,
          date: '2024-01-01T00:00:00.000Z',
          value: 150000.50,
          currency: 'USD',
          source: 'MANUAL',
          notes: 'Based on market price',
        })
        .expect(201);

      expect(response.body.assetId).toBe(assetAId);
      expect(response.body.value).toBe('150000.50');
      expect(response.body.tenantId).toBe(tenantAId);
    });

    it('admin A should list valuations from their tenant only', async () => {
      const response = await request(app.getHttpServer())
        .get('/valuations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((valuation: any) => {
        expect(valuation.tenantId).toBe(tenantAId);
      });
    });

    it('admin A should filter valuations by assetId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/valuations?assetId=${assetAId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((valuation: any) => {
        expect(valuation.assetId).toBe(assetAId));
      });
    });

    it('admin A should NOT create valuation for asset from tenant B (403)', async () => {
      // Create asset in tenant B
      const assetB = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          name: 'Tenant B Asset',
          type: 'EQUITY',
          currency: 'USD',
        })
        .expect(201);

      // Try to create valuation from tenant A
      await request(app.getHttpServer())
        .post('/valuations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          assetId: assetB.body.id,
          date: '2024-01-01T00:00:00.000Z',
          value: 100000,
          currency: 'USD',
          source: 'MANUAL',
        })
        .expect(403);
    });
  });

  describe('Audit Logs for Investments', () => {
    it('should record CREATE audit log when creating legal entity', async () => {
      const legalEntity = await request(app.getHttpServer())
        .post('/legal-entities')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Audit Test Entity',
          type: 'LLC',
          country: 'US',
        })
        .expect(201);

      // Check audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'CREATE',
          entity: 'LegalEntity',
          entityId: legalEntity.body.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].entity).toBe('LegalEntity');
    });

    it('should record CREATE audit log when creating asset', async () => {
      const asset = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Audit Test Asset',
          type: 'EQUITY',
          currency: 'USD',
        })
        .expect(201);

      // Check audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'CREATE',
          entity: 'Asset',
          entityId: asset.body.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].entity).toBe('Asset');
    });

    it('should record CREATE audit log when creating valuation', async () => {
      const valuation = await request(app.getHttpServer())
        .post('/valuations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          assetId: assetAId,
          date: '2024-01-02T00:00:00.000Z',
          value: 200000,
          currency: 'USD',
          source: 'MANUAL',
        })
        .expect(201);

      // Check audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'CREATE',
          entity: 'Valuation',
          entityId: valuation.body.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].entity).toBe('Valuation');
    });
  });
});
