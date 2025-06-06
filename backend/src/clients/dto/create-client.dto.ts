import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum ClientType {
  VENDOR = 'VENDOR',
  CLIENT = 'CLIENT',
}

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(ClientType)
  type: ClientType;

  @IsNotEmpty()
  @IsString()
  contact: string;
} 