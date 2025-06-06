import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateBranchDto } from '../branches/dto/create-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post(':id/branches')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  createBranch(
    @Param('id') clientId: string,
    @Body() createBranchDto: CreateBranchDto,
  ) {
    return this.clientsService.createBranch({
      ...createBranchDto,
      clientId,
    });
  }

  @Get(':id/branches')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  findBranches(@Param('id') clientId: string) {
    return this.clientsService.findBranches(clientId);
  }
} 