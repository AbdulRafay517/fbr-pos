import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateBranchDto } from './dto/create-branch.dto';

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
} 