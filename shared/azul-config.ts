/**
 * Configuración de Azul Payment Gateway
 * Gateway de pagos líder en República Dominicana (Banco Popular)
 */

import { z } from "zod";

// Tipos de configuración de Azul
export interface AzulConfig {
  merchantId: string;
  merchantName: string;
  merchantType: string;
  authToken: string;
  secretKey: string;
  baseUrl: string;
  isSandbox: boolean;
  callbackUrls: {
    approved: string;
    declined: string;
    cancel: string;
  };
}

// Tipos de respuesta de Azul
export interface AzulPaymentResponse {
  OrderNumber: string;
  Amount: string;
  AuthorizationCode?: string;
  DateTime?: string;
  ResponseCode?: string;
  ResponseMessage?: string;
  IsoCode?: string;
  AzulOrderId?: string;
  CardNumber?: string; // Últimos 4 dígitos
  CustomOrderId?: string;
  RRN?: string;
  Ticket?: string;
}

// Códigos de respuesta de Azul
export const AZUL_RESPONSE_CODES = {
  APPROVED: "00",
  DECLINED: "05",
  INVALID_CARD: "14",
  INSUFFICIENT_FUNDS: "51",
  INVALID_TRANSACTION: "12",
  SYSTEM_ERROR: "96",
  TIMEOUT: "68",
  CANCEL: "99",
} as const;

export const AZUL_RESPONSE_MESSAGES: Record<string, string> = {
  "00": "Transacción aprobada",
  "05": "Transacción declinada",
  "14": "Tarjeta inválida",
  "51": "Fondos insuficientes",
  "12": "Transacción inválida",
  "96": "Error del sistema",
  "68": "Tiempo de espera excedido",
  "99": "Transacción cancelada por usuario",
};

// Constantes de Azul
export const AZUL_MERCHANT_TYPE = "Ecommerce"; // o "Retail" dependiendo del tipo de negocio
export const AZUL_CURRENCY_DOP = "DOP";
export const AZUL_CURRENCY_USD = "USD";

// URLs de Azul (sandbox y producción)
export const AZUL_URLS = {
  SANDBOX: "https://pruebas.azul.com.do/paymentpage",
  PRODUCTION: "https://pagos.azul.com.do/paymentpage",
} as const;

// Validación de parámetros de pago
export const azulPaymentRequestSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum([AZUL_CURRENCY_DOP, AZUL_CURRENCY_USD]),
  customFields: z.record(z.string()).optional(),
});

export type AzulPaymentRequest = z.infer<typeof azulPaymentRequestSchema>;

// Validación de respuesta de callback
export const azulCallbackSchema = z.object({
  OrderNumber: z.string(),
  Amount: z.string(),
  AuthorizationCode: z.string().optional(),
  DateTime: z.string().optional(),
  ResponseCode: z.string().optional(),
  ResponseMessage: z.string().optional(),
  IsoCode: z.string().optional(),
  ErrorDescription: z.string().optional(),
  AzulOrderId: z.string().optional(),
  CardNumber: z.string().optional(),
  CustomOrderId: z.string().optional(),
  RRN: z.string().optional(),
  Ticket: z.string().optional(),
});

// Función helper para determinar si una transacción fue exitosa
export function isAzulTransactionApproved(responseCode?: string): boolean {
  return responseCode === AZUL_RESPONSE_CODES.APPROVED;
}

// Función helper para obtener mensaje de respuesta
export function getAzulResponseMessage(responseCode?: string): string {
  if (!responseCode) return "Respuesta desconocida";
  return AZUL_RESPONSE_MESSAGES[responseCode] || `Código de respuesta: ${responseCode}`;
}

// Configuración de planes de suscripción (montos en DOP)
export const SUBSCRIPTION_PLANS = {
  basic: {
    id: "basic",
    name: "Plan Básico",
    monthlyAmount: 1000, // RD$1,000
    trialDays: 7,
  },
  professional: {
    id: "professional",
    name: "Plan Profesional",
    monthlyAmount: 2500, // RD$2,500
    trialDays: 7,
  },
  enterprise: {
    id: "enterprise",
    name: "Plan Empresarial",
    monthlyAmount: 5000, // RD$5,000
    trialDays: 7,
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

// Variables de entorno requeridas
export const REQUIRED_AZUL_ENV_VARS = [
  "AZUL_MERCHANT_ID",
  "AZUL_MERCHANT_NAME",
  "AZUL_AUTH_TOKEN",
  "AZUL_SECRET_KEY",
] as const;

// Helper para validar configuración de Azul
export function validateAzulConfig(config: Partial<AzulConfig>): config is AzulConfig {
  return !!(
    config.merchantId &&
    config.merchantName &&
    config.authToken &&
    config.secretKey &&
    config.baseUrl &&
    config.callbackUrls?.approved &&
    config.callbackUrls?.declined &&
    config.callbackUrls?.cancel
  );
}

// Helper para formatear monto para Azul (debe ser string con 2 decimales)
export function formatAmountForAzul(amount: number): string {
  return amount.toFixed(2);
}

// Helper para parsear monto desde Azul
export function parseAmountFromAzul(amountStr: string): number {
  return parseFloat(amountStr);
}
