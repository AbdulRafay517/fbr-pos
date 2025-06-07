import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

// Temporary type definition until Prisma client is regenerated
type InvoiceStatus = 'UNPAID' | 'PAID' | 'DUE_SOON' | 'OVERDUE';

@Injectable()
export class InvoiceStatusService {
  private readonly logger = new Logger(InvoiceStatusService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Update invoice status manually
   */
  async updateStatus(
    invoiceId: string,
    status: InvoiceStatus,
    userId?: string,
    reason?: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Don't update if status is the same
    if (invoice.status === status) {
      return invoice;
    }

    // Update invoice status
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
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

    // Record status change in history
    await this.prisma.invoiceStatusHistory.create({
      data: {
        invoiceId,
        status,
        changedBy: userId,
        reason: reason || this.getDefaultStatusChangeReason(status),
      },
    });

    this.logger.log(`Invoice ${invoice.invoiceNumber} status updated to ${status}`);
    return updatedInvoice;
  }

  /**
   * Get invoice status statistics
   */
  async getStatusStats() {
    const stats = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const result = {
      UNPAID: 0,
      PAID: 0,
      DUE_SOON: 0,
      OVERDUE: 0,
    };

    stats.forEach((stat) => {
      result[stat.status] = stat._count.status;
    });

    return result;
  }

  /**
   * Get due soon threshold from system config
   */
  async getDueSoonThreshold(): Promise<number> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'DUE_SOON_THRESHOLD_DAYS' },
    });

    return config ? parseInt(config.value) : 7; // Default to 7 days
  }

  /**
   * Set due soon threshold
   */
  async setDueSoonThreshold(days: number, userId?: string) {
    await this.prisma.systemConfig.upsert({
      where: { key: 'DUE_SOON_THRESHOLD_DAYS' },
      update: { value: days.toString() },
      create: {
        key: 'DUE_SOON_THRESHOLD_DAYS',
        value: days.toString(),
        description: 'Number of days before due date to mark invoice as due soon',
      },
    });

    this.logger.log(`Due soon threshold updated to ${days} days by ${userId || 'system'}`);
  }

  /**
   * Automated status updates (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateInvoiceStatuses() {
    this.logger.log('Running automated invoice status update...');

    try {
      const dueSoonThreshold = await this.getDueSoonThreshold();
      const now = new Date();
      const dueSoonDate = new Date(now.getTime() + dueSoonThreshold * 24 * 60 * 60 * 1000);

      // Find invoices that need status updates
      const invoicesToUpdate = await this.prisma.invoice.findMany({
        where: {
          AND: [
            { status: { in: ['UNPAID', 'DUE_SOON'] } },
            { dueDate: { not: null } },
          ],
        },
        include: {
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      let updatedCount = 0;

      for (const invoice of invoicesToUpdate) {
        const dueDate = new Date(invoice.dueDate!);
        let newStatus: InvoiceStatus | null = null;

        // Check if overdue
        if (dueDate < now && invoice.status !== 'OVERDUE') {
          newStatus = 'OVERDUE';
        }
        // Check if due soon
        else if (dueDate <= dueSoonDate && dueDate >= now && invoice.status === 'UNPAID') {
          newStatus = 'DUE_SOON';
        }

        if (newStatus) {
          await this.updateStatus(
            invoice.id,
            newStatus,
            undefined, // System update
            `Automatically updated based on due date: ${dueDate.toDateString()}`,
          );
          updatedCount++;
        }
      }

      this.logger.log(`Automated status update completed. Updated ${updatedCount} invoices.`);
    } catch (error) {
      this.logger.error('Error during automated status update:', error);
    }
  }

  /**
   * Get invoices by status with pagination
   */
  async getInvoicesByStatus(
    status: InvoiceStatus,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { status },
        include: {
          client: true,
          branch: true,
          createdBy: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where: { status } }),
    ]);

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

  /**
   * Get invoice status history
   */
  async getInvoiceStatusHistory(invoiceId: string) {
    return this.prisma.invoiceStatusHistory.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    });
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string, userId?: string, reason?: string) {
    return this.updateStatus(invoiceId, 'PAID', userId, reason || 'Payment received');
  }

  /**
   * Mark invoice as unpaid
   */
  async markAsUnpaid(invoiceId: string, userId?: string, reason?: string) {
    return this.updateStatus(invoiceId, 'UNPAID', userId, reason || 'Payment reversed or cancelled');
  }

  /**
   * Get invoices that are due soon or overdue
   */
  async getUrgentInvoices() {
    return this.prisma.invoice.findMany({
      where: {
        status: { in: ['DUE_SOON', 'OVERDUE'] },
      },
      include: {
        client: true,
        branch: true,
      },
      orderBy: [
        { status: 'desc' }, // OVERDUE first
        { dueDate: 'asc' }, // Then by due date
      ],
    });
  }

  private getDefaultStatusChangeReason(status: InvoiceStatus): string {
    switch (status) {
      case 'PAID':
        return 'Payment received';
      case 'UNPAID':
        return 'Status reset to unpaid';
      case 'DUE_SOON':
        return 'Automatically marked as due soon based on due date';
      case 'OVERDUE':
        return 'Automatically marked as overdue - past due date';
      default:
        return 'Status updated';
    }
  }
} 