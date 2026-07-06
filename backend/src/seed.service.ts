import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';
import { UserRole } from './users/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.usersService.count();
    if (count === 0) {
      const email = this.configService.get<string>('ADMIN_EMAIL') || 'admin@xplore.local';
      const password = this.configService.get<string>('ADMIN_PASSWORD') || 'admin123';
      await this.usersService.createUser({
        email,
        password,
        fullName: 'Admin',
        role: UserRole.ADMIN,
      });
      this.logger.log(`Seeded default admin account: ${email} / ${password}`);
      this.logger.log('Please log in and change this password / create real accounts.');
    }
  }
}
