import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async findAll(category?: string): Promise<Product[]> {
    if (category && category !== 'all') {
      return this.productsRepo.find({
        where: { category },
        order: { createdAt: 'DESC' },
      });
    }
    return this.productsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    return this.productsRepo
      .createQueryBuilder('product')
      .where('product.id IN (:...ids)', { ids })
      .getMany();
  }

  async getCategories(): Promise<string[]> {
    const rows = await this.productsRepo
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .getRawMany();
    return rows.map((r) => r.category).filter(Boolean);
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.productsRepo.create(data);
    return this.productsRepo.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, data);
    return this.productsRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepo.remove(product);
  }
}
