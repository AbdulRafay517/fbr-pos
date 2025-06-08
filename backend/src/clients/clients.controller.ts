import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
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

  @Put(':id/branches/:branchId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  updateBranch(
    @Param('id') clientId: string,
    @Param('branchId') branchId: string,
    @Body() updateBranchDto: Partial<CreateBranchDto>,
  ) {
    return this.clientsService.updateBranch(clientId, branchId, updateBranchDto);
  }

  @Delete(':id/branches/:branchId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  removeBranch(
    @Param('id') clientId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.clientsService.removeBranch(clientId, branchId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  update(@Param('id') id: string, @Body() updateClientDto: Partial<CreateClientDto>) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
} 