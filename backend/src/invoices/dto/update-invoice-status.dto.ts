import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsIn(['UNPAID', 'PAID', 'DUE_SOON', 'OVERDUE'])
  status: 'UNPAID' | 'PAID' | 'DUE_SOON' | 'OVERDUE';

  @IsOptional()
  @IsString()
  reason?: string;
} 