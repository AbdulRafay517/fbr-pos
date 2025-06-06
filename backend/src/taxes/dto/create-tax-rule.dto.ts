import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateTaxRuleDto {
  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsNumber()
  percentage: number;

  @IsBoolean()
  isActive: boolean;
} 