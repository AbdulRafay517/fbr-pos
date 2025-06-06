import { Controller, Get, Post, Body, Param, UseGuards, Request, Res, Logger, Put, Delete, Query } from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(private readonly invoicesService: InvoicesService) {}

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
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    this.logger.log(`Deleting invoice: ${id}`);
    return this.invoicesService.remove(id);
  }
} 