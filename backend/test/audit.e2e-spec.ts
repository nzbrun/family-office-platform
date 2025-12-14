import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Audit Logs (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantAId: string;
  let tenantBId: string;
  let adminAToken: string;
  let adminBToken: string;
  let superAdminToken: string;
  let userAId: string;

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

    // Get user ID
    const userA = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
    });

    if (!userA) {
      throw new Error('User not found. Please run seed first: npm run db:seed');
    }

    userAId = userA.id;
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

    const superAdminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'superadmin@demo.com', password: 'Demo123!' });
    superAdminToken = superAdminLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Audit Log Recording', () => {
    it('should record LOGIN event on successful login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: 'Demo123!' })
        .expect(200);

      // Check audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'LOGIN',
          actorUserId: userAId,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('LOGIN');
      expect(logs[0].entity).toBe('User');
      expect(logs[0].metadata).toMatchObject({ success: true });
    });

    it('should record CREATE event when creating a user', async () => {
      const newUser = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          tenantId: tenantAId,
          role: 'USER',
        })
        .expect(201);

      // Check audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'CREATE',
          entity: 'User',
          entityId: newUser.body.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('CREATE');
      expect(logs[0].entity).toBe('User');
      expect(logs[0].tenantId).toBe(tenantAId);
    });
  });

  describe('Audit Log Access - Multi-Tenant', () => {
    it('ADMIN should only see audit logs from their tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      // All logs should be from tenant A
      response.body.data.forEach((log: any) => {
        if (log.tenantId) {
          expect(log.tenantId).toBe(tenantAId);
        }
      });
    });

    it('ADMIN should NOT see audit logs from another tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      // Should not contain logs from tenant B
      const tenantBLogs = response.body.data.filter(
        (log: any) => log.tenantId === tenantBId,
      );
      expect(tenantBLogs).toHaveLength(0);
    });

    it('SUPER_ADMIN should see all audit logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('SUPER_ADMIN should filter by tenantId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/audit-logs?tenantId=${tenantAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      response.body.data.forEach((log: any) => {
        if (log.tenantId) {
          expect(log.tenantId).toBe(tenantAId);
        }
      });
    });
  });

  describe('Audit Log Filtering', () => {
    it('should filter by action', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs?action=LOGIN')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      response.body.data.forEach((log: any) => {
        expect(log.action).toBe('LOGIN');
      });
    });

    it('should filter by entity', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs?entity=User')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      response.body.data.forEach((log: any) => {
        expect(log.entity).toBe('User');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Access Control', () => {
    let userToken: string;

    beforeAll(async () => {
      const userLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@demo.com', password: 'Demo123!' });
      userToken = userLogin.body.access_token;
    });

    it('USER should NOT access audit logs (403)', async () => {
      await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
