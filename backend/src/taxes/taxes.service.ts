import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';

@Injectable()
export class TaxesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaxRuleDto) {
    return this.prisma.taxRule.create({ data: dto });
  }

  async findAll() {
    return this.prisma.taxRule.findMany();
  }

  async findOne(id: string) {
    const rule = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Tax rule not found');
    return rule;
  }

  async update(id: string, dto: UpdateTaxRuleDto) {
    const rule = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Tax rule not found');
    return this.prisma.taxRule.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const rule = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Tax rule not found');
    await this.prisma.taxRule.delete({ where: { id } });
    return { message: 'Tax rule deleted' };
  }
} 