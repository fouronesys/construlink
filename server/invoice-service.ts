import { storage } from "./storage";
import type { InsertInvoice, Payment, Supplier } from "@shared/schema";

const ITBIS_RATE = 0.18; // 18% ITBIS en República Dominicana

export interface InvoiceGenerationResult {
  success: boolean;
  invoice?: any;
  error?: string;
}

export class InvoiceService {
  async generateInvoiceForPayment(
    payment: Payment,
    supplier: Supplier
  ): Promise<InvoiceGenerationResult> {
    try {
      const amount = Number(payment.amount);
      
      const subtotal = amount / (1 + ITBIS_RATE);
      const itbis = amount - subtotal;
      
      const invoiceNumber = await storage.getNextInvoiceNumber();
      
      const ncfResult = await storage.getNextNcfFromSeries("B01");
      
      if (!ncfResult) {
        console.error("No NCF available for series B01");
        return {
          success: false,
          error: "No hay NCF disponibles. Por favor contacte al administrador."
        };
      }

      const invoiceData: InsertInvoice = {
        paymentId: payment.id,
        supplierId: supplier.id,
        invoiceNumber,
        ncf: ncfResult.ncf,
        ncfSequence: "B01",
        subtotal: subtotal.toFixed(2),
        itbis: itbis.toFixed(2),
        total: amount.toFixed(2),
        currency: payment.currency || "DOP",
        status: "paid",
        paidDate: payment.paymentDate || new Date(),
        notes: `Factura generada automáticamente para pago ${payment.id}`
      };

      const invoice = await storage.createInvoice(invoiceData);

      const availability = await storage.checkNcfAvailability("B01");
      if (availability.shouldAlert) {
        console.warn(
          `⚠️ ALERTA: Quedan solo ${availability.available} NCF disponibles en la serie B01`
        );
      }

      return {
        success: true,
        invoice
      };
    } catch (error) {
      console.error("Error generating invoice:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al generar factura"
      };
    }
  }

  async calculateITBIS(amount: number): Promise<{
    subtotal: number;
    itbis: number;
    total: number;
  }> {
    const subtotal = amount / (1 + ITBIS_RATE);
    const itbis = amount - subtotal;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      itbis: Number(itbis.toFixed(2)),
      total: Number(amount.toFixed(2))
    };
  }

  async checkNcfAvailabilityAlert(): Promise<void> {
    const ncfTypes = ["B01", "B02", "B14", "B15", "B16", "E31"];
    
    for (const type of ncfTypes) {
      const availability = await storage.checkNcfAvailability(type);
      
      if (availability.shouldAlert) {
        console.warn(
          `⚠️ ALERTA NCF: La serie ${type} tiene solo ${availability.available} comprobantes disponibles`
        );
      }
    }
  }

  async getInvoicesBySupplierId(supplierId: string, filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    return await storage.getAllInvoices({
      supplierId,
      ...filters
    });
  }

  async getInvoiceById(invoiceId: string) {
    return await storage.getInvoice(invoiceId);
  }
}

export const invoiceService = new InvoiceService();
