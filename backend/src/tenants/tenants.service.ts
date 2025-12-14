import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: createTenantDto,
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
