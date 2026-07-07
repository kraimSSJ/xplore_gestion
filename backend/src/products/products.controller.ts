import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadToSupabase } from '../storage.util';
import { ProductsService } from './products.service';
import { SettingsService } from '../settings/settings.service';
import { Product } from './product.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly settingsService: SettingsService,
  ) {}

  // Attaches the live computed MAD price (priceRmb * current exchange rate)
  // to a product without persisting it, so changing the rate instantly
  // updates every product's displayed MAD price.
  private async withPriceMad(product: Product, rate?: number) {
    const r = rate ?? (await this.settingsService.getRate());
    return { ...product, priceMad: Math.round(product.priceRmb * r * 100) / 100 };
  }

  private async withPriceMadMany(products: Product[]) {
    const rate = await this.settingsService.getRate();
    return Promise.all(products.map((p) => this.withPriceMad(p, rate)));
  }

  @Get()
  async findAll(@Query('category') category?: string) {
    const products = await this.productsService.findAll(category);
    return this.withPriceMadMany(products);
  }

  @Get('categories')
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return this.withPriceMad(product);
  }

  @Post()
  async create(@Body() body: any) {
    const product = await this.productsService.create({
      name: body.name,
      priceRmb: parseFloat(body.priceRmb),
      reference: body.reference,
      category: body.category,
      description: body.description,
      photoUrl: body.photoUrl,
    });
    return this.withPriceMad(product);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.priceRmb !== undefined) data.priceRmb = parseFloat(body.priceRmb);
    if (body.reference !== undefined) data.reference = body.reference;
    if (body.category !== undefined) data.category = body.category;
    if (body.description !== undefined) data.description = body.description;
    if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl;
    const product = await this.productsService.update(id, data);
    return this.withPriceMad(product);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { success: true };
  }

  @Post('upload/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    const photoUrl = await uploadToSupabase(uniqueName, file.buffer, file.mimetype);
    return { photoUrl };
  }
}
