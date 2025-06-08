import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateBranchDto } from '../branches/dto/create-branch.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    const existingClient = await this.prisma.client.findFirst({
      where: {
        name: createClientDto.name,
        type: createClientDto.type,
      },
    });

    if (existingClient) {
      throw new ConflictException('Client with this name and type already exists');
    }

    return this.prisma.client.create({
      data: createClientDto,
      include: {
        branches: true,
      },
    });
  }

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        branches: true,
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        branches: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async createBranch(createBranchDto: CreateBranchDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: createBranchDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const existingBranch = await this.prisma.branch.findFirst({
      where: {
        name: createBranchDto.name,
        clientId: createBranchDto.clientId,
      },
    });

    if (existingBranch) {
      throw new ConflictException('Branch with this name already exists for this client');
    }

    return this.prisma.branch.create({
      data: createBranchDto,
      include: {
        client: true,
      },
    });
  }

  async findBranches(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        branches: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client.branches;
  }

  async update(id: string, updateClientDto: Partial<CreateClientDto>) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Check for conflicts if name or type is being updated
    if (updateClientDto.name || updateClientDto.type) {
      const existingClient = await this.prisma.client.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { name: updateClientDto.name || client.name },
            { type: updateClientDto.type || client.type },
          ],
        },
      });

      if (existingClient) {
        throw new ConflictException('Client with this name and type already exists');
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
      include: {
        branches: true,
      },
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        branches: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Delete all branches first, then client
    await this.prisma.branch.deleteMany({
      where: { clientId: id },
    });

    return this.prisma.client.delete({
      where: { id },
    });
  }

  async updateBranch(clientId: string, branchId: string, updateBranchDto: Partial<CreateBranchDto>) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        clientId: clientId,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check for conflicts if name is being updated
    if (updateBranchDto.name) {
      const existingBranch = await this.prisma.branch.findFirst({
        where: {
          AND: [
            { id: { not: branchId } },
            { name: updateBranchDto.name },
            { clientId: clientId },
          ],
        },
      });

      if (existingBranch) {
        throw new ConflictException('Branch with this name already exists for this client');
      }
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: updateBranchDto,
      include: {
        client: true,
      },
    });
  }

  async removeBranch(clientId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        clientId: clientId,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.branch.delete({
      where: { id: branchId },
    });
  }
} 