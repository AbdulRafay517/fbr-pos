import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional, IsDateString } from 'class-validator';

export class InvoiceItemDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsArray()
  @IsNotEmpty()
  items: InvoiceItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
} 