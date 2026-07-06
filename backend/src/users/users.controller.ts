import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() body: { email: string; password: string; fullName: string; role?: UserRole },
  ) {
    const user = await this.usersService.createUser(body);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  async updateRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    const user = await this.usersService.updateRole(id, body.role);
    return { id: user.id, role: user.role };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { success: true };
  }
}
