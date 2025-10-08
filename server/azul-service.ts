import crypto from 'crypto';
import { db } from './db';
import { paymentGatewayConfig, type PaymentGatewayConfig } from '@shared/schema';
import { eq } from 'drizzle-orm';
import {
  type AzulConfig,
  type AzulPaymentResponse,
  AZUL_URLS,
  AZUL_RESPONSE_CODES,
  isAzulTransactionApproved,
  getAzulResponseMessage,
  formatAmountForAzul,
  azulCallbackSchema,
} from '@shared/azul-config';

export async function getAzulConfig(): Promise<AzulConfig | null> {
  const [config] = await db
    .select()
    .from(paymentGatewayConfig)
    .where(eq(paymentGatewayConfig.gatewayName, 'azul'))
    .limit(1);

  if (!config || !config.isEnabled) {
    return null;
  }

  const callbackUrls = config.callbackUrls as { approved: string; declined: string; cancel: string } | null;

  if (!callbackUrls) {
    throw new Error('Azul callback URLs not configured');
  }

  return {
    merchantId: config.merchantId || '',
    merchantName: config.merchantName || '',
    merchantType: 'Ecommerce',
    authToken: config.authToken || '',
    secretKey: config.secretKey || '',
    baseUrl: config.baseUrl || (config.isSandbox ? AZUL_URLS.SANDBOX : AZUL_URLS.PRODUCTION),
    isSandbox: config.isSandbox || false,
    callbackUrls,
  };
}

function encryptAndEncode(strIn: string): string {
  const buffer = Buffer.from(strIn, 'utf16le');
  return crypto.createHash('sha512').update(buffer).digest('hex');
}

function generateAzulAuthHash(params: Record<string, string>, privateKey: string): string {
  let concatenated = '';
  for (const value of Object.values(params)) {
    concatenated += value;
  }
  concatenated += privateKey;
  return encryptAndEncode(concatenated);
}

export interface CreateAzulPaymentParams {
  orderNumber: string;
  amount: number;
  itbis?: number;
  currency?: string;
  customOrderId?: string;
  customerEmail?: string;
}

export async function createAzulPaymentRequest(params: CreateAzulPaymentParams) {
  const config = await getAzulConfig();

  if (!config) {
    throw new Error('Azul payment gateway is not configured or not enabled');
  }

  const currencyCode = params.currency || '$';
  const amountFormatted = Math.round(params.amount * 100).toString();
  const itbisFormatted = params.itbis ? Math.round(params.itbis * 100).toString() : '0';

  const paymentParams: Record<string, string> = {
    MerchantId: config.merchantId,
    MerchantName: config.merchantName,
    MerchantType: config.merchantType,
    CurrencyCode: currencyCode,
    OrderNumber: params.orderNumber,
    Amount: amountFormatted,
    ITBIS: itbisFormatted,
    ApprovedUrl: config.callbackUrls.approved,
    DeclinedUrl: config.callbackUrls.declined,
    CancelUrl: config.callbackUrls.cancel,
    UseCustomField1: '0',
    CustomField1Label: 'Custom1',
    CustomField1Value: 'Value1',
    UseCustomField2: '0',
    CustomField2Label: 'Custom2',
    CustomField2Value: 'Value2',
  };

  const authHash = generateAzulAuthHash(paymentParams, config.secretKey);

  return {
    paymentUrl: config.baseUrl,
    paymentData: {
      ...paymentParams,
      AuthHash: authHash,
      ShowTransactionResult: '0',
    },
    config: {
      isSandbox: config.isSandbox,
      merchantId: config.merchantId,
    },
  };
}

export async function verifyAzulResponse(data: any, receivedAuthHash?: string): Promise<AzulPaymentResponse> {
  const validated = azulCallbackSchema.parse(data);

  if (receivedAuthHash) {
    const config = await getAzulConfig();
    if (!config) {
      throw new Error('Azul payment gateway is not configured');
    }

    const callbackParams: Record<string, string> = {
      OrderNumber: validated.OrderNumber || '',
      Amount: validated.Amount || '',
      AuthorizationCode: validated.AuthorizationCode || '',
      DateTime: validated.DateTime || '',
      ResponseCode: validated.ResponseCode || '',
      IsoCode: validated.IsoCode || '',
      ResponseMessage: validated.ResponseMessage || '',
      ErrorDescription: validated.ErrorDescription || '',
      RRN: validated.RRN || '',
    };

    const localHash = generateAzulAuthHash(callbackParams, config.secretKey);

    if (localHash !== receivedAuthHash) {
      throw new Error('Invalid Azul response signature - possible tampering detected');
    }
  }

  return validated;
}

export interface ProcessAzulCallbackResult {
  success: boolean;
  orderNumber: string;
  amount: string;
  authorizationCode?: string;
  responseCode?: string;
  responseMessage?: string;
  transactionDetails: AzulPaymentResponse;
}

export async function processAzulCallback(callbackData: any, authHash?: string): Promise<ProcessAzulCallbackResult> {
  const transactionDetails = await verifyAzulResponse(callbackData, authHash);

  const success = isAzulTransactionApproved(transactionDetails.ResponseCode);

  return {
    success,
    orderNumber: transactionDetails.OrderNumber,
    amount: transactionDetails.Amount,
    authorizationCode: transactionDetails.AuthorizationCode,
    responseCode: transactionDetails.ResponseCode,
    responseMessage: transactionDetails.ResponseMessage || getAzulResponseMessage(transactionDetails.ResponseCode),
    transactionDetails,
  };
}

export interface CreateAzulRefundParams {
  originalOrderNumber: string;
  originalAuthCode: string;
  refundAmount: number;
  currency?: string;
}

export async function createAzulRefund(params: CreateAzulRefundParams) {
  const config = await getAzulConfig();

  if (!config) {
    throw new Error('Azul payment gateway is not configured or not enabled');
  }

  const currency = params.currency || 'DOP';
  const amountFormatted = formatAmountForAzul(params.refundAmount);

  const refundOrderNumber = `REFUND_${params.originalOrderNumber}_${Date.now()}`;

  const authHash = generateAzulHash({
    merchantId: config.merchantId,
    merchantName: config.merchantName,
    merchantType: config.merchantType,
    orderNumber: refundOrderNumber,
    amount: amountFormatted,
    currency: currency,
    authToken: config.authToken,
  });

  return {
    refundOrderNumber,
    merchantId: config.merchantId,
    merchantName: config.merchantName,
    merchantType: config.merchantType,
    amount: amountFormatted,
    currency,
    authHash,
    originalOrderNumber: params.originalOrderNumber,
    originalAuthCode: params.originalAuthCode,
  };
}
