import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('exchange-rate')
  async getRate() {
    const rate = await this.settingsService.getRate();
    return { rmbToMadRate: rate };
  }

  @Patch('exchange-rate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRate(@Body() body: { rmbToMadRate: number }) {
    const rate = parseFloat(String(body.rmbToMadRate));
    if (isNaN(rate) || rate <= 0) {
      return { message: 'Invalid rate' };
    }
    const setting = await this.settingsService.updateRate(rate);
    return { rmbToMadRate: setting.rmbToMadRate };
  }
}
