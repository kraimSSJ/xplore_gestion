import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './app-setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly settingsRepo: Repository<AppSetting>,
  ) {}

  async getSetting(): Promise<AppSetting> {
    let setting = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!setting) {
      setting = this.settingsRepo.create({ id: 1, rmbToMadRate: 1.35 });
      setting = await this.settingsRepo.save(setting);
    }
    return setting;
  }

  async getRate(): Promise<number> {
    const setting = await this.getSetting();
    return setting.rmbToMadRate;
  }

  async updateRate(rate: number): Promise<AppSetting> {
    const setting = await this.getSetting();
    setting.rmbToMadRate = rate;
    return this.settingsRepo.save(setting);
  }
}
