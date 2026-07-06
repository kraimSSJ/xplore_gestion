import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem } from './order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PdfService } from './pdf.service';
import { ProductsModule } from '../products/products.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), ProductsModule, SettingsModule],
  providers: [OrdersService, PdfService],
  controllers: [OrdersController],
})
export class OrdersModule {}
