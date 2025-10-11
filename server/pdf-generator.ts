import PDFDocument from "pdfkit";
import type { Invoice, Supplier, Payment } from "@shared/schema";

export interface InvoicePDFData {
  invoice: Invoice;
  supplier: Supplier;
  payment?: Payment;
}

export class PDFGeneratorService {
  generateInvoicePDF(data: InvoicePDFData): PDFKit.PDFDocument {
    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const { invoice, supplier } = data;

    this.addHeader(doc, supplier);
    
    this.addInvoiceDetails(doc, invoice, supplier);
    
    this.addItemsTable(doc, invoice);
    
    this.addFooter(doc, invoice);

    doc.end();

    return doc;
  }

  private addHeader(doc: PDFKit.PDFDocument, supplier: Supplier) {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('FACTURA', 50, 50, { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(supplier.legalName, 50, 90, { align: 'left' })
      .text(`RNC: ${supplier.rnc}`, 50, 105)
      .text(`Tel: ${supplier.phone}`, 50, 120)
      .text(supplier.location || '', 50, 135);

    doc.moveDown(2);
  }

  private addInvoiceDetails(doc: PDFKit.PDFDocument, invoice: Invoice, supplier: Supplier) {
    const startY = 180;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('DATOS DE LA FACTURA', 50, startY);

    doc
      .font('Helvetica')
      .text(`Factura No:`, 50, startY + 20)
      .text(invoice.invoiceNumber, 150, startY + 20)
      .text(`NCF:`, 50, startY + 35)
      .text(invoice.ncf || 'N/A', 150, startY + 35)
      .text(`Fecha:`, 50, startY + 50)
      .text(new Date(invoice.createdAt!).toLocaleDateString('es-DO'), 150, startY + 50);

    doc
      .text(`Cliente:`, 350, startY + 20)
      .text(supplier.legalName, 420, startY + 20)
      .text(`RNC:`, 350, startY + 35)
      .text(supplier.rnc, 420, startY + 35);

    doc.moveDown(3);
  }

  private addItemsTable(doc: PDFKit.PDFDocument, invoice: Invoice) {
    const tableTop = 280;
    const col1 = 50;
    const col2 = 200;
    const col3 = 400;
    const col4 = 480;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Descripción', col1, tableTop)
      .text('Cantidad', col2, tableTop)
      .text('Precio Unit.', col3, tableTop)
      .text('Total', col4, tableTop);

    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc
      .font('Helvetica')
      .text('Servicio de suscripción', col1, tableTop + 25)
      .text('1', col2, tableTop + 25)
      .text(`${invoice.currency} ${Number(invoice.subtotal).toFixed(2)}`, col3, tableTop + 25)
      .text(`${invoice.currency} ${Number(invoice.subtotal).toFixed(2)}`, col4, tableTop + 25);

    doc
      .moveTo(col1, tableTop + 50)
      .lineTo(550, tableTop + 50)
      .stroke();

    const totalsY = tableTop + 70;
    
    doc
      .font('Helvetica')
      .text('Subtotal:', 400, totalsY)
      .text(`${invoice.currency} ${Number(invoice.subtotal).toFixed(2)}`, 480, totalsY, { align: 'right' });

    doc
      .text('ITBIS (18%):', 400, totalsY + 20)
      .text(`${invoice.currency} ${Number(invoice.itbis).toFixed(2)}`, 480, totalsY + 20, { align: 'right' });

    doc
      .moveTo(400, totalsY + 35)
      .lineTo(550, totalsY + 35)
      .stroke();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TOTAL:', 400, totalsY + 45)
      .text(`${invoice.currency} ${Number(invoice.total).toFixed(2)}`, 480, totalsY + 45, { align: 'right' });

    doc
      .moveTo(400, totalsY + 65)
      .lineTo(550, totalsY + 65)
      .stroke();
  }

  private addFooter(doc: PDFKit.PDFDocument, invoice: Invoice) {
    const footerY = 650;

    if (invoice.notes) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Notas:', 50, footerY)
        .font('Helvetica')
        .text(invoice.notes, 50, footerY + 15, { 
          width: 500,
          align: 'left'
        });
    }

    doc
      .fontSize(8)
      .font('Helvetica')
      .text('Esta factura fue generada electrónicamente y es válida sin firma.', 50, 720, { 
        align: 'center',
        width: 500
      });

    doc
      .fontSize(7)
      .text(`Generado el ${new Date().toLocaleString('es-DO')}`, 50, 740, { 
        align: 'center',
        width: 500
      });
  }

  generateInvoicePDFBuffer(data: InvoicePDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = this.generateInvoicePDF(data);
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }
}

export const pdfGenerator = new PDFGeneratorService();
