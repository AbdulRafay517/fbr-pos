import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateTaxRuleDto {
  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 