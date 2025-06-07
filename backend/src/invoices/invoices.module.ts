import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoicesService } from './invoices.service';
import { InvoiceStatusService } from './invoice-status.service';
import { InvoicesController } from './invoices.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceStatusService, PdfService],
  exports: [InvoicesService, InvoiceStatusService],
})
export class InvoicesModule {} 