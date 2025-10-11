import { storage } from "./storage";
import type { Invoice } from "@shared/schema";

export interface MonthlyReportData {
  month: string;
  totalInvoices: number;
  totalRevenue: number;
  totalITBIS: number;
  invoicesByStatus: {
    paid: number;
    draft: number;
    sent: number;
    cancelled: number;
  };
}

export interface DGIIReportRow {
  ncf: string;
  fecha: string;
  subtotal: number;
  itbis: number;
  total: number;
}

export class FiscalReportsService {
  async getMonthlyReport(supplierId: string, month: string): Promise<MonthlyReportData> {
    const invoices = await storage.getAllInvoices({
      supplierId,
      limit: 1000
    });

    const monthInvoices = invoices.invoices.filter((inv: Invoice) => {
      const invDate = new Date(inv.createdAt!);
      const invMonth = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
      return invMonth === month;
    });

    const totalRevenue = monthInvoices
      .filter((inv: Invoice) => inv.status === 'paid')
      .reduce((sum: number, inv: Invoice) => sum + Number(inv.total), 0);

    const totalITBIS = monthInvoices
      .filter((inv: Invoice) => inv.status === 'paid')
      .reduce((sum: number, inv: Invoice) => sum + Number(inv.itbis), 0);

    const invoicesByStatus = {
      paid: monthInvoices.filter((inv: Invoice) => inv.status === 'paid').length,
      draft: monthInvoices.filter((inv: Invoice) => inv.status === 'draft').length,
      sent: monthInvoices.filter((inv: Invoice) => inv.status === 'sent').length,
      cancelled: monthInvoices.filter((inv: Invoice) => inv.status === 'cancelled').length,
    };

    return {
      month,
      totalInvoices: monthInvoices.length,
      totalRevenue,
      totalITBIS,
      invoicesByStatus
    };
  }

  async getDGIIReport(supplierId: string, startDate: Date, endDate: Date): Promise<DGIIReportRow[]> {
    const invoices = await storage.getAllInvoices({
      supplierId,
      status: 'paid',
      limit: 10000
    });

    const filteredInvoices = invoices.invoices.filter((inv: Invoice) => {
      const invDate = new Date(inv.createdAt!);
      return invDate >= startDate && invDate <= endDate && inv.ncf;
    });

    return filteredInvoices.map((inv: Invoice) => ({
      ncf: inv.ncf || '',
      fecha: new Date(inv.createdAt!).toISOString().split('T')[0],
      subtotal: Number(inv.subtotal),
      itbis: Number(inv.itbis),
      total: Number(inv.total)
    }));
  }

  async getITBISReport(supplierId: string, year: number): Promise<{
    year: number;
    totalITBIS: number;
    byMonth: Array<{ month: string; itbis: number }>;
  }> {
    const invoices = await storage.getAllInvoices({
      supplierId,
      status: 'paid',
      limit: 10000
    });

    const yearInvoices = invoices.invoices.filter((inv: Invoice) => {
      const invYear = new Date(inv.createdAt!).getFullYear();
      return invYear === year;
    });

    const monthlyITBIS: { [key: string]: number } = {};
    
    yearInvoices.forEach((inv: Invoice) => {
      const month = new Date(inv.createdAt!).toISOString().slice(0, 7);
      if (!monthlyITBIS[month]) {
        monthlyITBIS[month] = 0;
      }
      monthlyITBIS[month] += Number(inv.itbis);
    });

    const byMonth = Object.entries(monthlyITBIS).map(([month, itbis]) => ({
      month,
      itbis
    })).sort((a, b) => a.month.localeCompare(b.month));

    const totalITBIS = yearInvoices.reduce((sum: number, inv: Invoice) => 
      sum + Number(inv.itbis), 0
    );

    return {
      year,
      totalITBIS,
      byMonth
    };
  }

  exportDGIIToCSV(data: DGIIReportRow[]): string {
    const headers = ['NCF', 'Fecha', 'Subtotal', 'ITBIS', 'Total'];
    const rows = data.map(row => [
      row.ncf,
      row.fecha,
      row.subtotal.toFixed(2),
      row.itbis.toFixed(2),
      row.total.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}

export const fiscalReports = new FiscalReportsService();
