import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { Order, OrderItem } from './order.entity';

const NAVY = '#0F1F3D';
const NAVY_LIGHT = '#1E3A63';
const WHITE = '#FFFFFF';
const GRAY = '#6B7280';

@Injectable()
export class PdfService {
  private async fetchPhotoBuffers(items: OrderItem[]): Promise<Map<string, Buffer>> {
    const map = new Map<string, Buffer>();
    await Promise.all(
      (items || []).map(async (item) => {
        if (!item.productPhotoUrl) return;
        try {
          const res = await fetch(item.productPhotoUrl);
          if (res.ok) {
            map.set(item.productPhotoUrl, Buffer.from(await res.arrayBuffer()));
          }
        } catch (e) {
          // ignore broken/unreachable images
        }
      }),
    );
    return map;
  }

  async generateOrderPdf(order: Order): Promise<Buffer> {
    const photoBuffers = await this.fetchPhotoBuffers(order.items);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header band
      doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
      doc
        .fillColor(WHITE)
        .fontSize(26)
        .font('Helvetica-Bold')
        .text('XPLORE', 40, 28);
      doc
        .fillColor(WHITE)
        .fontSize(11)
        .font('Helvetica')
        .text('Internal Order Invoice', 40, 58);

      doc
        .fillColor(WHITE)
        .fontSize(10)
        .text(`Order #${order.id.slice(0, 8).toUpperCase()}`, 0, 30, {
          align: 'right',
          width: doc.page.width - 40,
        })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 0, 46, {
          align: 'right',
          width: doc.page.width - 40,
        })
        .text(`Status: ${order.status.toUpperCase()}`, 0, 62, {
          align: 'right',
          width: doc.page.width - 40,
        });

      doc.moveDown(4);
      let y = 110;

      doc
        .fillColor(NAVY)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Ordered by: ${order.user?.fullName || 'Unknown'}`, 40, y);
      doc
        .fillColor(GRAY)
        .fontSize(10)
        .font('Helvetica')
        .text(`${order.user?.email || ''}`, 40, y + 16);

      y += 45;

      // Table header
      const tableTop = y;
      const colPhoto = 40;
      const colName = 100;
      const colQty = 330;
      const colPrice = 400;
      const colTotal = 480;

      doc.rect(40, tableTop, doc.page.width - 80, 24).fill(NAVY_LIGHT);
      doc
        .fillColor(WHITE)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('PRODUCT', colName, tableTop + 7)
        .text('QTY', colQty, tableTop + 7)
        .text('PRICE', colPrice, tableTop + 7)
        .text('TOTAL', colTotal, tableTop + 7);

      y = tableTop + 24;
      let grandTotal = 0;

      for (const item of order.items || []) {
        const rowHeight = 55;
        if (y + rowHeight > doc.page.height - 120) {
          doc.addPage();
          y = 40;
        }

        doc
          .rect(40, y, doc.page.width - 80, rowHeight)
          .strokeColor('#E5E7EB')
          .lineWidth(0.5)
          .stroke();

        // Embed the product photo if we managed to fetch it
        const photoBuffer = item.productPhotoUrl && photoBuffers.get(item.productPhotoUrl);
        if (photoBuffer) {
          try {
            doc.image(photoBuffer, colPhoto + 4, y + 4, {
              fit: [46, 46],
            });
          } catch (e) {
            // ignore broken images
          }
        }

        doc
          .fillColor(NAVY)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(item.productName, colName, y + 10, { width: 220 });

        doc
          .fillColor(GRAY)
          .fontSize(9)
          .font('Helvetica')
          .text(`${item.quantity}`, colQty, y + 20)
          .text(
            item.unitPriceRmb
              ? `¥${item.unitPriceRmb.toFixed(2)} / ${item.unitPrice.toFixed(2)} MAD`
              : `${item.unitPrice.toFixed(2)} MAD`,
            colPrice,
            y + 20,
            { width: 75 },
          )
          .text(`${(item.unitPrice * item.quantity).toFixed(2)} MAD`, colTotal, y + 20);

        grandTotal += item.unitPrice * item.quantity;
        y += rowHeight;
      }

      y += 20;
      if (y + 100 > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }

      const subtotal = grandTotal;
      const shipping = order.shippingCost || 0;
      const total = subtotal + shipping;

      const summaryX = 340;
      doc
        .fontSize(10)
        .fillColor(GRAY)
        .font('Helvetica')
        .text('Subtotal:', summaryX, y)
        .text(`${subtotal.toFixed(2)} MAD`, summaryX + 100, y, { align: 'right', width: 80 });

      y += 18;
      doc
        .text('Shipping:', summaryX, y)
        .text(`${shipping.toFixed(2)} MAD`, summaryX + 100, y, { align: 'right', width: 80 });

      y += 22;
      doc.rect(summaryX, y, 180, 30).fill(NAVY);
      doc
        .fillColor(WHITE)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL', summaryX + 10, y + 9)
        .text(`${total.toFixed(2)} MAD`, summaryX + 10, y + 9, {
          align: 'right',
          width: 160,
        });

      if (order.adminNotes) {
        y += 50;
        doc
          .fillColor(NAVY)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Notes:', 40, y);
        doc
          .fillColor(GRAY)
          .fontSize(9)
          .font('Helvetica')
          .text(order.adminNotes, 40, y + 14, { width: doc.page.width - 80 });
      }

      doc.end();
    });
  }
}
