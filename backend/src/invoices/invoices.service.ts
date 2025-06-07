import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { PdfService } from './pdf.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId: string) {
    // Verify client and branch exist
    const client = await this.prisma.client.findUnique({
      where: { id: createInvoiceDto.clientId },
      include: {
        branches: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const branch = client.branches.find(b => b.id === createInvoiceDto.branchId);
    if (!branch) {
      throw new NotFoundException('Branch not found for this client');
    }

    // Get tax rule for the branch's province
    const taxRule = await this.prisma.taxRule.findUnique({
      where: { province: branch.province },
    });

    if (!taxRule) {
      throw new NotFoundException(`Tax rule not found for province: ${branch.province}`);
    }

    // Calculate totals
    const subtotal = createInvoiceDto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxAmount = subtotal * (taxRule.percentage / 100);
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number (you might want to make this more sophisticated)
    const invoiceNumber = `INV-${Date.now()}`;

    // Parse dates
    const invoiceDate = createInvoiceDto.date ? new Date(createInvoiceDto.date) : new Date();
    const dueDate = createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : null;

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        date: invoiceDate,
        dueDate,
        subtotal,
        taxAmount,
        totalAmount,
        clientId: createInvoiceDto.clientId,
        branchId: createInvoiceDto.branchId,
        createdById: userId,
        items: {
          create: createInvoiceDto.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
        statusHistory: {
          create: {
            status: 'UNPAID',
            changedBy: userId,
            reason: 'Invoice created',
          },
        },
      },
      include: {
        client: true,
        branch: true,
        createdBy: true,
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return invoice;
  }

  async findAll(query: QueryInvoiceDto) {
    const { page = 1, limit = 10, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.InvoiceWhereInput = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { branch: { name: { contains: search, mode: 'insensitive' } } },
        { items: { some: { description: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await this.prisma.invoice.count({ where });

    // Get paginated results
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        branch: true,
        createdBy: true,
        items: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        branch: true,
        createdBy: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async findByClient(clientId: string, query: QueryInvoiceDto) {
    const { page = 1, limit = 10, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.InvoiceWhereInput = {
      clientId,
    };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { branch: { name: { contains: search, mode: 'insensitive' } } },
        { items: { some: { description: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await this.prisma.invoice.count({ where });

    // Get paginated results
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        branch: true,
        createdBy: true,
        items: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async generatePdf(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        branch: true,
        createdBy: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);

    // Update the invoice with the PDF URL
    await this.prisma.invoice.update({
      where: { id },
      data: {
        pdfUrl: `/invoices/${id}/pdf`,
      },
    });

    return pdfBuffer;
  }

  async findByBranch(branchId: string, query: QueryInvoiceDto) {
    const { page = 1, limit = 10, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.InvoiceWhereInput = {
      branchId,
    };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { items: { some: { description: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await this.prisma.invoice.count({ where });

    // Get paginated results
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        branch: true,
        createdBy: true,
        items: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // If client or branch is being updated, verify they exist
    if (updateInvoiceDto.clientId || updateInvoiceDto.branchId) {
      const client = await this.prisma.client.findUnique({
        where: { id: updateInvoiceDto.clientId || invoice.clientId },
        include: {
          branches: true,
        },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      const branchId = updateInvoiceDto.branchId || invoice.branchId;
      const branch = client.branches.find(b => b.id === branchId);
      if (!branch) {
        throw new NotFoundException('Branch not found for this client');
      }
    }

    // If items are being updated, recalculate totals
    let subtotal = invoice.subtotal;
    let taxAmount = invoice.taxAmount;
    let totalAmount = invoice.totalAmount;

    if (updateInvoiceDto.items) {
      // Delete existing items
      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Calculate new totals
      subtotal = updateInvoiceDto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // Get tax rule for the branch
      const branch = await this.prisma.branch.findUnique({
        where: { id: updateInvoiceDto.branchId || invoice.branchId },
      });

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      const taxRule = await this.prisma.taxRule.findUnique({
        where: { province: branch.province },
      });

      if (!taxRule) {
        throw new NotFoundException(`Tax rule not found for province: ${branch.province}`);
      }

      taxAmount = subtotal * (taxRule.percentage / 100);
      totalAmount = subtotal + taxAmount;

      // Create new items
      await this.prisma.invoiceItem.createMany({
        data: updateInvoiceDto.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          invoiceId: id,
        })),
      });
    }

    // Update invoice
    return this.prisma.invoice.update({
      where: { id },
      data: {
        clientId: updateInvoiceDto.clientId,
        branchId: updateInvoiceDto.branchId,
        notes: updateInvoiceDto.notes,
        subtotal,
        taxAmount,
        totalAmount,
      },
      include: {
        client: true,
        branch: true,
        createdBy: true,
        items: true,
      },
    });
  }

  async remove(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Delete invoice items first (due to foreign key constraint)
    await this.prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Delete the invoice
    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Invoice deleted successfully' };
  }
} 