import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invoice {
  id: string;
  invoiceNumber: string;
  ncf: string | null;
  subtotal: string;
  itbis: string;
  total: string;
  currency: string;
  status: string;
  createdAt: string;
  paidDate: string | null;
}

const STATUS_COLORS = {
  draft: "secondary",
  sent: "default",
  paid: "default",
  cancelled: "destructive",
} as const;

const STATUS_LABELS = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  cancelled: "Cancelada",
};

export default function InvoicesPage() {
  const { user } = useAuth();

  const { data: invoices, isLoading } = useQuery<{ invoices: Invoice[], total: number }>({
    queryKey: ['/api/invoices'],
    enabled: !!user,
  });

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al descargar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando facturas...</p>
          </div>
        </div>
      </div>
    );
  }

  const invoicesList = invoices?.invoices || [];
  const totalInvoices = invoices?.total || 0;

  const totalRevenue = invoicesList
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <div className="container mx-auto p-6" data-testid="invoices-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="page-title">Mis Facturas</h1>
        <p className="text-muted-foreground" data-testid="page-description">
          Gestiona y descarga tus facturas fiscales
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card data-testid="card-total-invoices">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Facturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">{totalInvoices}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-paid-invoices">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pagadas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-paid-count">
              {invoicesList.filter(inv => inv.status === 'paid').length}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              RD$ {totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-invoices-table">
        <CardHeader>
          <CardTitle>Historial de Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesList.length === 0 ? (
            <div className="text-center py-12" data-testid="text-no-invoices">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tienes facturas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de Factura</TableHead>
                    <TableHead>NCF</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>ITBIS (18%)</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesList.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium" data-testid={`text-invoice-number-${invoice.id}`}>
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell data-testid={`text-ncf-${invoice.id}`}>
                        {invoice.ncf || 'N/A'}
                      </TableCell>
                      <TableCell data-testid={`text-date-${invoice.id}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(invoice.createdAt).toLocaleDateString('es-DO')}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-subtotal-${invoice.id}`}>
                        {invoice.currency} {Number(invoice.subtotal).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-itbis-${invoice.id}`}>
                        {invoice.currency} {Number(invoice.itbis).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold" data-testid={`text-total-${invoice.id}`}>
                        {invoice.currency} {Number(invoice.total).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`badge-status-${invoice.id}`}>
                        <Badge variant={STATUS_COLORS[invoice.status as keyof typeof STATUS_COLORS]}>
                          {STATUS_LABELS[invoice.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
