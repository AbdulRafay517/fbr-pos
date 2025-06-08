import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional } from 'class-validator';
import { InvoiceItemDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  taxRuleId?: string;

  @IsOptional()
  @IsArray()
  items?: InvoiceItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
} 