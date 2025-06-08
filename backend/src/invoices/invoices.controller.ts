import { Controller, Get, Post, Body, Param, UseGuards, Request, Res, Logger, Put, Delete, Query } from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { InvoiceStatusService } from './invoice-status.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { UpdateDueSoonThresholdDto } from './dto/system-config.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Temporary type definition until Prisma client is regenerated
type InvoiceStatus = 'UNPAID' | 'PAID' | 'DUE_SOON' | 'OVERDUE';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoiceStatusService: InvoiceStatusService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    this.logger.log('Creating new invoice');
    return this.invoicesService.create(createInvoiceDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  findAll(@Query() query: QueryInvoiceDto) {
    this.logger.log('Getting all invoices with pagination and search');
    return this.invoicesService.findAll(query);
  }

  // Status Management Endpoints
  @Get('status/stats')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  getStatusStats() {
    this.logger.log('Getting invoice status statistics');
    return this.invoiceStatusService.getStatusStats();
  }

  @Get('status/urgent')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  getUrgentInvoices() {
    this.logger.log('Getting urgent invoices (due soon and overdue)');
    return this.invoiceStatusService.getUrgentInvoices();
  }

  @Get('status/:status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  getInvoicesByStatus(
    @Param('status') status: InvoiceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(`Getting invoices with status: ${status}`);
    return this.invoiceStatusService.getInvoicesByStatus(status, page, limit);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
    @Request() req,
  ) {
    this.logger.log(`Updating status for invoice: ${id} to ${updateStatusDto.status}`);
    return this.invoiceStatusService.updateStatus(
      id,
      updateStatusDto.status,
      req.user.id,
      updateStatusDto.reason,
    );
  }

  @Put(':id/mark-paid')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  markAsPaid(@Param('id') id: string, @Request() req, @Body() body?: { reason?: string }) {
    this.logger.log(`Marking invoice as paid: ${id}`);
    return this.invoiceStatusService.markAsPaid(id, req.user.id, body?.reason);
  }

  @Put(':id/mark-unpaid')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  markAsUnpaid(@Param('id') id: string, @Request() req, @Body() body?: { reason?: string }) {
    this.logger.log(`Marking invoice as unpaid: ${id}`);
    return this.invoiceStatusService.markAsUnpaid(id, req.user.id, body?.reason);
  }

  @Get(':id/status-history')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  getStatusHistory(@Param('id') id: string) {
    this.logger.log(`Getting status history for invoice: ${id}`);
    return this.invoiceStatusService.getInvoiceStatusHistory(id);
  }

  // Configuration Endpoints
  @Get('config/due-soon-threshold')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  getDueSoonThreshold() {
    this.logger.log('Getting due soon threshold configuration');
    return this.invoiceStatusService.getDueSoonThreshold();
  }

  @Put('config/due-soon-threshold')
  @Roles(UserRole.ADMIN)
  setDueSoonThreshold(@Body() dto: UpdateDueSoonThresholdDto, @Request() req) {
    this.logger.log(`Setting due soon threshold to ${dto.days} days`);
    return this.invoiceStatusService.setDueSoonThreshold(dto.days, req.user.id);
  }

  @Post('status/update-all')
  @Roles(UserRole.ADMIN)
  async triggerStatusUpdate(@Request() req) {
    this.logger.log('Manually triggering status update for all invoices');
    await this.invoiceStatusService.updateInvoiceStatuses();
    return { message: 'Status update triggered successfully' };
  }

  @Get('client/:clientId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  findByClient(@Param('clientId') clientId: string, @Query() query: QueryInvoiceDto) {
    this.logger.log(`Getting invoices for client: ${clientId} with pagination and search`);
    return this.invoicesService.findByClient(clientId, query);
  }

  @Get('branch/:branchId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  findByBranch(@Param('branchId') branchId: string, @Query() query: QueryInvoiceDto) {
    this.logger.log(`Getting invoices for branch: ${branchId} with pagination and search`);
    return this.invoicesService.findByBranch(branchId, query);
  }

  @Get(':id/pdf')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Generating PDF for invoice: ${id}`);
    const pdfBuffer = await this.invoicesService.generatePdf(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    this.logger.log(`Getting invoice: ${id}`);
    return this.invoicesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    this.logger.log(`Updating invoice: ${id}`);
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  remove(@Param('id') id: string) {
    this.logger.log(`Deleting invoice: ${id}`);
    return this.invoicesService.remove(id);
  }
} 