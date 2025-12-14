import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Multi-Tenancy (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tenantAId: string;
  let tenantBId: string;
  let adminAToken: string;
  let adminBToken: string;
  let superAdminToken: string;
  let userAId: string;
  let userBId: string;

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

    // Get tenant IDs from seed
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

    // Get user IDs
    const userA = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
    });
    const userB = await prisma.user.findUnique({
      where: { email: 'admin.b@demo.com' },
    });

    if (!userA || !userB) {
      throw new Error('Users not found. Please run seed first: npm run db:seed');
    }

    userAId = userA.id;
    userBId = userB.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should login admin@demo.com (tenant A)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'Demo123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.tenantId).toBe(tenantAId);
      expect(response.body.user.role).toBe('ADMIN');
      adminAToken = response.body.access_token;
    });

    it('should login admin.b@demo.com (tenant B)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin.b@demo.com',
          password: 'Demo123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.tenantId).toBe(tenantBId);
      expect(response.body.user.role).toBe('ADMIN');
      adminBToken = response.body.access_token;
    });

    it('should login superadmin@demo.com', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'superadmin@demo.com',
          password: 'Demo123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.role).toBe('SUPER_ADMIN');
      expect(response.body.user.tenantId).toBe(tenantAId); // SUPER_ADMIN has tenantId but can access all
      superAdminToken = response.body.access_token;
    });
  });

  describe('Tenant Isolation - Users', () => {
    it('admin A should list users from tenant A only', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // All users should belong to tenant A
      response.body.forEach((user: any) => {
        expect(user.tenantId).toBe(tenantAId);
      });
    });

    it('admin A should NOT see users from tenant B', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      const tenantBUsers = response.body.filter(
        (user: any) => user.tenantId === tenantBId,
      );
      expect(tenantBUsers).toHaveLength(0);
    });

    it('admin A should NOT access user from tenant B (403)', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userBId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(403);
    });

    it('admin B should list users from tenant B only', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminBToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((user: any) => {
        expect(user.tenantId).toBe(tenantBId);
      });
    });

    it('admin B should NOT access user from tenant A (403)', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userAId}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .expect(403);
    });

    it('admin A should NOT create user in tenant B (403)', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          email: 'newuser@tenantb.com',
          password: 'Password123!',
          tenantId: tenantBId,
          role: 'USER',
        })
        .expect(403);
    });
  });

  describe('Tenant Isolation - Tenants', () => {
    it('admin A should access their own tenant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenants/${tenantAId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(response.body.id).toBe(tenantAId);
    });

    it('admin A should NOT access tenant B (403)', async () => {
      await request(app.getHttpServer())
        .get(`/tenants/${tenantBId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(403);
    });

    it('admin A should NOT list tenants (403)', async () => {
      await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(403);
    });
  });

  describe('SUPER_ADMIN Cross-Tenant Access', () => {
    it('SUPER_ADMIN should list all tenants', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('SUPER_ADMIN should access tenant A', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenants/${tenantAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.id).toBe(tenantAId);
    });

    it('SUPER_ADMIN should access tenant B', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenants/${tenantBId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.id).toBe(tenantBId);
    });

    it('SUPER_ADMIN should list users from tenant A with X-Tenant-Id header', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('X-Tenant-Id', tenantAId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((user: any) => {
        expect(user.tenantId).toBe(tenantAId);
      });
    });

    it('SUPER_ADMIN should list users from tenant B with X-Tenant-Id header', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('X-Tenant-Id', tenantBId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((user: any) => {
        expect(user.tenantId).toBe(tenantBId);
      });
    });

    it('SUPER_ADMIN should list users from tenant A with query param', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users?tenantId=${tenantAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((user: any) => {
        expect(user.tenantId).toBe(tenantAId);
      });
    });

    it('SUPER_ADMIN should access user from tenant A', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${userAId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.id).toBe(userAId);
      expect(response.body.tenantId).toBe(tenantAId);
    });

    it('SUPER_ADMIN should access user from tenant B', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${userBId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.id).toBe(userBId);
      expect(response.body.tenantId).toBe(tenantBId);
    });
  });

  describe('USER Role Restrictions', () => {
    let userToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@demo.com',
          password: 'Demo123!',
        })
        .expect(200);

      userToken = response.body.access_token;
    });

    it('USER should access /users/me', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.email).toBe('user@demo.com');
    });

    it('USER should NOT list users (403)', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
