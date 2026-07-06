import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem, OrderStatus } from './order.entity';
import { ProductsService } from '../products/products.service';
import { SettingsService } from '../settings/settings.service';

interface CartItemInput {
  productId: string;
  quantity: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    private readonly productsService: ProductsService,
    private readonly settingsService: SettingsService,
  ) {}

  async createFromCart(userId: string, items: CartItemInput[]): Promise<Order> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    const productIds = items.map((i) => i.productId);
    const products = await this.productsService.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const rate = await this.settingsService.getRate();

    const order = this.ordersRepo.create({
      userId,
      status: OrderStatus.PENDING,
      shippingCost: 0,
      items: items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }
        return this.orderItemsRepo.create({
          productId: product.id,
          productName: product.name,
          productPhotoUrl: product.photoUrl,
          unitPriceRmb: product.priceRmb,
          unitPrice: Math.round(product.priceRmb * rate * 100) / 100,
          quantity: item.quantity,
        });
      }),
    });

    return this.ordersRepo.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findMine(userId: string): Promise<Order[]> {
    return this.ordersRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    return this.ordersRepo.save(order);
  }

  async updateShipping(id: string, shippingCost: number): Promise<Order> {
    const order = await this.findOne(id);
    order.shippingCost = shippingCost;
    return this.ordersRepo.save(order);
  }

  async updateNotes(id: string, adminNotes: string): Promise<Order> {
    const order = await this.findOne(id);
    order.adminNotes = adminNotes;
    return this.ordersRepo.save(order);
  }

  async updateItem(
    orderId: string,
    itemId: string,
    data: { quantity?: number; unitPrice?: number },
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Order item not found');
    if (data.quantity !== undefined) item.quantity = data.quantity;
    if (data.unitPrice !== undefined) item.unitPrice = data.unitPrice;
    await this.orderItemsRepo.save(item);
    return this.findOne(orderId);
  }

  async removeItem(orderId: string, itemId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Order item not found');
    await this.orderItemsRepo.remove(item);
    return this.findOne(orderId);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.ordersRepo.remove(order);
  }
}
