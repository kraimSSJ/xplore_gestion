import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { OrderStatus } from './order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() body: { items: { productId: string; quantity: number }[] }) {
    return this.ordersService.createFromCart(req.user.userId, body.items);
  }

  @Get('mine')
  async findMine(@Req() req: any) {
    return this.ordersService.findMine(req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const order = await this.ordersService.findOne(id);
    if (req.user.role !== UserRole.ADMIN && order.userId !== req.user.userId) {
      order.items = [];
    }
    return order;
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const order = await this.ordersService.findOne(id);
    if (req.user.role !== 'admin' && order.userId !== req.user.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const pdfBuffer = await this.pdfService.generateOrderPdf(order);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="order-${id.slice(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() body: { status: OrderStatus }) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @Patch(':id/shipping')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateShipping(@Param('id') id: string, @Body() body: { shippingCost: number }) {
    return this.ordersService.updateShipping(id, body.shippingCost);
  }

  @Patch(':id/notes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateNotes(@Param('id') id: string, @Body() body: { adminNotes: string }) {
    return this.ordersService.updateNotes(id, body.adminNotes);
  }

  @Patch(':id/items/:itemId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { quantity?: number; unitPrice?: number },
  ) {
    return this.ordersService.updateItem(id, itemId, body);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.ordersService.removeItem(id, itemId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.ordersService.remove(id);
    return { success: true };
  }
}
