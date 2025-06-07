import { IsNumber, IsPositive, Min } from 'class-validator';

export class UpdateDueSoonThresholdDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  days: number;
} 