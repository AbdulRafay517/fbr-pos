import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) throw new NotFoundException('Client not found');
    const existing = await this.prisma.branch.findFirst({ where: { name: dto.name, clientId: dto.clientId } });
    if (existing) throw new ConflictException('Branch with this name already exists for this client');
    return this.prisma.branch.create({ data: dto, include: { client: true } });
  }

  async findAll() {
    return this.prisma.branch.findMany({ include: { client: true } });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id }, include: { client: true } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    await this.prisma.branch.delete({ where: { id } });
    return { message: 'Branch deleted' };
  }
} 