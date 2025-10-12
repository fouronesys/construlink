import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq, and, desc, ilike, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  suppliers, 
  users, 
  supplierSpecialties, 
  subscriptions, 
  payments, 
  reviews, 
  verifications,
  supplierClaims,
  products,
  insertSupplierSchema,
  insertQuoteRequestSchema,
  insertProductSchema,
  insertSupplierClaimSchema,
  insertSupplierPublicationSchema,
  insertPaidAdvertisementSchema,
  insertAdvertisementRequestSchema,
  registerSchema, 
  loginSchema,
  logAdminActionSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  updateUserEmailSchema,
  updateUserPasswordSchema,
  updatePlatformConfigSchema,
  createRefundSchema,
  processRefundSchema,
  createInvoiceSchema,
  type InsertSupplier,
  type Supplier,
  type RegisterData,
  type LoginData,
  type PlanUsage
} from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, hasRole, hashPassword, comparePassword, checkEnvAdminCredentials } from "./auth";
import { storage } from "./storage";
import { upload } from "./upload";
import { canCreatePublication, getPublicationLimit } from "@shared/plan-limits";

// Simulate Verifone payment processing (replace with actual API integration)
async function simulateVerifonePayment(paymentData: any) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate payment validation
  const isValidCard = paymentData.cardNumber.length >= 16;
  const isValidExpiry = paymentData.expiryDate.match(/^\d{2}\/\d{2}$/);
  const isValidCvv = paymentData.cvv.length >= 3;

  if (!isValidCard || !isValidExpiry || !isValidCvv) {
    return {
      success: false,
      error: "Invalid payment information"
    };
  }

  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  if (success) {
    return {
      success: true,
      transactionId: `VF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authCode: `AUTH_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      message: "Payment processed successfully"
    };
  } else {
    return {
      success: false,
      error: "Payment declined by bank"
    };
  }
}

const MONTHLY_SUBSCRIPTION_AMOUNT = 1000; // RD$1000

// Verifone configuration
const VERIFONE_CONFIG = {
  MERCHANT_CODE: "255630281234",
  SECRET_KEY: "wJ6EzkDrNV&AR~*!IC#G",
  BASE_URL: "https://sandbox.verifone.com.do/api", // Use production URL when ready
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "El usuario ya existe con este email" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const newUser = await db.insert(users).values({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
      }).returning();

      // If user is a supplier, also create supplier profile
      if (validatedData.role === 'supplier' && validatedData.rnc && validatedData.legalName) {
        await db.insert(suppliers).values({
          userId: newUser[0].id,
          legalName: validatedData.legalName,
          rnc: validatedData.rnc,
          phone: validatedData.phone || '',
          email: validatedData.email,
          location: validatedData.location || '',
          status: 'pending',
        });
      }

      res.status(201).json({ 
        message: "Usuario creado exitosamente",
        user: { 
          id: newUser[0].id, 
          email: newUser[0].email, 
          firstName: newUser[0].firstName,
          lastName: newUser[0].lastName,
          role: newUser[0].role 
        }
      });
    } catch (error) {
      console.error("Error in register:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Check environment-based admin credentials first
      const envAdmin = checkEnvAdminCredentials(validatedData.email, validatedData.password);
      if (envAdmin) {
        req.session.userId = envAdmin.id;
        
        return res.json({ 
          message: "Login exitoso",
          user: { 
            id: envAdmin.id, 
            email: envAdmin.email, 
            firstName: envAdmin.firstName,
            lastName: envAdmin.lastName,
            role: envAdmin.role,
            supplier: null
          }
        });
      }

      // Find user in database
      const user = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1);
      if (!user.length) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Check password
      const isValidPassword = await comparePassword(validatedData.password, user[0].password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Update last login
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user[0].id));

      // Set session
      req.session.userId = user[0].id;

      // Get supplier info if user is a supplier
      let supplier = null;
      if (user[0].role === 'supplier') {
        const supplierData = await db.select().from(suppliers).where(eq(suppliers.userId, user[0].id)).limit(1);
        supplier = supplierData.length > 0 ? supplierData[0] : null;
        
        // Check if supplier has an active subscription - but allow login anyway
        if (supplier) {
          const activeSubscription = await db.select().from(subscriptions)
            .where(and(
              eq(subscriptions.supplierId, supplier.id),
              eq(subscriptions.status, 'active')
            )).limit(1);
          
          // Allow bypass in test mode
          const testMode = process.env.TEST_MODE === 'true';
          (supplier as any).hasActiveSubscription = testMode || activeSubscription.length > 0;
        } else if (user[0].role === 'supplier') {
          // Supplier role but no supplier profile - needs setup
          supplier = { hasActiveSubscription: false, needsSetup: true };
        }
      }

      res.json({ 
        message: "Login exitoso",
        user: { 
          id: user[0].id, 
          email: user[0].email, 
          firstName: user[0].firstName,
          lastName: user[0].lastName,
          role: user[0].role,
          supplier
        }
      });
    } catch (error) {
      console.error("Error in login:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Sesión cerrada exitosamente" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      // The user is already attached by the isAuthenticated middleware
      const user = (req as any).user;
      
      // Get supplier info if user is a supplier
      let supplier = null;
      if (user.role === 'supplier') {
        const supplierData = await db.select().from(suppliers).where(eq(suppliers.userId, user.id)).limit(1);
        supplier = supplierData.length > 0 ? supplierData[0] : null;
        
        // Check if supplier has an active subscription
        if (supplier) {
          const activeSubscription = await db.select().from(subscriptions)
            .where(and(
              eq(subscriptions.supplierId, supplier.id),
              eq(subscriptions.status, 'active')
            )).limit(1);
          
          // Allow bypass in test mode
          const testMode = process.env.TEST_MODE === 'true';
          (supplier as any).hasActiveSubscription = testMode || activeSubscription.length > 0;
        }
      }
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        supplier
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // RNC validation endpoint
  app.post('/api/validate-rnc', async (req, res) => {
    try {
      const { rnc } = req.body;
      
      if (!rnc) {
        return res.status(400).json({ message: "RNC is required" });
      }

      const token = process.env.RNC_API_TOKEN;
      if (!token) {
        return res.status(500).json({ message: "RNC API token not configured" });
      }

      // Call external RNC validation service
      const response = await fetch('https://fouronerncvalidator.onrender.com/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rnc }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ message: data.message || "RNC validation failed" });
      }

      res.json(data);
    } catch (error) {
      console.error("Error validating RNC:", error);
      res.status(500).json({ message: "Failed to validate RNC" });
    }
  });

  // Supplier registration
  app.post('/api/suppliers/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user.length) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Validate input
      const supplierData = {
        ...req.body,
        userId,
        email: user[0].email,
      };

      // Check if RNC already exists
      const existingSupplier = await db.select().from(suppliers).where(eq(suppliers.rnc, supplierData.rnc)).limit(1);
      if (existingSupplier.length > 0) {
        return res.status(400).json({ message: "RNC ya está registrado" });
      }

      // Create supplier
      const newSupplier = await db.insert(suppliers).values({
        userId: supplierData.userId,
        legalName: supplierData.legalName,
        rnc: supplierData.rnc,
        phone: supplierData.phone,
        email: supplierData.email,
        location: supplierData.location,
        description: supplierData.description,
        website: supplierData.website,
        profileImageUrl: supplierData.profileImageUrl,
      }).returning();

      // Add specialties
      const specialtiesList: string[] = [];
      if (req.body.specialties && Array.isArray(req.body.specialties)) {
        for (const specialty of req.body.specialties) {
          await db.insert(supplierSpecialties).values({
            supplierId: newSupplier[0].id,
            specialty,
          });
          specialtiesList.push(specialty);
        }
      }

      // Update user role
      await db.update(users).set({ role: 'supplier' }).where(eq(users.id, userId));

      // Generate embedding for the new supplier (asynchronously, don't wait)
      const { ensureSupplierEmbedding } = await import('./services/init-embeddings.js');
      ensureSupplierEmbedding(newSupplier[0].id).catch(err => {
        console.error('Error generating embedding for new supplier:', err);
      });

      res.json(newSupplier[0]);
    } catch (error) {
      console.error("Error registering supplier:", error);
      res.status(500).json({ message: "Failed to register supplier" });
    }
  });

  // Create subscription with Verifone
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      // Support both old format (plan) and new format (planId, planName, monthlyAmount)
      const { plan, planId, planName, monthlyAmount } = req.body;
      const selectedPlan = planId || plan || 'basic';
      
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const supplier = await db.select().from(suppliers).where(eq(suppliers.userId, userId)).limit(1);

      if (!user.length || !supplier.length) {
        return res.status(404).json({ message: "Usuario o proveedor no encontrado" });
      }

      // Check if supplier already has an active subscription
      const existingSubscription = await db.select().from(subscriptions)
        .where(and(
          eq(subscriptions.supplierId, supplier[0].id),
          inArray(subscriptions.status, ['active', 'trialing'])
        )).limit(1);
      
      // Plan pricing
      const planPricing: Record<string, number> = {
        basic: 1000,
        professional: 2500,
        enterprise: 5000
      };

      const amount = monthlyAmount || planPricing[selectedPlan] || 1000;
      
      if (existingSubscription.length > 0) {
        // Update existing subscription plan instead of blocking
        await db.update(subscriptions).set({ 
          plan: selectedPlan as 'basic' | 'professional' | 'enterprise',
          monthlyAmount: amount.toString(),
          status: 'inactive'
        }).where(eq(subscriptions.id, existingSubscription[0].id));
        
        return res.json({
          subscriptionId: existingSubscription[0].verifoneSubscriptionId,
          paymentSession: {
            subscriptionId: existingSubscription[0].verifoneSubscriptionId,
            amount,
            currency: 'DOP',
            plan: selectedPlan,
            description: `Actualización a Plan ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`,
          },
          amount,
          plan: selectedPlan,
          message: "Subscription updated successfully"
        });
      }

      // Generate unique Verifone subscription ID
      const verifoneSubscriptionId = `vf_sub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create subscription record
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // Monthly subscription

      await db.insert(subscriptions).values({
        supplierId: supplier[0].id,
        verifoneSubscriptionId: verifoneSubscriptionId,
        currentPeriodStart: currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd,
        status: 'inactive',
        plan: selectedPlan as 'basic' | 'professional' | 'enterprise',
        monthlyAmount: amount.toString()
      });

      // Generate payment session for Verifone
      const paymentSession = {
        subscriptionId: verifoneSubscriptionId,
        amount,
        currency: 'DOP',
        plan: selectedPlan,
        description: `Suscripción mensual - Plan ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`,
        redirectUrl: `${req.protocol}://${req.get('host')}/supplier-dashboard?payment=success`,
        cancelUrl: `${req.protocol}://${req.get('host')}/register?payment=cancelled`
      };

      res.json({
        subscriptionId: verifoneSubscriptionId,
        paymentSession: paymentSession,
        amount,
        plan: selectedPlan,
        message: "Subscription created successfully"
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Calculate prorated amount for plan change
  app.post('/api/subscriptions/:id/calculate-prorate', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { newPlan, newBillingCycle } = req.body;
      
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      const { calculateProratedAmount } = await import('./subscription-service');
      const calculation = calculateProratedAmount(subscription, newPlan, newBillingCycle || "monthly");
      
      res.json({ success: true, calculation });
    } catch (error) {
      console.error("Error calculating prorate:", error);
      res.status(500).json({ message: "Failed to calculate prorated amount" });
    }
  });

  // Change subscription plan (upgrade/downgrade)
  app.post('/api/subscriptions/:id/change-plan', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { newPlan, newBillingCycle } = req.body;
      
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Verify user owns this subscription
      const supplier = await storage.getSupplier(subscription.supplierId);
      if (!supplier || supplier.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { changePlan } = await import('./subscription-service');
      const result = await changePlan(storage, id, newPlan, newBillingCycle || "monthly");
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json(result);
    } catch (error) {
      console.error("Error changing plan:", error);
      res.status(500).json({ message: "Failed to change plan" });
    }
  });

  // Cancel subscription
  app.post('/api/subscriptions/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { immediate } = req.body;
      
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Verify user owns this subscription
      const supplier = await storage.getSupplier(subscription.supplierId);
      if (!supplier || supplier.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { cancelSubscription } = await import('./subscription-service');
      const result = await cancelSubscription(storage, id, immediate || false);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json(result);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Reactivate subscription
  app.post('/api/subscriptions/:id/reactivate', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Verify user owns this subscription
      const supplier = await storage.getSupplier(subscription.supplierId);
      if (!supplier || supplier.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { reactivateSubscription } = await import('./subscription-service');
      const result = await reactivateSubscription(storage, id);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json(result);
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ message: "Failed to reactivate subscription" });
    }
  });

  // Extend trial (admin only)
  app.post('/api/admin/subscriptions/:id/extend-trial', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { additionalDays } = req.body;
      
      if (!additionalDays || additionalDays <= 0) {
        return res.status(400).json({ message: "Invalid number of days" });
      }

      const { extendTrial } = await import('./subscription-service');
      const result = await extendTrial(storage, id, additionalDays);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      // Log admin action
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'extend_trial',
          entityType: 'subscription',
          entityId: id,
          details: { additionalDays },
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error extending trial:", error);
      res.status(500).json({ message: "Failed to extend trial" });
    }
  });

  // Card validation function
  function validateCreditCard(cardNumber: string, expiryDate: string, cvv: string) {
    // Basic Luhn algorithm check
    const luhnCheck = (num: string) => {
      let sum = 0;
      let isEven = false;
      for (let i = num.length - 1; i >= 0; i--) {
        let digit = parseInt(num[i]);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0;
    };

    // Check card number length and format
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return { valid: false, message: 'Número de tarjeta inválido' };
    }

    if (!/^\d+$/.test(cardNumber)) {
      return { valid: false, message: 'El número de tarjeta debe contener solo números' };
    }

    if (!luhnCheck(cardNumber)) {
      return { valid: false, message: 'Número de tarjeta inválido' };
    }

    // Check expiry date
    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const now = new Date();
    
    if (expiry <= now) {
      return { valid: false, message: 'La tarjeta ha expirado' };
    }

    // Check CVV
    if (cvv.length < 3 || cvv.length > 4) {
      return { valid: false, message: 'CVV inválido' };
    }

    return { valid: true, message: 'Valid card' };
  }

  // Process real Verifone payment
  async function processVerifonePayment(paymentMethod: any, amount: number, subscriptionId: string): Promise<{ success: true; transactionId: string } | { success: false; error: string; message: string }> {
    const axios = require('axios');
    
    const VERIFONE_MERCHANT_ID = process.env.VERIFONE_MERCHANT_ID;
    const VERIFONE_SECRET_KEY = process.env.VERIFONE_SECRET_KEY;
    const VERIFONE_API_URL = process.env.VERIFONE_API_URL || 'https://sandbox.2checkout.com';
    
    if (!VERIFONE_MERCHANT_ID || !VERIFONE_SECRET_KEY) {
      console.error('Verifone credentials not configured');
      return {
        success: false,
        error: 'CONFIG_ERROR',
        message: 'Configuración de pagos no disponible. Contacta al administrador.'
      };
    }

    try {
      // Prepare payment data for Verifone/2checkout API
      const [month, year] = paymentMethod.expiryDate.split('/');
      
      const paymentData = {
        Currency: 'DOP',
        Language: 'es',
        Country: 'DO',
        CustomerIP: '127.0.0.1',
        ExternalReference: subscriptionId,
        Source: 'fourone_suppliers_platform',
        BillingDetails: {
          FirstName: paymentMethod.cardName.split(' ')[0] || 'Nombre',
          LastName: paymentMethod.cardName.split(' ').slice(1).join(' ') || 'Apellido',
          CountryCode: 'DO',
          Email: 'billing@example.com',
          Phone: '8001234567',
          City: 'Santo Domingo',
          State: 'Distrito Nacional',
          Address: 'Calle Principal #123',
          Zip: '10101'
        },
        PaymentDetails: {
          Type: 'CC',
          Currency: 'DOP',
          CustomerIP: '127.0.0.1',
          PaymentMethod: {
            CardNumber: paymentMethod.cardNumber.replace(/\s/g, ''),
            CardType: getCardType(paymentMethod.cardNumber),
            ExpirationMonth: month,
            ExpirationYear: `20${year}`,
            CCID: paymentMethod.cvv,
            HolderName: paymentMethod.cardName
          }
        },
        Items: [{
          Name: 'Suscripción Mensual',
          Description: 'Suscripción mensual plataforma proveedores',
          Quantity: 1,
          IsDynamic: true,
          Tangible: false,
          ProductId: 'subscription_monthly',
          Price: {
            Amount: amount,
            Type: 'CUSTOM'
          }
        }],
        PaymentMethod: 'CreditCard'
      };

      // Make API call to Verifone
      const response = await axios.post(`${VERIFONE_API_URL}/rest/6.0/orders/`, paymentData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Avangate-Authentication': Buffer.from(`${VERIFONE_MERCHANT_ID}:${VERIFONE_SECRET_KEY}`).toString('base64')
        },
        timeout: 30000
      });

      if (response.data && response.data.RefNo) {
        return {
          success: true,
          transactionId: response.data.RefNo
        };
      } else {
        return {
          success: false,
          error: 'PAYMENT_FAILED',
          message: 'No se pudo procesar el pago. Verifica los datos de tu tarjeta.'
        };
      }

    } catch (error: any) {
      console.error('Verifone API Error:', error.response?.data || error.message);
      
      if (error.response?.data?.error_code) {
        const errorCode = error.response.data.error_code;
        const errorMap: { [key: string]: string } = {
          'CARD_DECLINED': 'Tarjeta declinada por el banco',
          'INSUFFICIENT_FUNDS': 'Fondos insuficientes',
          'INVALID_CARD': 'Número de tarjeta inválido',
          'EXPIRED_CARD': 'Tarjeta expirada',
          'INVALID_CVV': 'Código CVV incorrecto',
          'PROCESSING_ERROR': 'Error procesando el pago'
        };
        
        return {
          success: false,
          error: errorCode,
          message: errorMap[errorCode] || 'Error procesando el pago. Inténtalo de nuevo.'
        };
      }
      
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
      };
    }
  }

  // Helper function to detect card type
  function getCardType(cardNumber: string): string {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'VISA';
    if (number.startsWith('5') || number.startsWith('2')) return 'MASTERCARD';
    if (number.startsWith('3')) return 'AMEX';
    return 'VISA'; // Default
  }

  // Verifone payment webhook
  app.post('/api/webhooks/verifone', async (req, res) => {
    try {
      const { subscriptionId, transactionId, status, amount, currency } = req.body;
      
      // Find subscription by Verifone subscription ID
      const subscription = await storage.getSubscriptionByVerifoneId(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Create payment record
      const payment = await storage.createPayment({
        subscriptionId: subscription.id,
        amount: amount.toString(),
        currency: currency || 'DOP',
        status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
        verifoneTransactionId: transactionId,
      });

      // Update subscription status based on payment
      if (status === 'completed') {
        const nextPeriodEnd = new Date(subscription.currentPeriodEnd || new Date());
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        
        await storage.updateSubscription(subscription.id, {
          status: 'active',
          currentPeriodStart: subscription.currentPeriodEnd || new Date(),
          currentPeriodEnd: nextPeriodEnd,
        });

        // Auto-generate invoice for completed payment
        try {
          const invoiceNumber = await storage.getNextInvoiceNumber();
          const paymentAmount = Number(payment.amount);
          
          // Calculate ITBIS (18% tax) with proper 2-decimal rounding per DR fiscal requirements
          const itbis = Math.round(paymentAmount * 0.18 * 100) / 100;
          const total = Math.round((paymentAmount + itbis) * 100) / 100;

          // Get NCF sequence from platform config (optional)
          let ncf: string | undefined = undefined;
          let ncfSequence: string | undefined = undefined;
          const ncfConfig = await storage.getPlatformConfig('default_ncf_sequence');
          if (ncfConfig && ncfConfig.configValue && typeof ncfConfig.configValue === 'string') {
            ncfSequence = ncfConfig.configValue;
            ncf = await storage.getNextNCF(ncfSequence);
          }

          await storage.createInvoice({
            paymentId: payment.id,
            supplierId: subscription.supplierId,
            invoiceNumber,
            ncf,
            ncfSequence,
            subtotal: paymentAmount.toFixed(2),
            itbis: itbis.toFixed(2),
            total: total.toFixed(2),
            currency: payment.currency || 'DOP',
            status: 'sent',
            notes: 'Factura generada automáticamente por pago de suscripción',
          });
        } catch (invoiceError) {
          console.error("Error generating invoice:", invoiceError);
          // Don't fail the webhook if invoice generation fails
        }
      } else if (status === 'failed') {
        await storage.updateSubscription(subscription.id, {
          status: 'inactive',
        });
      }

      res.json({ message: "Webhook processed successfully" });
    } catch (error) {
      console.error("Error processing Verifone webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });



  // Get featured suppliers (public endpoint)
  app.get('/api/suppliers/featured', async (req, res) => {
    try {
      const featuredSuppliers = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.status, 'approved'), eq(suppliers.isFeatured, true)))
        .limit(10);

      // Get specialties and banners for each featured supplier
      const suppliersWithSpecialties = await Promise.all(
        featuredSuppliers.map(async (supplier) => {
          const specialties = await storage.getSupplierSpecialties(supplier.id);
          const banners = await storage.getBannersBySupplierId(supplier.id);
          
          // Get banners for each device type
          const desktopBanner = banners.find(b => b.deviceType === 'desktop' && b.isActive);
          const tabletBanner = banners.find(b => b.deviceType === 'tablet' && b.isActive);
          const mobileBanner = banners.find(b => b.deviceType === 'mobile' && b.isActive);
          
          // Fallback to first available active banner if specific type not found
          const fallbackBanner = banners.find(b => b.isActive);
          
          return {
            id: supplier.id,
            legalName: supplier.legalName,
            location: supplier.location,
            description: supplier.description,
            bannerImageUrl: desktopBanner?.imageUrl || fallbackBanner?.imageUrl || supplier.bannerImageUrl,
            bannerImageUrlTablet: tabletBanner?.imageUrl || desktopBanner?.imageUrl || fallbackBanner?.imageUrl || supplier.bannerImageUrl,
            bannerImageUrlMobile: mobileBanner?.imageUrl || tabletBanner?.imageUrl || fallbackBanner?.imageUrl || supplier.bannerImageUrl,
            specialties: specialties.map(s => s.specialty),
            bannerId: desktopBanner?.id || fallbackBanner?.id, // Include banner ID for tracking (use desktop banner for tracking)
            bannerLinkUrl: desktopBanner?.linkUrl || fallbackBanner?.linkUrl, // Include link URL for navigation
          };
        })
      );

      res.json(suppliersWithSpecialties);
    } catch (error) {
      console.error("Error fetching featured suppliers:", error);
      res.status(500).json({ message: "Failed to fetch featured suppliers" });
    }
  });

  // Get featured suppliers banners (public endpoint for carousel)
  app.get('/api/suppliers/featured/banners', async (req, res) => {
    try {
      const banners = await storage.getActiveFeaturedBanners();
      res.json(banners);
    } catch (error) {
      console.error("Error fetching featured banners:", error);
      res.status(500).json({ message: "Failed to fetch featured banners" });
    }
  });

  // Track banner click (public endpoint)
  app.post('/api/banners/:id/click', async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Banner ID is required" });
      }
      
      const success = await storage.incrementBannerClicks(id);
      
      if (!success) {
        return res.status(404).json({ message: "Banner not found" });
      }
      
      res.json({ message: "Click recorded" });
    } catch (error) {
      console.error("Error recording banner click:", error);
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  // Track banner impression (public endpoint)
  app.post('/api/banners/:id/impression', async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Banner ID is required" });
      }
      
      const success = await storage.incrementBannerImpressions(id);
      
      if (!success) {
        return res.status(404).json({ message: "Banner not found" });
      }
      
      res.json({ message: "Impression recorded" });
    } catch (error) {
      console.error("Error recording banner impression:", error);
      res.status(500).json({ message: "Failed to record impression" });
    }
  });

  // Get active publications (public endpoint)
  app.get('/api/publications', async (req, res) => {
    try {
      const { limit = '10', offset = '0', category } = req.query;
      
      const publications = await storage.getActivePublications({
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        category: category as string,
      });

      res.json(publications);
    } catch (error) {
      console.error("Error fetching publications:", error);
      res.status(500).json({ message: "Failed to fetch publications" });
    }
  });

  // Get daily rotating publications (public endpoint)
  app.get('/api/publications/daily-rotation', async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      
      const publications = await storage.getDailyRotationPublications(parseInt(limit as string));

      res.json(publications);
    } catch (error) {
      console.error("Error fetching daily rotation publications:", error);
      res.status(500).json({ message: "Failed to fetch daily rotation publications" });
    }
  });

  // Track publication view (public endpoint)
  app.post('/api/publications/:id/view', async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Publication ID is required" });
      }
      
      const success = await storage.incrementPublicationViews(id);
      
      if (!success) {
        return res.status(404).json({ message: "Publication not found" });
      }
      
      res.json({ message: "View recorded" });
    } catch (error) {
      console.error("Error recording publication view:", error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // Get active advertisements (public endpoint)
  app.get('/api/advertisements', async (req, res) => {
    try {
      const { displayLocation = 'content', limit = '5' } = req.query;
      
      const advertisements = await storage.getActiveAdvertisements({
        displayLocation: displayLocation as string,
        limit: parseInt(limit as string),
      });

      res.json(advertisements);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  // Track advertisement click (public endpoint)
  app.post('/api/advertisements/:id/click', async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Advertisement ID is required" });
      }
      
      const success = await storage.incrementAdvertisementClicks(id);
      
      if (!success) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json({ message: "Click recorded" });
    } catch (error) {
      console.error("Error recording advertisement click:", error);
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  // Track advertisement impression (public endpoint)
  app.post('/api/advertisements/:id/impression', async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Advertisement ID is required" });
      }
      
      const success = await storage.incrementAdvertisementImpressions(id);
      
      if (!success) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json({ message: "Impression recorded" });
    } catch (error) {
      console.error("Error recording advertisement impression:", error);
      res.status(500).json({ message: "Failed to record impression" });
    }
  });

  // Create supplier publication (authenticated suppliers only)
  app.post('/api/suppliers/publications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can create publications" });
      }

      // Verificar el límite de publicaciones según el plan
      const subscription = await storage.getSubscriptionBySupplierId(supplier.id);
      const plan = subscription?.plan || 'basic';
      const currentCount = await storage.getPublicationsCountBySupplierId(supplier.id);
      
      if (!canCreatePublication(plan, currentCount)) {
        const limit = getPublicationLimit(plan);
        return res.status(403).json({ 
          message: `Has alcanzado el límite de ${limit} publicaciones para tu plan ${plan}. Actualiza tu plan para crear más publicaciones.` 
        });
      }

      const validationResult = insertSupplierPublicationSchema.safeParse({
        ...req.body,
        supplierId: supplier.id,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid publication data", 
          errors: validationResult.error.errors 
        });
      }

      const publication = await storage.createPublication(validationResult.data);
      res.status(201).json(publication);
    } catch (error) {
      console.error("Error creating publication:", error);
      res.status(500).json({ message: "Failed to create publication" });
    }
  });

  // Get supplier's own publications
  app.get('/api/suppliers/publications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can view their publications" });
      }

      const publications = await storage.getPublicationsBySupplierId(supplier.id);
      res.json(publications);
    } catch (error) {
      console.error("Error fetching supplier publications:", error);
      res.status(500).json({ message: "Failed to fetch publications" });
    }
  });

  // Update supplier publication
  app.patch('/api/suppliers/publications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can update publications" });
      }

      // Get the publication to verify ownership
      const publications = await storage.getPublicationsBySupplierId(supplier.id);
      const publication = publications.find(p => p.id === id);
      
      if (!publication) {
        return res.status(404).json({ message: "Publication not found or you don't have permission to update it" });
      }

      // Validate updates with partial schema
      const updateSchema = insertSupplierPublicationSchema.partial().pick({
        title: true,
        content: true,
        imageUrl: true,
        category: true,
        isActive: true,
      });

      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: validationResult.error.errors 
        });
      }

      const updatedPublication = await storage.updatePublication(id, validationResult.data);
      res.json(updatedPublication);
    } catch (error) {
      console.error("Error updating publication:", error);
      res.status(500).json({ message: "Failed to update publication" });
    }
  });

  // Delete supplier publication
  app.delete('/api/suppliers/publications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can delete publications" });
      }

      // Get the publication to verify ownership
      const publications = await storage.getPublicationsBySupplierId(supplier.id);
      const publication = publications.find(p => p.id === id);
      
      if (!publication) {
        return res.status(404).json({ message: "Publication not found or you don't have permission to delete it" });
      }

      await storage.deletePublication(id);
      res.json({ message: "Publication deleted successfully" });
    } catch (error) {
      console.error("Error deleting publication:", error);
      res.status(500).json({ message: "Failed to delete publication" });
    }
  });

  // Create advertisement request (suppliers only)
  app.post('/api/advertisement-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can request advertisements" });
      }

      const validationResult = insertAdvertisementRequestSchema.safeParse({
        ...req.body,
        supplierId: supplier.id,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      // Verify the publication belongs to this supplier
      const publication = await storage.getPublication(validationResult.data.publicationId);
      if (!publication || publication.supplierId !== supplier.id) {
        return res.status(403).json({ message: "Publication not found or doesn't belong to you" });
      }

      // Check for existing pending request for this publication
      const existingRequests = await storage.getAdvertisementRequestsBySupplierId(supplier.id);
      const hasPendingRequest = existingRequests.some(
        req => req.publicationId === validationResult.data.publicationId && req.status === 'pending'
      );
      
      if (hasPendingRequest) {
        return res.status(400).json({ 
          message: "You already have a pending advertisement request for this publication" 
        });
      }

      const request = await storage.createAdvertisementRequest(validationResult.data);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating advertisement request:", error);
      res.status(500).json({ message: "Failed to create advertisement request" });
    }
  });

  // Get supplier's own advertisement requests
  app.get('/api/advertisement-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can view advertisement requests" });
      }

      const requests = await storage.getAdvertisementRequestsBySupplierId(supplier.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching advertisement requests:", error);
      res.status(500).json({ message: "Failed to fetch advertisement requests" });
    }
  });

  // Get single advertisement request
  app.get('/api/advertisement-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(403).json({ message: "Only suppliers can view advertisement requests" });
      }

      const request = await storage.getAdvertisementRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Advertisement request not found" });
      }

      // Verify ownership
      if (request.supplierId !== supplier.id) {
        return res.status(403).json({ message: "You don't have permission to view this request" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching advertisement request:", error);
      res.status(500).json({ message: "Failed to fetch advertisement request" });
    }
  });


  // Get suppliers (public endpoint with filters)
  app.get('/api/suppliers', async (req, res) => {
    try {
      const { status = 'approved', specialty, location, search, sortBy = 'featured', page = '1', limit = '12' } = req.query;
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const suppliers = await storage.getSuppliers({
        status: status as string,
        specialty: specialty as string,
        location: location as string,
        search: search as string,
        sortBy: sortBy as string,
        limit: parseInt(limit as string),
        offset,
      });

      // Get total count for pagination
      const allSuppliers = await storage.getSuppliers({
        status: status as string,
        specialty: specialty as string,
        location: location as string,
        search: search as string,
        sortBy: sortBy as string,
      });
      const total = allSuppliers.length;
      const totalPages = Math.ceil(total / parseInt(limit as string));

      // Get specialties for each supplier
      const suppliersWithSpecialties = await Promise.all(
        suppliers.map(async (supplier) => {
          const specialties = await storage.getSupplierSpecialties(supplier.id);
          const reviews = await storage.getReviewsBySupplierId(supplier.id);
          const stats = await storage.getSupplierStats(supplier.id);
          
          return {
            ...supplier,
            specialties: specialties.map(s => s.specialty),
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews,
          };
        })
      );

      res.json({
        suppliers: suppliersWithSpecialties,
        total,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Get single supplier
  app.get('/api/suppliers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const specialties = await storage.getSupplierSpecialties(id);
      const products = await storage.getProductsBySupplierId(id);
      const services = await storage.getServicesBySupplierId(id);
      const reviews = await storage.getReviewsBySupplierId(id);
      const stats = await storage.getSupplierStats(id);

      res.json({
        ...supplier,
        specialties: specialties.map(s => s.specialty),
        products,
        services,
        reviews,
        stats,
      });
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  // Check if supplier can be claimed
  app.get('/api/suppliers/:id/claim-status', async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Check if supplier is already claimed
      const canBeClaimed = !supplier.isClaimed;
      
      // Check if there's already a pending claim for this supplier
      const pendingClaims = await db
        .select()
        .from(supplierClaims)
        .where(
          and(
            eq(supplierClaims.supplierId, id),
            eq(supplierClaims.status, 'pending')
          )
        );

      res.json({
        canBeClaimed,
        hasPendingClaim: pendingClaims.length > 0,
        supplier: {
          id: supplier.id,
          legalName: supplier.legalName,
          rnc: supplier.rnc,
          location: supplier.location,
        }
      });
    } catch (error) {
      console.error("Error checking claim status:", error);
      res.status(500).json({ message: "Failed to check claim status" });
    }
  });

  // Submit supplier claim request
  app.post('/api/suppliers/:id/claim', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Check if supplier can be claimed
      if (supplier.isClaimed) {
        return res.status(400).json({ message: "Esta empresa ya ha sido reclamada" });
      }

      // Check if user already has a pending claim for this supplier
      const existingClaim = await db
        .select()
        .from(supplierClaims)
        .where(
          and(
            eq(supplierClaims.supplierId, id),
            eq(supplierClaims.userId, userId),
            eq(supplierClaims.status, 'pending')
          )
        );

      if (existingClaim.length > 0) {
        return res.status(400).json({ message: "Ya tienes una solicitud de reclamación pendiente para esta empresa" });
      }

      // Validate claim data
      const claimData = insertSupplierClaimSchema.parse({
        supplierId: id,
        userId,
        email: req.body.email,
        rnc: req.body.rnc,
        message: req.body.message,
        documentUrls: req.body.documentUrls || [],
      });

      // Create claim request
      const claim = await db.insert(supplierClaims).values(claimData).returning();

      res.status(201).json({
        message: "Solicitud de reclamación enviada exitosamente",
        claim: claim[0]
      });
    } catch (error) {
      console.error("Error creating claim request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear solicitud de reclamación" });
    }
  });

  // Create quote request
  app.post('/api/quote-requests', async (req, res) => {
    try {
      const quoteRequestData = insertQuoteRequestSchema.parse(req.body);
      
      // Check if supplier exists and their plan limits
      const supplier = await storage.getSupplier(quoteRequestData.supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Check plan limits for quotes received
      const planLimits = await storage.getSupplierPlanLimits(supplier.id);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await storage.getPlanUsage(supplier.id, currentMonth);
      const currentQuotes = parseInt(usage?.quotesReceived || "0");

      if (planLimits.maxQuotes !== -1 && currentQuotes >= planLimits.maxQuotes) {
        return res.status(403).json({ 
          message: `El proveedor ha alcanzado su límite de cotizaciones mensuales (${planLimits.maxQuotes}). La cotización no puede ser enviada.`,
          planLimit: true,
          supplierPlan: planLimits.plan
        });
      }

      const quoteRequest = await storage.createQuoteRequest(quoteRequestData);
      
      // Update quote usage counter
      await storage.updatePlanUsage(supplier.id, currentMonth, {
        quotesReceived: String(currentQuotes + 1)
      });
      
      // TODO: Send email notification to supplier
      
      res.json(quoteRequest);
    } catch (error) {
      console.error("Error creating quote request:", error);
      res.status(500).json({ message: "Failed to create quote request" });
    }
  });

  // Check supplier subscription status
  app.get('/api/supplier/subscription-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        // User is supplier role but no supplier profile exists - needs to complete setup
        return res.json({
          hasActiveSubscription: false,
          needsSetup: true,
          message: "Supplier profile needs to be created"
        });
      }

      const subscription = await storage.getSubscriptionBySupplierId(supplier.id);
      
      // Allow bypass in test mode
      const testMode = process.env.TEST_MODE === 'true';
      const hasActiveSubscription = testMode || (subscription && subscription.status === 'active');

      res.json({
        hasActiveSubscription,
        needsSetup: false,
        subscription,
        supplier
      });
    } catch (error) {
      console.error("Error checking subscription status:", error);
      res.status(500).json({ message: "Failed to check subscription status" });
    }
  });

  // Supplier dashboard endpoints - now allows access without active subscription
  app.get('/api/supplier/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        // Return basic info for suppliers without profile
        return res.json({
          supplier: null,
          stats: { totalQuotes: 0, totalViews: 0, averageRating: 0 },
          recentQuotes: [],
          subscription: null,
        });
      }

      const stats = await storage.getSupplierStats(supplier.id);
      const quoteRequests = await storage.getQuoteRequestsBySupplierId(supplier.id);
      const subscription = await storage.getSubscriptionBySupplierId(supplier.id);

      res.json({
        supplier,
        stats,
        recentQuotes: quoteRequests.slice(0, 5),
        subscription,
      });
    } catch (error) {
      console.error("Error fetching supplier dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Supplier quotes
  app.get('/api/supplier/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const quotes = await storage.getQuoteRequestsBySupplierId(supplier.id);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching supplier quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  // Update quote status
  app.patch('/api/quote-requests/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updatedQuote = await storage.updateQuoteRequestStatus(id, status);
      res.json(updatedQuote);
    } catch (error) {
      console.error("Error updating quote status:", error);
      res.status(500).json({ message: "Failed to update quote status" });
    }
  });

  // Supplier products
  app.get('/api/supplier/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const products = await storage.getProductsBySupplierId(supplier.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create product
  app.post('/api/supplier/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Check plan limits
      const planLimits = await storage.getSupplierPlanLimits(supplier.id);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await storage.getPlanUsage(supplier.id, currentMonth);
      const currentProducts = parseInt(usage?.productsCount || "0");

      if (planLimits.maxProducts !== -1 && currentProducts >= planLimits.maxProducts) {
        return res.status(403).json({ 
          message: `Has alcanzado el límite de productos para tu plan (${planLimits.maxProducts}). Actualiza tu plan para agregar más productos.`,
          planLimit: true,
          currentUsage: currentProducts,
          maxAllowed: planLimits.maxProducts
        });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        supplierId: supplier.id,
      });

      const product = await storage.createProduct(productData);
      
      // Update usage counter
      await storage.updatePlanUsage(supplier.id, currentMonth, {
        productsCount: String(currentProducts + 1)
      });

      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Admin endpoints
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user; // User is already attached by isAuthenticated middleware
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin dashboard data
  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const stats = await storage.getAdminStats();
      const pendingSuppliers = await storage.getSuppliers({ status: 'pending', limit: 10 });
      
      res.json({
        stats,
        pendingSuppliers: pendingSuppliers.length,
        recentActivity: [], // This would come from an activity log system
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Admin suppliers list with filtering
  app.get('/api/admin/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, search, page, limit } = req.query;
      
      const parsedPage = page ? parseInt(page as string) : 1;
      const parsedLimit = limit ? parseInt(limit as string) : 50;
      const parsedOffset = (parsedPage - 1) * parsedLimit;
      
      const { suppliers, total } = await storage.getSuppliersWithCount({
        status: status && status !== 'all' ? status as string : undefined,
        search: search ? search as string : undefined,
        limit: !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50,
        offset: !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0,
      });

      // Get additional data for each supplier
      const suppliersWithDetails = await Promise.all(
        suppliers.map(async (supplier) => {
          const specialties = await storage.getSupplierSpecialties(supplier.id);
          const subscription = await storage.getSubscriptionBySupplierId(supplier.id);
          const stats = await storage.getSupplierStats(supplier.id);
          
          return {
            ...supplier,
            specialties: specialties.map(s => s.specialty),
            subscription,
            planType: subscription?.plan || 'basic',
            stats,
          };
        })
      );

      res.json({ suppliers: suppliersWithDetails, total });
    } catch (error) {
      console.error("Error fetching admin suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Admin approve/reject supplier
  app.patch('/api/admin/suppliers/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { status, comments } = req.body;

      // Update supplier status
      const updatedSupplier = await storage.updateSupplierStatus(id, status);

      // Create verification record
      await storage.createVerification({
        supplierId: id,
        adminId: user.id,
        decision: status === 'approved' ? 'approved' : 'rejected',
        comments: comments || null,
      });

      // If suspending, also suspend subscription
      if (status === 'suspended') {
        const subscription = await storage.getSubscriptionBySupplierId(id);
        if (subscription) {
          await storage.updateSubscription(subscription.id, { status: 'inactive' });
        }
      }

      // Auto-generate embedding when supplier is approved
      if (status === 'approved') {
        const { ensureSupplierEmbedding } = await import('./services/init-embeddings.js');
        ensureSupplierEmbedding(id).catch(err => {
          console.error('Error generating embedding for approved supplier:', err);
        });
      }

      // TODO: Send email notification to supplier about status change

      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier status:", error);
      res.status(500).json({ message: "Failed to update supplier status" });
    }
  });

  // Admin delete supplier
  app.delete('/api/admin/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Permisos insuficientes" });
      }

      const { id } = req.params;

      // Verify supplier exists
      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }

      // Delete supplier (cascade will delete related records)
      await storage.deleteSupplier(id);

      // Log admin action (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'delete',
          entityType: 'supplier',
          entityId: id,
          details: { supplierName: supplier.legalName, action: 'deleted' },
        });
      }

      res.json({ 
        success: true, 
        message: `Proveedor ${supplier.legalName} eliminado exitosamente` 
      });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Error al eliminar proveedor" });
    }
  });

  // Admin suspend/reactivate supplier subscription
  app.patch('/api/admin/suppliers/:id/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { action, reason } = req.body; // action: 'suspend' | 'reactivate'

      const subscription = await storage.getSubscriptionBySupplierId(id);
      
      if (!subscription) {
        return res.status(400).json({ 
          message: "Este proveedor no tiene una suscripción activa. El proveedor debe crear una suscripción primero." 
        });
      }

      const newStatus = action === 'suspend' ? 'inactive' : 'active';
      const updatedSubscription = await storage.updateSubscription(subscription.id, { 
        status: newStatus 
      });

      // Also update supplier status if needed
      if (action === 'suspend') {
        await storage.updateSupplierStatus(id, 'suspended');
      } else if (action === 'reactivate') {
        await storage.updateSupplierStatus(id, 'approved');
      }

      // Create verification record for the action
      await storage.createVerification({
        supplierId: id,
        adminId: user.id,
        decision: action === 'reactivate' ? 'approved' : 'rejected',
        comments: reason || `Subscription ${action}d by admin`,
      });

      res.json({ 
        subscription: updatedSubscription,
        message: `Subscription ${action}d successfully`
      });
    } catch (error) {
      console.error("Error updating subscription status:", error);
      res.status(500).json({ message: "Failed to update subscription status" });
    }
  });

  // Admin get subscription details
  app.get('/api/admin/suppliers/:id/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const subscription = await storage.getSubscriptionBySupplierId(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      const payments = await storage.getPaymentsBySubscriptionId(subscription.id);
      
      res.json({
        subscription,
        payments,
        paymentHistory: payments.slice(0, 10) // Last 10 payments
      });
    } catch (error) {
      console.error("Error fetching subscription details:", error);
      res.status(500).json({ message: "Failed to fetch subscription details" });
    }
  });

  // Admin get pending suppliers
  app.get('/api/admin/suppliers/pending', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const pendingSuppliers = await storage.getSuppliers({
        status: 'pending',
        limit: 100,
      });

      // Get additional data for pending suppliers
      const suppliersWithDetails = await Promise.all(
        pendingSuppliers.map(async (supplier) => {
          const specialties = await storage.getSupplierSpecialties(supplier.id);
          const documents = await storage.getSupplierDocuments(supplier.id);
          
          return {
            ...supplier,
            specialties: specialties.map(s => s.specialty),
            documents,
          };
        })
      );

      res.json(suppliersWithDetails);
    } catch (error) {
      console.error("Error fetching pending suppliers:", error);
      res.status(500).json({ message: "Failed to fetch pending suppliers" });
    }
  });

  // Admin toggle featured status
  app.post('/api/admin/suppliers/:id/featured', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { isFeatured } = req.body;

      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      if (supplier.status !== 'approved') {
        return res.status(400).json({ message: "Only approved suppliers can be featured" });
      }

      const updatedSupplier = await storage.toggleFeaturedStatus(id, isFeatured);
      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error toggling featured status:", error);
      res.status(500).json({ message: "Failed to update featured status" });
    }
  });

  // Admin get featured suppliers
  app.get('/api/admin/suppliers/featured', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const featuredSuppliers = await storage.getFeaturedSuppliers();
      res.json(featuredSuppliers);
    } catch (error) {
      console.error("Error fetching featured suppliers:", error);
      res.status(500).json({ message: "Failed to fetch featured suppliers" });
    }
  });

  // Admin get all supplier claims
  app.get('/api/admin/claims', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const claims = await db
        .select({
          id: supplierClaims.id,
          supplierId: supplierClaims.supplierId,
          userId: supplierClaims.userId,
          email: supplierClaims.email,
          status: supplierClaims.status,
          message: supplierClaims.message,
          documentUrls: supplierClaims.documentUrls,
          reviewNotes: supplierClaims.reviewNotes,
          reviewedAt: supplierClaims.reviewedAt,
          createdAt: supplierClaims.createdAt,
          supplierName: suppliers.legalName,
          supplierRnc: suppliers.rnc,
          userEmail: users.email,
          userName: users.firstName,
        })
        .from(supplierClaims)
        .leftJoin(suppliers, eq(supplierClaims.supplierId, suppliers.id))
        .leftJoin(users, eq(supplierClaims.userId, users.id))
        .orderBy(desc(supplierClaims.createdAt));

      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Admin approve/reject supplier claim
  app.patch('/api/admin/claims/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      // Get the claim
      const claim = await db
        .select()
        .from(supplierClaims)
        .where(eq(supplierClaims.id, id))
        .limit(1);

      if (claim.length === 0) {
        return res.status(404).json({ message: "Claim not found" });
      }

      if (claim[0].status !== 'pending') {
        return res.status(400).json({ message: "This claim has already been reviewed" });
      }

      // Update claim status
      const updatedClaim = await db
        .update(supplierClaims)
        .set({
          status,
          reviewNotes,
          reviewedBy: user.id,
          reviewedAt: new Date(),
        })
        .where(eq(supplierClaims.id, id))
        .returning();

      // If approved, update the supplier to be claimed
      if (status === 'approved') {
        await db
          .update(suppliers)
          .set({
            userId: claim[0].userId,
            isClaimed: true,
            claimedAt: new Date(),
          })
          .where(eq(suppliers.id, claim[0].supplierId));

        // Also update the user's role to supplier if they're not already
        const claimUser = await db
          .select()
          .from(users)
          .where(eq(users.id, claim[0].userId))
          .limit(1);

        if (claimUser[0] && claimUser[0].role === 'client') {
          await db
            .update(users)
            .set({ role: 'supplier' })
            .where(eq(users.id, claim[0].userId));
        }
      }

      res.json({
        message: `Claim ${status} successfully`,
        claim: updatedClaim[0]
      });
    } catch (error) {
      console.error("Error processing claim:", error);
      res.status(500).json({ message: "Failed to process claim" });
    }
  });

  // Admin get banner statistics
  app.get('/api/admin/banners/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const rawStats = await storage.getBannerStats();
      
      // Calculate aggregated statistics
      const totalBanners = rawStats.length;
      const totalClicks = rawStats.reduce((sum, banner) => sum + banner.clicks, 0);
      const totalImpressions = rawStats.reduce((sum, banner) => sum + banner.impressions, 0);
      const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      
      // Format banner details with CTR
      const bannerDetails = rawStats.map(banner => ({
        id: banner.bannerId,
        supplierId: banner.supplierId,
        supplierName: banner.supplierName,
        deviceType: banner.deviceType,
        clicks: banner.clicks,
        impressions: banner.impressions,
        ctr: banner.impressions > 0 ? (banner.clicks / banner.impressions) * 100 : 0
      }));
      
      res.json({
        totalBanners,
        totalClicks,
        totalImpressions,
        averageCTR,
        bannerDetails
      });
    } catch (error) {
      console.error("Error fetching banner stats:", error);
      res.status(500).json({ message: "Failed to fetch banner statistics" });
    }
  });

  // Admin get supplier banners
  app.get('/api/admin/suppliers/:id/banners', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const banners = await storage.getBannersBySupplierId(id);
      res.json(banners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  // Admin create banner
  app.post('/api/admin/suppliers/:id/banner', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      if (!supplier.isFeatured) {
        return res.status(400).json({ message: "Supplier must be featured to add banners" });
      }

      const bannerData = {
        ...req.body,
        supplierId: id,
      };

      const banner = await storage.createBanner(bannerData);
      res.json(banner);
    } catch (error) {
      console.error("Error creating banner:", error);
      res.status(500).json({ message: "Failed to create banner" });
    }
  });

  // Admin update banner
  app.put('/api/admin/suppliers/:id/banner/:bannerId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { bannerId } = req.params;
      const banner = await storage.getBanner(bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      const updatedBanner = await storage.updateBanner(bannerId, req.body);
      res.json(updatedBanner);
    } catch (error) {
      console.error("Error updating banner:", error);
      res.status(500).json({ message: "Failed to update banner" });
    }
  });

  // Admin delete banner
  app.delete('/api/admin/suppliers/:id/banner/:bannerId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { bannerId } = req.params;
      const banner = await storage.getBanner(bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      await storage.deleteBanner(bannerId);
      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ message: "Failed to delete banner" });
    }
  });

  // Admin upload banner image
  app.post('/api/admin/upload/banner', 
    isAuthenticated, 
    async (req: any, res, next) => {
      const user = req.user;
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    },
    upload.single('image'), 
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const imageUrl = `/uploads/banners/${req.file.filename}`;
        
        res.json({
          imageUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ message: "Failed to upload image" });
      }
    }
  );

  // Admin get all users (admin and superadmin)
  app.get('/api/admin/all-users', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Permisos insuficientes" });
      }

      const allUsers = await storage.getUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch all users" });
    }
  });

  // Admin get all admin users
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const adminUsers = await storage.getAdminUsers();
      res.json(adminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  // Admin get action logs
  app.get('/api/admin/actions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { adminId, actionType, entityType, limit, offset } = req.query;
      
      const actions = await storage.getAdminActions({
        adminId: adminId as string,
        actionType: actionType as string,
        entityType: entityType as string,
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json(actions);
    } catch (error) {
      console.error("Error fetching admin actions:", error);
      res.status(500).json({ message: "Failed to fetch admin actions" });
    }
  });

  // Admin log action
  app.post('/api/admin/actions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validation = logAdminActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const actionData = {
        adminId: user.id,
        ...validation.data,
      };

      const action = await storage.logAdminAction(actionData);
      res.json(action);
    } catch (error) {
      console.error("Error logging admin action:", error);
      res.status(500).json({ message: "Failed to log action" });
    }
  });

  // Admin update user role
  app.patch('/api/admin/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only super admins can change user roles" });
      }

      const { id } = req.params;
      
      // Validate request body
      const validation = updateUserRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const { role } = validation.data;

      // Get current user data before updating
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldRole = currentUser.role;
      const updatedUser = await storage.updateUserRole(id, role);
      
      // Log the action with accurate before/after details (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'update_user_role',
          entityType: 'user',
          entityId: id,
          details: { oldRole, newRole: role },
        });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Admin update user status
  app.patch('/api/admin/users/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only super admins can change user status" });
      }

      const { id } = req.params;
      
      // Validate request body
      const validation = updateUserStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const { isActive } = validation.data;

      // Get current user data before updating
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldStatus = currentUser.isActive;
      const updatedUser = await storage.updateUserStatus(id, isActive);
      
      // Log the action with accurate before/after details (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'update_user_status',
          entityType: 'user',
          entityId: id,
          details: { oldStatus, newStatus: isActive },
        });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Admin update user email
  app.patch('/api/admin/users/:id/email', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Permisos insuficientes" });
      }

      const { id } = req.params;
      
      // Validate request body
      const validation = updateUserEmailSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validación fallida", 
          errors: validation.error.errors 
        });
      }

      const { email } = validation.data;

      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0 && existingUser[0].id !== id) {
        return res.status(400).json({ message: "Este email ya está en uso" });
      }

      // Get current user data before updating
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const oldEmail = currentUser.email;
      
      // Update email
      const [updatedUser] = await db
        .update(users)
        .set({ email, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      
      // Log the action (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'update_user_email',
          entityType: 'user',
          entityId: id,
          details: { oldEmail, newEmail: email },
        });
      }

      // Remove sensitive data before sending response
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user email:", error);
      res.status(500).json({ message: "Error al actualizar el email" });
    }
  });

  // Admin update user password
  app.patch('/api/admin/users/:id/password', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Permisos insuficientes" });
      }

      const { id } = req.params;
      
      // Validate request body
      const validation = updateUserPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validación fallida", 
          errors: validation.error.errors 
        });
      }

      const { password } = validation.data;

      // Get current user data before updating
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update password (don't return user object to avoid leaking password hash)
      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, id));
      
      // Log the action (only if admin user exists in database, don't include password in details for security)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'update_user_password',
          entityType: 'user',
          entityId: id,
          details: { userId: id, action: 'password_changed' },
        });
      }

      res.json({ success: true, message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ message: "Error al actualizar la contraseña" });
    }
  });

  // Admin get all payments
  app.get('/api/admin/payments', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, plan, search, page, limit } = req.query;
      
      const parsedPage = page ? parseInt(page as string) : 1;
      const parsedLimit = limit ? parseInt(limit as string) : 10;
      const parsedOffset = (parsedPage - 1) * parsedLimit;
      
      const payments = await storage.getAllPayments({
        status: status && status !== 'all' ? status as string : undefined,
        plan: plan && plan !== 'all' ? plan as string : undefined,
        search: search ? search as string : undefined,
        limit: !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
        offset: !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0,
      });

      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Admin get payment statistics
  app.get('/api/admin/payments/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const stats = await storage.getPaymentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ message: "Failed to fetch payment statistics" });
    }
  });

  // Admin get all subscriptions
  app.get('/api/admin/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, plan, search, page, limit } = req.query;
      
      const parsedPage = page ? parseInt(page as string) : 1;
      const parsedLimit = limit ? parseInt(limit as string) : 10;
      const parsedOffset = (parsedPage - 1) * parsedLimit;
      
      const subscriptions = await storage.getAllSubscriptions({
        status: status && status !== 'all' ? status as string : undefined,
        plan: plan && plan !== 'all' ? plan as string : undefined,
        search: search ? search as string : undefined,
        limit: !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
        offset: !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0,
      });

      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Admin update subscription status
  app.patch('/api/admin/subscriptions/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updateSubscriptionStatusSchema = z.object({
        status: z.enum(['active', 'inactive', 'cancelled', 'trialing']),
      });

      const validation = updateSubscriptionStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const { status } = validation.data;

      const subscription = await storage.getSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      const oldStatus = subscription.status;
      const updatedSubscription = await storage.updateSubscriptionStatus(id, status);
      
      // Log admin action (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'update_subscription_status',
          entityType: 'subscription',
          entityId: id,
          details: { oldStatus, newStatus: status },
        });
      }

      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error updating subscription status:", error);
      res.status(500).json({ message: "Failed to update subscription status" });
    }
  });

  // Check trial reminders (can be called by cron job or admin)
  app.post('/api/subscriptions/check-trial-reminders', async (req, res) => {
    try {
      const { checkTrialReminders } = await import('./notification-service');
      await checkTrialReminders(storage);
      res.json({ success: true, message: "Trial reminders checked successfully" });
    } catch (error) {
      console.error("Error checking trial reminders:", error);
      res.status(500).json({ message: "Failed to check trial reminders" });
    }
  });

  // Admin get all refunds
  app.get('/api/admin/refunds', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, search, page, limit } = req.query;
      
      const parsedPage = page ? parseInt(page as string) : 1;
      const parsedLimit = limit ? parseInt(limit as string) : 10;
      const parsedOffset = (parsedPage - 1) * parsedLimit;
      
      const refunds = await storage.getAllRefunds({
        status: status && status !== 'all' ? status as string : undefined,
        search: search ? search as string : undefined,
        limit: !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
        offset: !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0,
      });

      res.json(refunds);
    } catch (error) {
      console.error("Error fetching refunds:", error);
      res.status(500).json({ message: "Failed to fetch refunds" });
    }
  });

  // Admin create refund
  app.post('/api/admin/refunds', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validation = createRefundSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const { paymentId, amount, reason } = validation.data;

      const refund = await storage.createRefund({
        paymentId,
        amount: amount.toString(),
        reason,
        status: 'pending',
      });

      // Log admin action (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'create_refund',
          entityType: 'refund',
          entityId: refund.id,
          details: { paymentId, amount, reason },
        });
      }

      res.json(refund);
    } catch (error) {
      console.error("Error creating refund:", error);
      res.status(500).json({ message: "Failed to create refund" });
    }
  });

  // Admin process refund (approve/reject)
  app.patch('/api/admin/refunds/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const validation = processRefundSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const { status, verifoneRefundId } = validation.data;

      const refund = await storage.processRefund(id, {
        status,
        processedBy: user.id,
        verifoneRefundId,
      });

      // Log admin action (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'process_refund',
          entityType: 'refund',
          entityId: id,
          details: { status, verifoneRefundId },
        });
      }

      res.json(refund);
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  // Admin get all invoices
  app.get('/api/admin/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, supplierId, search, page, limit } = req.query;
      
      const parsedPage = page ? parseInt(page as string) : 1;
      const parsedLimit = limit ? parseInt(limit as string) : 10;
      const parsedOffset = (parsedPage - 1) * parsedLimit;
      
      const invoices = await storage.getAllInvoices({
        status: status && status !== 'all' ? status as string : undefined,
        supplierId: supplierId && supplierId !== 'all' ? supplierId as string : undefined,
        search: search ? search as string : undefined,
        limit: !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
        offset: !isNaN(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0,
      });

      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Export endpoints (no pagination) for CSV exports
  app.get('/api/admin/payments/export', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, plan, search } = req.query;
      
      const payments = await storage.getAllPayments({
        status: status && status !== 'all' ? status as string : undefined,
        plan: plan && plan !== 'all' ? plan as string : undefined,
        search: search ? search as string : undefined,
        limit: 999999,
        offset: 0,
      });

      res.json({ payments: payments.payments });
    } catch (error) {
      console.error("Error exporting payments:", error);
      res.status(500).json({ message: "Failed to export payments" });
    }
  });

  app.get('/api/admin/invoices/export', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, supplierId, search } = req.query;
      
      const invoices = await storage.getAllInvoices({
        status: status && status !== 'all' ? status as string : undefined,
        supplierId: supplierId as string | undefined,
        search: search ? search as string : undefined,
        limit: 999999,
        offset: 0,
      });

      res.json({ invoices: invoices.invoices });
    } catch (error) {
      console.error("Error exporting invoices:", error);
      res.status(500).json({ message: "Failed to export invoices" });
    }
  });

  app.get('/api/admin/subscriptions/export', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, plan, search } = req.query;
      
      const subscriptions = await storage.getAllSubscriptions({
        status: status && status !== 'all' ? status as string : undefined,
        plan: plan && plan !== 'all' ? plan as string : undefined,
        search: search ? search as string : undefined,
        limit: 999999,
        offset: 0,
      });

      res.json({ subscriptions: subscriptions.subscriptions });
    } catch (error) {
      console.error("Error exporting subscriptions:", error);
      res.status(500).json({ message: "Failed to export subscriptions" });
    }
  });

  // Admin create invoice
  app.post('/api/admin/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validation = createInvoiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const { paymentId, supplierId, ncfSequence, notes } = validation.data;

      // Get payment to calculate invoice details
      const payment = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
      
      if (!payment.length) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const invoiceNumber = await storage.getNextInvoiceNumber();
      const amount = Number(payment[0].amount);
      const itbis = amount * 0.18; // 18% ITBIS tax in DR
      const total = amount + itbis;

      let ncf: string | undefined = undefined;
      if (ncfSequence) {
        ncf = await storage.getNextNCF(ncfSequence);
      }

      const invoice = await storage.createInvoice({
        paymentId,
        supplierId,
        invoiceNumber,
        ncf,
        ncfSequence,
        subtotal: amount.toString(),
        itbis: itbis.toString(),
        total: total.toString(),
        currency: payment[0].currency || 'DOP',
        status: 'draft',
        notes,
      });

      // Log admin action (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'create_invoice',
          entityType: 'invoice',
          entityId: invoice.id,
          details: { invoiceNumber, ncf, total },
        });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Admin update invoice
  app.patch('/api/admin/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { status, paidDate } = req.body;

      const invoice = await storage.updateInvoice(id, {
        status,
        paidDate: paidDate ? new Date(paidDate) : undefined,
      });

      // Log admin action (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'update_invoice',
          entityType: 'invoice',
          entityId: id,
          details: { status, paidDate },
        });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Admin get all platform configurations
  app.get('/api/admin/config', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only super admins can view platform configuration" });
      }

      const configs = await storage.getAllPlatformConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching platform configs:", error);
      res.status(500).json({ message: "Failed to fetch platform configurations" });
    }
  });

  // Admin get specific platform configuration
  app.get('/api/admin/config/:key', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only super admins can view platform configuration" });
      }

      const { key } = req.params;
      const config = await storage.getPlatformConfig(key);
      
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching platform config:", error);
      res.status(500).json({ message: "Failed to fetch platform configuration" });
    }
  });

  // Admin update platform configuration
  app.put('/api/admin/config/:key', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only super admins can update platform configuration" });
      }

      const { key } = req.params;
      
      // Validate request body using Zod schema
      const validation = updatePlatformConfigSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      // Check if configValue is provided (including falsy values like 0, false, empty string)
      if (!req.body.hasOwnProperty('configValue')) {
        return res.status(400).json({ message: "configValue is required" });
      }

      const { configValue, description } = validation.data;

      const config = await storage.upsertPlatformConfig({
        configKey: key,
        configValue,
        description,
        updatedBy: user.id,
      });

      // Log admin action (only if admin user exists in database)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'update_platform_config',
          entityType: 'platform_config',
          entityId: key,
          details: { configKey: key, configValue, description },
        });
      }

      res.json(config);
    } catch (error) {
      console.error("Error updating platform config:", error);
      res.status(500).json({ message: "Failed to update platform configuration" });
    }
  });

  // Payment Gateway Configuration endpoints
  // Get all payment gateway configs
  app.get('/api/admin/payment-gateways', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Only admins can view payment gateway configurations" });
      }

      const configs = await storage.getAllPaymentGatewayConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching payment gateway configs:", error);
      res.status(500).json({ message: "Failed to fetch payment gateway configurations" });
    }
  });

  // Get specific payment gateway config
  app.get('/api/admin/payment-gateway/:gatewayName', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Only admins can view payment gateway configurations" });
      }

      const { gatewayName } = req.params;
      
      if (!['azul', 'verifone', 'manual'].includes(gatewayName)) {
        return res.status(400).json({ message: "Invalid gateway name" });
      }

      const config = await storage.getPaymentGatewayConfig(gatewayName as 'azul' | 'verifone' | 'manual');
      
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching payment gateway config:", error);
      res.status(500).json({ message: "Failed to fetch payment gateway configuration" });
    }
  });

  // Update/create payment gateway config
  app.put('/api/admin/payment-gateway/:gatewayName', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Only admins can update payment gateway configurations" });
      }

      const { gatewayName } = req.params;
      
      if (!['azul', 'verifone', 'manual'].includes(gatewayName)) {
        return res.status(400).json({ message: "Invalid gateway name" });
      }

      const config = await storage.upsertPaymentGatewayConfig({
        gatewayName: gatewayName as 'azul' | 'verifone' | 'manual',
        ...req.body,
        updatedBy: user.id,
      });

      // Log admin action (without sensitive credentials)
      const adminExists = await storage.getUser(user.id);
      if (adminExists) {
        const { secretKey, authToken, ...safeDetails } = req.body;
        await storage.logAdminAction({
          adminId: user.id,
          actionType: 'update_payment_gateway_config',
          entityType: 'payment_gateway_config',
          entityId: gatewayName,
          details: { 
            gatewayName, 
            ...safeDetails,
            // Indicate that sensitive fields were updated without exposing them
            secretKeyUpdated: !!secretKey,
            authTokenUpdated: !!authToken,
          },
        });
      }

      res.json(config);
    } catch (error) {
      console.error("Error updating payment gateway config:", error);
      res.status(500).json({ message: "Failed to update payment gateway configuration" });
    }
  });

  // Get reviews for supplier
  app.get('/api/suppliers/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
      const { sortBy, limit, offset } = req.query;
      
      const reviews = await storage.getReviewsBySupplierId(id, {
        sortBy: sortBy as 'recent' | 'rating_high' | 'rating_low' | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      
      // Fetch responses for each review
      const reviewsWithResponses = await Promise.all(
        reviews.map(async (review) => {
          const response = await storage.getReviewResponse(review.id);
          return {
            ...review,
            response: response || null,
          };
        })
      );
      
      res.json(reviewsWithResponses);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Check if user can review
  app.get('/api/suppliers/:id/can-review', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const email = req.query.email as string;

      const canReview = await storage.canUserReview(id, userId, email);
      res.json({ canReview });
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      res.status(500).json({ message: "Failed to check review eligibility" });
    }
  });

  // Create review for supplier
  app.post('/api/suppliers/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { clientName, clientEmail, rating, comment } = req.body;

      // Check if user can review
      const canReview = await storage.canUserReview(id, userId, clientEmail);
      if (!canReview) {
        return res.status(400).json({ message: "Ya has dejado una reseña para este proveedor" });
      }

      // Check supplier not reviewing themselves
      if (userId) {
        const supplier = await storage.getSupplier(id);
        if (supplier?.userId === userId) {
          return res.status(400).json({ message: "No puedes dejar una reseña en tu propio negocio" });
        }
      }

      const reviewData = {
        supplierId: id,
        userId: userId || undefined,
        clientName,
        clientEmail,
        rating,
        comment,
      };

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Create review response (supplier only)
  app.post('/api/reviews/:reviewId/response', isAuthenticated, async (req: any, res) => {
    try {
      const { reviewId } = req.params;
      const { responseText } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get the review to verify supplier
      const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
      if (!review) {
        return res.status(404).json({ message: "Reseña no encontrada" });
      }

      // Check if user owns this supplier
      const supplier = await storage.getSupplier(review.supplierId);
      if (!supplier || supplier.userId !== userId) {
        return res.status(403).json({ message: "Solo el proveedor puede responder a sus reseñas" });
      }

      // Check if response already exists
      const existingResponse = await storage.getReviewResponse(reviewId);
      if (existingResponse) {
        return res.status(400).json({ message: "Ya existe una respuesta para esta reseña" });
      }

      const response = await storage.createReviewResponse({
        reviewId,
        supplierId: supplier.id,
        responseText,
      });

      res.json(response);
    } catch (error) {
      console.error("Error creating review response:", error);
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  // Update review response (supplier only)
  app.put('/api/reviews/:reviewId/response', isAuthenticated, async (req: any, res) => {
    try {
      const { reviewId } = req.params;
      const { responseText } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const existingResponse = await storage.getReviewResponse(reviewId);
      if (!existingResponse) {
        return res.status(404).json({ message: "Respuesta no encontrada" });
      }

      // Verify ownership
      const supplier = await storage.getSupplier(existingResponse.supplierId);
      if (!supplier || supplier.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const updated = await storage.updateReviewResponse(existingResponse.id, responseText);
      res.json(updated);
    } catch (error) {
      console.error("Error updating review response:", error);
      res.status(500).json({ message: "Failed to update response" });
    }
  });

  // Delete review response (supplier only)
  app.delete('/api/reviews/:reviewId/response', isAuthenticated, async (req: any, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const existingResponse = await storage.getReviewResponse(reviewId);
      if (!existingResponse) {
        return res.status(404).json({ message: "Respuesta no encontrada" });
      }

      // Verify ownership
      const supplier = await storage.getSupplier(existingResponse.supplierId);
      if (!supplier || supplier.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      await storage.deleteReviewResponse(existingResponse.id);
      res.json({ message: "Respuesta eliminada exitosamente" });
    } catch (error) {
      console.error("Error deleting review response:", error);
      res.status(500).json({ message: "Failed to delete response" });
    }
  });

  // Report a review
  app.post('/api/reviews/:id/report', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, description, reporterEmail } = req.body;
      const userId = req.user?.id;

      if (!userId && !reporterEmail) {
        return res.status(400).json({ message: "Email es requerido para usuarios no autenticados" });
      }

      const report = await storage.createReviewReport({
        reviewId: id,
        reportedBy: userId,
        reporterEmail: reporterEmail || undefined,
        reason,
        description,
        status: 'pending',
      });

      res.json(report);
    } catch (error) {
      console.error("Error reporting review:", error);
      res.status(500).json({ message: "Failed to report review" });
    }
  });

  // Get review reports (admin only)
  app.get('/api/admin/review-reports', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin', 'moderator'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, page, limit } = req.query;
      const parsedPage = page ? parseInt(page as string) : 1;
      const parsedLimit = limit ? parseInt(limit as string) : 20;
      const parsedOffset = (parsedPage - 1) * parsedLimit;

      const reports = await storage.getReviewReports({
        status: status && status !== 'all' ? status as string : undefined,
        limit: parsedLimit,
        offset: parsedOffset,
      });

      res.json(reports);
    } catch (error) {
      console.error("Error fetching review reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Update review report status (admin only)
  app.patch('/api/admin/review-reports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin', 'moderator'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      const updated = await storage.updateReviewReportStatus(id, status, user.id, reviewNotes);
      res.json(updated);
    } catch (error) {
      console.error("Error updating review report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Get supplier plan limits
  app.get('/api/supplier/plan-limits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const planLimits = await storage.getSupplierPlanLimits(supplier.id);
      res.json(planLimits);
    } catch (error) {
      console.error("Error fetching plan limits:", error);
      res.status(500).json({ message: "Failed to fetch plan limits" });
    }
  });

  // Get supplier plan limits by ID (for admin and general use)
  app.get('/api/suppliers/plan-limits/:supplierId', async (req, res) => {
    try {
      const { supplierId } = req.params;
      const planLimits = await storage.getSupplierPlanLimits(supplierId);
      res.json(planLimits);
    } catch (error) {
      console.error("Error fetching plan limits:", error);
      res.status(500).json({ message: "Failed to fetch plan limits" });
    }
  });

  // Get plan usage for a supplier
  app.get('/api/plan-usage/:supplierId/:month', async (req, res) => {
    try {
      const { supplierId, month } = req.params;
      const planUsage = await storage.getPlanUsage(supplierId, month);
      
      if (!planUsage) {
        // Create initial usage record if it doesn't exist
        const newUsage = await storage.createPlanUsage({
          supplierId,
          month,
          productsCount: "0",
          quotesReceived: "0",
          specialtiesCount: "0",
          projectPhotos: "0"
        });
        return res.json(newUsage);
      }
      
      res.json(planUsage);
    } catch (error) {
      console.error("Error fetching plan usage:", error);
      res.status(500).json({ message: "Failed to fetch plan usage" });
    }
  });

  // Update plan usage
  app.post('/api/plan-usage/update', isAuthenticated, async (req: any, res) => {
    try {
      const { supplierId, type, increment = 1 } = req.body;
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Get or create usage record
      let usage = await storage.getPlanUsage(supplierId, month);
      if (!usage) {
        usage = await storage.createPlanUsage({
          supplierId,
          month,
          productsCount: "0",
          quotesReceived: "0",
          specialtiesCount: "0",
          projectPhotos: "0"
        });
      }
      
      // Update specific usage type
      const updates: Partial<PlanUsage> = {};
      switch (type) {
        case 'products':
          updates.productsCount = String(parseInt(usage.productsCount || "0") + increment);
          break;
        case 'quotes':
          updates.quotesReceived = String(parseInt(usage.quotesReceived || "0") + increment);
          break;
        case 'specialties':
          updates.specialtiesCount = String(parseInt(usage.specialtiesCount || "0") + increment);
          break;
        case 'photos':
          updates.projectPhotos = String(parseInt(usage.projectPhotos || "0") + increment);
          break;
        default:
          return res.status(400).json({ message: "Invalid usage type" });
      }
      
      const updatedUsage = await storage.updatePlanUsage(supplierId, month, updates);
      res.json(updatedUsage);
    } catch (error) {
      console.error("Error updating plan usage:", error);
      res.status(500).json({ message: "Failed to update plan usage" });
    }
  });

  // Update supplier profile
  app.patch('/api/supplier/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const allowedFields = [
        'legalName', 'phone', 'location', 'description', 
        'website', 'profileImageUrl', 'bannerImageUrl'
      ];
      
      const updates: Partial<Supplier> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          (updates as any)[field] = req.body[field];
        }
      }

      const updatedSupplier = await storage.updateSupplier(supplier.id, updates);
      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update supplier banner image
  app.patch('/api/supplier/banner', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const user = req.user;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      if (user.role !== 'supplier') {
        return res.status(403).json({ message: "Only suppliers can update banner images" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const { bannerImageUrl } = req.body;
      
      if (!bannerImageUrl) {
        return res.status(400).json({ message: "Banner image URL is required" });
      }

      const updatedSupplier = await storage.updateSupplier(supplier.id, { bannerImageUrl });
      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating banner image:", error);
      res.status(500).json({ message: "Failed to update banner image" });
    }
  });

  // Toggle supplier featured status (admin only)
  app.patch('/api/supplier/featured', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { supplierId, isFeatured } = req.body;
      
      if (!supplierId) {
        return res.status(400).json({ message: "Supplier ID is required" });
      }

      if (typeof isFeatured !== 'boolean') {
        return res.status(400).json({ message: "isFeatured must be a boolean value" });
      }

      const supplier = await storage.getSupplier(supplierId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const updatedSupplier = await storage.updateSupplier(supplierId, { isFeatured });
      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating featured status:", error);
      res.status(500).json({ message: "Failed to update featured status" });
    }
  });

  // Get supplier services
  app.get('/api/supplier/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const services = await storage.getServicesBySupplierId(supplier.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching supplier services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Create service
  app.post('/api/supplier/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Check plan limits for services
      const services = await storage.getServicesBySupplierId(supplier.id);
      const planLimits = await storage.getSupplierPlanLimits(supplier.id);
      
      // For basic plan, limit services similar to products
      if (planLimits.plan === 'basic' && services.length >= 10) {
        return res.status(403).json({ 
          message: "Has alcanzado el límite de servicios para tu plan. Actualiza tu plan para agregar más servicios.",
          planLimit: true,
          currentUsage: services.length,
          maxAllowed: 10
        });
      }

      const serviceData = {
        ...req.body,
        supplierId: supplier.id,
      };

      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Add supplier specialty with plan limits
  app.post('/api/supplier/specialties', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Check plan limits for specialties
      const planLimits = await storage.getSupplierPlanLimits(supplier.id);
      const currentSpecialties = await storage.getSupplierSpecialties(supplier.id);
      
      if (planLimits.maxSpecialties !== -1 && currentSpecialties.length >= planLimits.maxSpecialties) {
        return res.status(403).json({ 
          message: `Has alcanzado el límite de especialidades para tu plan (${planLimits.maxSpecialties}). Actualiza tu plan para agregar más especialidades.`,
          planLimit: true,
          currentUsage: currentSpecialties.length,
          maxAllowed: planLimits.maxSpecialties
        });
      }

      const specialtyData = {
        supplierId: supplier.id,
        specialty: req.body.specialty,
      };

      const specialty = await storage.addSupplierSpecialty(specialtyData);
      
      // Update usage counter
      const currentMonth = new Date().toISOString().slice(0, 7);
      await storage.updatePlanUsage(supplier.id, currentMonth, {
        specialtiesCount: String(currentSpecialties.length + 1)
      });

      res.json(specialty);
    } catch (error) {
      console.error("Error creating specialty:", error);
      res.status(500).json({ message: "Failed to create specialty" });
    }
  });

  // Get supplier plan usage for current month
  app.get('/api/supplier/plan-usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await storage.getPlanUsage(supplier.id, currentMonth);
      
      // Return usage or default values if no usage record exists
      const defaultUsage = {
        id: `temp-${supplier.id}`,
        supplierId: supplier.id,
        month: currentMonth,
        productsCount: "0",
        quotesReceived: "0",
        specialtiesCount: "0",
        projectPhotos: "0",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.json(usage || defaultUsage);
    } catch (error) {
      console.error("Error fetching plan usage:", error);
      res.status(500).json({ message: "Failed to fetch plan usage" });
    }
  });

  // Admin route to manage supplier subscription status
  app.patch('/api/admin/suppliers/:id/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      const userId = req.user?.id;

      if (!userId || !['admin', 'superadmin'].includes(req.user?.role)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!['suspend', 'reactivate'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Update supplier status
      const newStatus = action === 'suspend' ? 'suspended' : 'approved';
      await storage.updateSupplierStatus(id, newStatus);

      // Log the action
      console.log(`Admin ${userId} ${action}ed supplier ${id}: ${reason}`);

      res.json({ 
        success: true, 
        message: `Supplier ${action}ed successfully`,
        newStatus 
      });
    } catch (error) {
      console.error("Error managing subscription:", error);
      res.status(500).json({ message: "Failed to manage subscription" });
    }
  });

  // Verifone payment processing endpoint
  app.post('/api/process-verifone-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { subscriptionId, paymentMethod, amount } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Create payment record
      const paymentData = {
        subscriptionId,
        amount: amount.toString(),
        currency: 'DOP',
        status: 'pending' as const,
        verifoneTransactionId: `VF_${Date.now()}_${supplier.id}`,
      };

      const payment = await storage.createPayment(paymentData);

      // Simulate Verifone payment processing
      // In production, you would integrate with actual Verifone API
      const verifoneResponse = await simulateVerifonePayment({
        merchantCode: VERIFONE_CONFIG.MERCHANT_CODE,
        amount,
        currency: 'DOP',
        cardNumber: paymentMethod.cardNumber.replace(/\s/g, ''),
        expiryDate: paymentMethod.expiryDate,
        cvv: paymentMethod.cvv,
        cardName: paymentMethod.cardName,
        transactionId: payment.verifoneTransactionId,
      });

      if (verifoneResponse.success) {
        // Update payment status
        await storage.updatePayment(payment.id, {
          status: 'completed',
          verifoneTransactionId: verifoneResponse.transactionId,
        });

        // Update subscription status
        const subscription = await storage.getSubscriptionBySupplierId(supplier.id);
        if (subscription) {
          await storage.updateSubscription(subscription.id, {
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          });
        }

        res.json({
          success: true,
          transactionId: verifoneResponse.transactionId,
          message: "Payment processed successfully"
        });
      } else {
        // Update payment status to failed
        await storage.updatePayment(payment.id, {
          status: 'failed',
        });

        res.status(400).json({
          success: false,
          message: verifoneResponse.error || "Payment failed"
        });
      }
    } catch (error) {
      console.error("Error processing Verifone payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Azul payment endpoints
  // Create Azul payment request
  app.post('/api/payments/azul/create', isAuthenticated, async (req: any, res) => {
    try {
      const { subscriptionId, amount, plan } = req.body;
      const userId = req.session.userId!;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Import Azul service
      const { createAzulPaymentRequest } = await import('./azul-service');

      // Generate unique order number
      const orderNumber = `ORD_${Date.now()}_${supplier.id.substring(0, 8)}`;

      // Calculate ITBIS (18%)
      const subtotal = amount;
      const itbis = Math.round(subtotal * 0.18);
      const total = subtotal + itbis;

      // Create payment record
      const paymentData = {
        subscriptionId,
        amount: total.toString(),
        currency: '$',
        status: 'pending' as const,
        gatewayName: 'azul' as const,
        gatewayTransactionId: orderNumber,
      };

      const payment = await storage.createPayment(paymentData);

      // Create Azul payment request
      const azulRequest = await createAzulPaymentRequest({
        orderNumber,
        amount: total,
        itbis,
        currency: '$',
        customOrderId: JSON.stringify({
          paymentId: payment.id,
          supplierId: supplier.id,
          subscriptionId,
          plan,
        }),
      });

      res.json({
        success: true,
        paymentId: payment.id,
        orderNumber,
        azulPaymentUrl: azulRequest.paymentUrl,
        azulPaymentData: azulRequest.paymentData,
        amount: total,
        subtotal,
        itbis,
        message: "Azul payment request created successfully"
      });
    } catch (error) {
      console.error("Error creating Azul payment:", error);
      res.status(500).json({ message: "Failed to create payment request" });
    }
  });

  // Azul approved callback
  app.post('/api/payments/azul/approved', async (req, res) => {
    try {
      const { processAzulCallback } = await import('./azul-service');
      const authHash = req.body.AuthHash;
      
      const result = await processAzulCallback(req.body, authHash);

      if (!result.success) {
        console.error("Azul payment not approved:", result);
        return res.redirect('/subscription-selection?payment=failed');
      }

      // Extract custom data
      let customData: any = {};
      try {
        if (req.body.CustomOrderId) {
          customData = JSON.parse(req.body.CustomOrderId);
        }
      } catch (e) {
        console.error("Error parsing CustomOrderId:", e);
      }

      // Update payment status
      if (customData.paymentId) {
        await storage.updatePayment(customData.paymentId, {
          status: 'completed',
          gatewayAuthCode: result.authorizationCode,
          gatewayResponseCode: result.responseCode,
          gatewayMetadata: result.transactionDetails,
        });

        // Update subscription status
        if (customData.subscriptionId) {
          const subscription = await storage.getSubscription(customData.subscriptionId);
          if (subscription) {
            const currentPeriodEnd = new Date();
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            
            await storage.updateSubscription(subscription.id, {
              status: 'active',
              paymentGateway: 'azul',
              gatewaySubscriptionId: result.orderNumber,
              currentPeriodEnd,
            });

            // Generate invoice
            const invoiceNumber = `INV-${Date.now()}`;
            const invoiceAmount = result.amount?.toString() || subscription.monthlyAmount || '1000';
            const subtotal = parseFloat(invoiceAmount) / 1.18;
            const itbis = parseFloat(invoiceAmount) - subtotal;
            
            await storage.createInvoice({
              supplierId: customData.supplierId || '',
              paymentId: customData.paymentId || '',
              invoiceNumber,
              subtotal: subtotal.toFixed(2),
              total: invoiceAmount,
              currency: 'DOP',
              itbis: itbis.toFixed(2),
              status: 'paid',
              dueDate: new Date(),
              paidDate: new Date(),
            });
          }
        }
      }

      res.redirect('/supplier-dashboard?payment=success');
    } catch (error) {
      console.error("Error processing Azul approved callback:", error);
      res.redirect('/subscription-selection?payment=error');
    }
  });

  // Azul declined callback
  app.post('/api/payments/azul/declined', async (req, res) => {
    try {
      const { processAzulCallback } = await import('./azul-service');
      
      const result = await processAzulCallback(req.body, req.body.AuthHash);
      
      // Extract custom data
      let customData: any = {};
      try {
        if (req.body.CustomOrderId) {
          customData = JSON.parse(req.body.CustomOrderId);
        }
      } catch (e) {
        console.error("Error parsing CustomOrderId:", e);
      }

      // Update payment status
      if (customData.paymentId) {
        await storage.updatePayment(customData.paymentId, {
          status: 'failed',
          gatewayResponseCode: result.responseCode,
          gatewayMetadata: result.transactionDetails,
        });
      }

      res.redirect(`/subscription-selection?payment=declined&reason=${encodeURIComponent(result.responseMessage || 'Payment declined')}`);
    } catch (error) {
      console.error("Error processing Azul declined callback:", error);
      res.redirect('/subscription-selection?payment=error');
    }
  });

  // Azul cancelled callback
  app.post('/api/payments/azul/cancelled', async (req, res) => {
    try {
      // Extract custom data
      let customData: any = {};
      try {
        if (req.body.CustomOrderId) {
          customData = JSON.parse(req.body.CustomOrderId);
        }
      } catch (e) {
        console.error("Error parsing CustomOrderId:", e);
      }

      // Update payment status
      if (customData.paymentId) {
        await storage.updatePayment(customData.paymentId, {
          status: 'failed',
        });
      }

      res.redirect('/subscription-selection?payment=cancelled');
    } catch (error) {
      console.error("Error processing Azul cancelled callback:", error);
      res.redirect('/subscription-selection?payment=error');
    }
  });

  // Azul refund endpoint
  app.post('/api/payments/azul/refund', isAuthenticated, hasRole(['admin']), async (req: any, res) => {
    try {
      const { paymentId, amount, reason } = req.body;

      if (!paymentId || !amount) {
        return res.status(400).json({ message: "Payment ID and amount are required" });
      }

      // Get payment from database
      const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.gatewayName !== 'azul') {
        return res.status(400).json({ message: "This payment was not processed through Azul" });
      }

      const { createAzulRefund } = await import('./azul-service');

      const refundResult = await createAzulRefund({
        originalOrderNumber: payment.gatewayTransactionId || '',
        originalAuthCode: payment.gatewayAuthCode || '',
        refundAmount: parseFloat(amount),
        currency: '$',
      });

      // Create refund record
      await storage.createRefund({
        paymentId,
        amount: amount.toString(),
        status: 'completed',
        reason: reason || 'Admin refund',
        gatewayRefundId: refundResult.refundOrderNumber,
      });

      // Update payment status - mark as completed with note about refund
      await storage.updatePayment(paymentId, {
        status: 'completed',
      });

      res.json({
        success: true,
        refundId: refundResult.refundOrderNumber,
        message: "Refund processed successfully"
      });
    } catch (error) {
      console.error("Error processing Azul refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  // Exchange rates endpoint
  app.get('/api/exchange-rates', async (_req, res) => {
    try {
      const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
      const data = await response.json();
      
      const usdToDop = data.usd.dop;
      const usdToEur = data.usd.eur;
      
      const eurToDop = usdToDop / usdToEur;
      
      res.json({
        date: data.date,
        rates: {
          usd_to_dop: Number(usdToDop.toFixed(2)),
          eur_to_dop: Number(eurToDop.toFixed(2))
        }
      });
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Failed to fetch exchange rates" });
    }
  });

  // Fuel prices endpoint
  app.get('/api/fuel-prices', async (_req, res) => {
    try {
      const response = await fetch('https://api.datos.gob.do/v1/fuel-prices', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        res.json(data);
      } else {
        res.json({
          fecha_vigencia: "Actualizado semanalmente",
          precios: {
            gasolina_premium: 290.10,
            gasolina_regular: 272.50,
            gasoil_optimo: 242.10,
            gasoil_regular: 224.80,
            glp: 137.20,
            gas_natural: 43.97
          },
          moneda: "RD$",
          unidad: "galón"
        });
      }
    } catch (error) {
      console.error("Error fetching fuel prices:", error);
      res.json({
        fecha_vigencia: "Actualizado semanalmente",
        precios: {
          gasolina_premium: 290.10,
          gasolina_regular: 272.50,
          gasoil_optimo: 242.10,
          gasoil_regular: 224.80,
          glp: 137.20,
          gas_natural: 43.97
        },
        moneda: "RD$",
        unidad: "galón"
      });
    }
  });

  // Scraping endpoints
  app.post("/api/admin/scrape-suppliers", isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    try {
      console.log('Starting supplier import process...');
      const { scrapeBusinesses, areBusinessNamesSimilar, inferSpecialties } = await import('./scraper');
      const { categories, cities, maxPages } = req.body;
      
      const categoriesToScrape = categories || ['constructoras', 'restaurantes', 'supermercados'];
      const citiesToScrape = cities || ['santo-domingo'];
      const maxPagesPerCategory = maxPages || 3;
      
      console.log(`Scraping config: categories=${categoriesToScrape.join(',')}, cities=${citiesToScrape.join(',')}, maxPages=${maxPagesPerCategory}`);
      
      const businesses: any[] = [];
      
      for (const category of categoriesToScrape) {
        for (const city of citiesToScrape) {
          console.log(`Scraping ${category} in ${city}...`);
          const scraped = await scrapeBusinesses(category, city, maxPagesPerCategory);
          console.log(`Found ${scraped.length} businesses for ${category} in ${city}`);
          businesses.push(...scraped);
        }
      }
      
      console.log(`Total businesses scraped: ${businesses.length}`);
      
      if (businesses.length === 0) {
        return res.json({
          success: true,
          message: 'No se encontraron negocios para importar',
          imported: 0,
          total: 0,
        });
      }
      
      // Remove duplicates within the scraped batch
      const uniqueBusinesses: any[] = [];
      const seenNames: string[] = [];
      
      for (const business of businesses) {
        let isDuplicate = false;
        
        for (const seenName of seenNames) {
          if (areBusinessNamesSimilar(business.name, seenName)) {
            isDuplicate = true;
            console.log(`- Skipped duplicate in batch: ${business.name} (similar to ${seenName})`);
            break;
          }
        }
        
        if (!isDuplicate) {
          uniqueBusinesses.push(business);
          seenNames.push(business.name);
        }
      }
      
      console.log(`Unique businesses after deduplication: ${uniqueBusinesses.length} (removed ${businesses.length - uniqueBusinesses.length} duplicates)`);
      
      const importedSuppliers = [];
      const skippedDuplicates: string[] = [];
      const errors: string[] = [];
      
      // Get all existing suppliers to check for duplicates
      const existingSuppliers = await db.query.suppliers.findMany({
        columns: {
          id: true,
          legalName: true,
        },
      });
      
      for (const business of uniqueBusinesses) {
        // Check if similar business already exists in database
        let isDuplicate = false;
        for (const existing of existingSuppliers) {
          if (areBusinessNamesSimilar(business.name, existing.legalName)) {
            isDuplicate = true;
            skippedDuplicates.push(`${business.name} (similar a ${existing.legalName})`);
            console.log(`- Skipped (duplicate in DB): ${business.name} (similar to ${existing.legalName})`);
            break;
          }
        }
        
        if (isDuplicate) continue;
        
        const generatedRnc = `SCR-${business.name.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        const generatedEmail = business.email || 
          `${business.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}@scrapeado.fouroneplatform.do`;
        
        const supplierData = {
          legalName: business.name,
          rnc: generatedRnc,
          phone: business.phone || 'No disponible',
          email: generatedEmail,
          status: 'approved' as const,
          location: business.address || `${business.city}, República Dominicana`,
          description: business.description || `Proveedor de ${business.category} en ${business.city}`,
          website: business.website,
          addedByAdmin: true,
          isClaimed: false,
          approvalDate: new Date(),
        };
        
        try {
          const [newSupplier] = await db.insert(suppliers).values(supplierData).returning();
          
          // Infer and add specialties
          const specialties = inferSpecialties(business.name, business.description, business.category);
          
          if (specialties.length > 0) {
            const specialtyValues = specialties.map(specialty => ({
              supplierId: newSupplier.id,
              specialty,
            }));
            
            await db.insert(supplierSpecialties).values(specialtyValues);
            console.log(`✓ Imported: ${business.name} with specialties: ${specialties.join(', ')}`);
          } else {
            console.log(`✓ Imported: ${business.name} (no specialties detected)`);
          }
          
          importedSuppliers.push(newSupplier);
          
        } catch (error) {
          const errorMsg = `Error importing ${business.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Import complete: ${importedSuppliers.length}/${uniqueBusinesses.length} suppliers imported`);
      console.log(`Duplicates skipped: ${skippedDuplicates.length}`);
      
      const message = importedSuppliers.length > 0
        ? `Se importaron ${importedSuppliers.length} proveedores de ${businesses.length} negocios scrapeados (${skippedDuplicates.length} duplicados omitidos)`
        : `No se importaron proveedores (${skippedDuplicates.length} duplicados omitidos)`;
      
      res.json({
        success: true,
        message,
        imported: importedSuppliers.length,
        total: businesses.length,
        duplicatesSkipped: skippedDuplicates.length,
        errors: errors.length > 0 ? errors : undefined,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      console.error('Error during scraping:', errorMessage);
      console.error('Stack trace:', errorStack);
      
      res.status(500).json({ 
        success: false,
        error: 'Error al scrapear proveedores',
        details: errorMessage
      });
    }
  });
  
  app.get("/api/admin/scrape-config", isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { getAvailableCategories, getAvailableCities } = await import('./scraper');
      
      res.json({
        categories: getAvailableCategories(),
        cities: getAvailableCities(),
      });
    } catch (error) {
      console.error('Error getting scrape config:', error);
      res.status(500).json({ error: 'Error al obtener configuración de scraping' });
    }
  });

  // Get empty categories (categories with few or no suppliers)
  app.get("/api/admin/empty-categories", isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    try {
      // Map of scraped categories to specialty names
      const categoryMap: Record<string, string> = {
        'constructoras': 'Construcción',
        'restaurantes': 'Restaurante',
        'supermercados': 'Supermercado',
        'farmacias': 'Farmacia',
        'ferreterias': 'Ferretería',
        'tecnologia': 'Tecnología',
        'computadoras': 'Tecnología',
        'transporte': 'Transporte',
        'mensajeria': 'Transporte',
        'clinicas': 'Salud',
        'laboratorios': 'Salud',
        'dentistas': 'Salud',
        'hoteles': 'Hotelería',
        'abogados': 'Legal',
        'contadores': 'Contabilidad',
        'seguros': 'Seguros',
        'limpieza': 'Limpieza',
        'publicidad': 'Diseño',
        'imprentas': 'Diseño',
        'seguridad': 'Seguridad',
        'plomeria': 'Mantenimiento',
        'electricidad': 'Mantenimiento',
        'pintura': 'Mantenimiento',
        'carpinteria': 'Mantenimiento',
        'talleres-mecanicos': 'Automotriz',
        'mueblerias': 'Muebles',
        'electrodomesticos': 'Equipos',
        'bancos': 'Servicios Financieros',
        'agencias-de-viajes': 'Turismo',
        'jardineria': 'Jardinería'
      };

      // Get count of suppliers per specialty
      const specialtyCounts = await db
        .select({
          specialty: supplierSpecialties.specialty,
        })
        .from(supplierSpecialties)
        .groupBy(supplierSpecialties.specialty);

      const specialtyCountMap = new Map<string, number>();
      for (const row of specialtyCounts) {
        specialtyCountMap.set(row.specialty, (specialtyCountMap.get(row.specialty) || 0) + 1);
      }

      // Find empty or low-count categories
      const emptyCategories: { category: string; specialty: string; count: number }[] = [];
      const threshold = parseInt(req.query.threshold as string) || 10; // Default threshold of 10 suppliers

      for (const [category, specialty] of Object.entries(categoryMap)) {
        const count = specialtyCountMap.get(specialty) || 0;
        if (count < threshold) {
          emptyCategories.push({ category, specialty, count });
        }
      }

      res.json({
        emptyCategories,
        threshold,
        total: emptyCategories.length
      });
    } catch (error) {
      console.error('Error getting empty categories:', error);
      res.status(500).json({ error: 'Error al obtener categorías vacías' });
    }
  });

  // Scrape suppliers for empty categories
  app.post("/api/admin/scrape-empty-categories", isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { threshold = 10, maxPages = 3, cities } = req.body;

      // Map of scraped categories to specialty names
      const categoryMap: Record<string, string> = {
        'constructoras': 'Construcción',
        'restaurantes': 'Restaurante',
        'supermercados': 'Supermercado',
        'farmacias': 'Farmacia',
        'ferreterias': 'Ferretería',
        'tecnologia': 'Tecnología',
        'computadoras': 'Tecnología',
        'transporte': 'Transporte',
        'mensajeria': 'Transporte',
        'clinicas': 'Salud',
        'laboratorios': 'Salud',
        'dentistas': 'Salud',
        'hoteles': 'Hotelería',
        'abogados': 'Legal',
        'contadores': 'Contabilidad',
        'seguros': 'Seguros',
        'limpieza': 'Limpieza',
        'publicidad': 'Diseño',
        'imprentas': 'Diseño',
        'seguridad': 'Seguridad',
        'plomeria': 'Mantenimiento',
        'electricidad': 'Mantenimiento',
        'pintura': 'Mantenimiento',
        'carpinteria': 'Mantenimiento',
        'talleres-mecanicos': 'Automotriz',
        'mueblerias': 'Muebles',
        'electrodomesticos': 'Equipos',
        'bancos': 'Servicios Financieros',
        'agencias-de-viajes': 'Turismo',
        'jardineria': 'Jardinería'
      };

      // Get count of suppliers per specialty
      const specialtyCounts = await db
        .select({
          specialty: supplierSpecialties.specialty,
        })
        .from(supplierSpecialties)
        .groupBy(supplierSpecialties.specialty);

      const specialtyCountMap = new Map<string, number>();
      for (const row of specialtyCounts) {
        specialtyCountMap.set(row.specialty, (specialtyCountMap.get(row.specialty) || 0) + 1);
      }

      // Find empty categories to scrape
      const categoriesToScrape: string[] = [];
      for (const [category, specialty] of Object.entries(categoryMap)) {
        const count = specialtyCountMap.get(specialty) || 0;
        if (count < threshold) {
          categoriesToScrape.push(category);
        }
      }

      if (categoriesToScrape.length === 0) {
        return res.json({
          success: true,
          message: 'No hay categorías vacías para scrapear',
          imported: 0,
          total: 0
        });
      }

      console.log(`Scraping empty categories: ${categoriesToScrape.join(', ')}`);

      // Use existing scraping logic
      const { scrapeBusinesses, areBusinessNamesSimilar, inferSpecialties } = await import('./scraper');
      const citiesToScrape = cities || ['santo-domingo', 'santiago'];
      const businesses: any[] = [];

      for (const category of categoriesToScrape) {
        for (const city of citiesToScrape) {
          console.log(`Scraping ${category} in ${city}...`);
          const scraped = await scrapeBusinesses(category, city, maxPages);
          console.log(`Found ${scraped.length} businesses for ${category} in ${city}`);
          businesses.push(...scraped);
        }
      }

      console.log(`Total businesses scraped: ${businesses.length}`);

      if (businesses.length === 0) {
        return res.json({
          success: true,
          message: 'No se encontraron negocios para importar',
          imported: 0,
          total: 0,
        });
      }

      // Remove duplicates within the scraped batch
      const uniqueBusinesses: any[] = [];
      const seenNames: string[] = [];

      for (const business of businesses) {
        let isDuplicate = false;

        for (const seenName of seenNames) {
          if (areBusinessNamesSimilar(business.name, seenName)) {
            isDuplicate = true;
            break;
          }
        }

        if (!isDuplicate) {
          uniqueBusinesses.push(business);
          seenNames.push(business.name);
        }
      }

      const importedSuppliers = [];
      const skippedDuplicates: string[] = [];
      const errors: string[] = [];

      // Get all existing suppliers to check for duplicates
      const existingSuppliers = await db.query.suppliers.findMany({
        columns: {
          id: true,
          legalName: true,
        },
      });

      for (const business of uniqueBusinesses) {
        // Check if similar business already exists in database
        let isDuplicate = false;
        for (const existing of existingSuppliers) {
          if (areBusinessNamesSimilar(business.name, existing.legalName)) {
            isDuplicate = true;
            skippedDuplicates.push(`${business.name} (similar a ${existing.legalName})`);
            break;
          }
        }

        if (isDuplicate) continue;

        const generatedRnc = `SCR-${business.name.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const generatedEmail = business.email || 
          `${business.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}@scrapeado.fouroneplatform.do`;

        const supplierData = {
          legalName: business.name,
          rnc: generatedRnc,
          phone: business.phone || 'No disponible',
          email: generatedEmail,
          status: 'approved' as const,
          location: business.address || `${business.city}, República Dominicana`,
          description: business.description || `Proveedor de ${business.category} en ${business.city}`,
          website: business.website,
          addedByAdmin: true,
          isClaimed: false,
          approvalDate: new Date(),
        };

        try {
          const [newSupplier] = await db.insert(suppliers).values(supplierData).returning();

          // Infer and add specialties
          const specialties = inferSpecialties(business.name, business.description, business.category);

          if (specialties.length > 0) {
            const specialtyValues = specialties.map(specialty => ({
              supplierId: newSupplier.id,
              specialty,
            }));

            await db.insert(supplierSpecialties).values(specialtyValues);
            console.log(`✓ Imported: ${business.name} with specialties: ${specialties.join(', ')}`);
          } else {
            console.log(`✓ Imported: ${business.name} (no specialties detected)`);
          }

          importedSuppliers.push(newSupplier);

        } catch (error) {
          const errorMsg = `Error importing ${business.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const message = importedSuppliers.length > 0
        ? `Se importaron ${importedSuppliers.length} proveedores en categorías vacías (${skippedDuplicates.length} duplicados omitidos)`
        : `No se importaron proveedores (${skippedDuplicates.length} duplicados omitidos)`;

      res.json({
        success: true,
        message,
        imported: importedSuppliers.length,
        total: businesses.length,
        duplicatesSkipped: skippedDuplicates.length,
        categoriesScraped: categoriesToScrape,
        errors: errors.length > 0 ? errors : undefined,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error during scraping empty categories:', errorMessage);

      res.status(500).json({ 
        success: false,
        error: 'Error al scrapear categorías vacías',
        details: errorMessage
      });
    }
  });

  // Invoice management endpoints
  app.get('/api/invoices', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const supplier = await storage.getSupplierByUserId(user.id);
      if (!supplier) {
        return res.status(403).json({ message: "Solo los proveedores pueden ver facturas" });
      }

      const result = await storage.getAllInvoices({
        supplierId: supplier.id
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Error al obtener facturas" });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      const supplier = await storage.getSupplierByUserId(user.id);
      if (!supplier || supplier.id !== invoice.supplierId) {
        return res.status(403).json({ message: "No tiene acceso a esta factura" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Error al obtener factura" });
    }
  });

  app.get('/api/invoices/:id/download', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      const supplier = await storage.getSupplier(invoice.supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }

      const userSupplier = await storage.getSupplierByUserId(user.id);
      if (!userSupplier || userSupplier.id !== invoice.supplierId) {
        return res.status(403).json({ message: "No tiene acceso a esta factura" });
      }

      const { pdfGenerator } = await import("./pdf-generator");
      const pdfBuffer = await pdfGenerator.generateInvoicePDFBuffer({
        invoice,
        supplier
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Error al generar PDF" });
    }
  });

  // Fiscal reports endpoints
  app.get('/api/reports/monthly/:month', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const supplier = await storage.getSupplierByUserId(user.id);
      if (!supplier) {
        return res.status(403).json({ message: "Solo los proveedores pueden ver reportes" });
      }

      const { fiscalReports } = await import("./fiscal-reports");
      const report = await fiscalReports.getMonthlyReport(supplier.id, req.params.month);
      
      res.json(report);
    } catch (error) {
      console.error("Error generating monthly report:", error);
      res.status(500).json({ message: "Error al generar reporte mensual" });
    }
  });

  app.get('/api/reports/dgii', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const supplier = await storage.getSupplierByUserId(user.id);
      if (!supplier) {
        return res.status(403).json({ message: "Solo los proveedores pueden ver reportes" });
      }

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const { fiscalReports } = await import("./fiscal-reports");
      const data = await fiscalReports.getDGIIReport(supplier.id, startDate, endDate);
      
      const csv = fiscalReports.exportDGIIToCSV(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-dgii.csv"');
      res.send(csv);
    } catch (error) {
      console.error("Error generating DGII report:", error);
      res.status(500).json({ message: "Error al generar reporte DGII" });
    }
  });

  app.get('/api/reports/itbis/:year', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const supplier = await storage.getSupplierByUserId(user.id);
      if (!supplier) {
        return res.status(403).json({ message: "Solo los proveedores pueden ver reportes" });
      }

      const { fiscalReports } = await import("./fiscal-reports");
      const report = await fiscalReports.getITBISReport(supplier.id, parseInt(req.params.year));
      
      res.json(report);
    } catch (error) {
      console.error("Error generating ITBIS report:", error);
      res.status(500).json({ message: "Error al generar reporte de ITBIS" });
    }
  });

  // NCF Series management endpoints (admin only)
  app.get('/api/admin/ncf-series', isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const series = await storage.getAllNcfSeries();
      res.json(series);
    } catch (error) {
      console.error("Error fetching NCF series:", error);
      res.status(500).json({ message: "Error al obtener series de NCF" });
    }
  });

  app.post('/api/admin/ncf-series', isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { seriesType, prefix, startSequence, endSequence, authorizedDate, expiryDate } = req.body;

      const newSeries = await storage.createNcfSeries({
        seriesType,
        prefix,
        currentSequence: startSequence - 1,
        startSequence,
        endSequence,
        authorizedDate: new Date(authorizedDate),
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: "active",
        isActive: true
      });

      res.status(201).json(newSeries);
    } catch (error) {
      console.error("Error creating NCF series:", error);
      res.status(500).json({ message: "Error al crear serie de NCF" });
    }
  });

  app.get('/api/admin/ncf-availability/:seriesType', isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const availability = await storage.checkNcfAvailability(req.params.seriesType);
      res.json(availability);
    } catch (error) {
      console.error("Error checking NCF availability:", error);
      res.status(500).json({ message: "Error al verificar disponibilidad de NCF" });
    }
  });

  // Semantic search endpoint
  app.post('/api/search/semantic', async (req, res) => {
    const { generateEmbedding, cosineSimilarity } = await import('./services/embedding-service.js');
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }

      // Generate embedding for search query
      const queryEmbedding = await generateEmbedding(query);

      // Get all approved suppliers with embeddings
      const suppliersWithEmbeddings = await db
        .select({
          id: suppliers.id,
          legalName: suppliers.legalName,
          location: suppliers.location,
          description: suppliers.description,
          searchEmbedding: suppliers.searchEmbedding,
          averageRating: suppliers.averageRating,
          totalReviews: suppliers.totalReviews,
          profileImageUrl: suppliers.profileImageUrl,
        })
        .from(suppliers)
        .where(and(
          eq(suppliers.status, 'approved'),
          sql`${suppliers.searchEmbedding} IS NOT NULL`
        ))
        .limit(100);

      // Get specialties for each supplier
      const suppliersWithSpecialties = await Promise.all(
        suppliersWithEmbeddings.map(async (supplier) => {
          const specs = await db
            .select({ specialty: supplierSpecialties.specialty })
            .from(supplierSpecialties)
            .where(eq(supplierSpecialties.supplierId, supplier.id));
          
          return {
            ...supplier,
            specialties: specs.map(s => s.specialty),
          };
        })
      );

      // Calculate similarity scores
      const results = suppliersWithSpecialties
        .map((supplier) => {
          const embedding = supplier.searchEmbedding as number[];
          if (!embedding || !Array.isArray(embedding)) {
            return { ...supplier, similarity: 0 };
          }

          const similarity = cosineSimilarity(queryEmbedding, embedding);
          return {
            id: supplier.id,
            legalName: supplier.legalName,
            location: supplier.location,
            description: supplier.description,
            specialties: supplier.specialties,
            averageRating: supplier.averageRating,
            totalReviews: supplier.totalReviews,
            profileImageUrl: supplier.profileImageUrl,
            similarity,
          };
        })
        .filter(r => r.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);

      res.json({ results });
    } catch (error: any) {
      console.error("Semantic search error:", error);
      res.status(500).json({ message: "Error performing semantic search" });
    }
  });

  // Generate embeddings for suppliers (utility endpoint)
  app.post('/api/suppliers/:id/generate-embedding', isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    const { generateSupplierEmbedding } = await import('./services/embedding-service.js');
    try {
      const supplierId = req.params.id;

      // Get supplier details
      const supplier = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, supplierId))
        .limit(1);

      if (supplier.length === 0) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Get specialties
      const specs = await db
        .select({ specialty: supplierSpecialties.specialty })
        .from(supplierSpecialties)
        .where(eq(supplierSpecialties.supplierId, supplierId));

      const specialties = specs.map(s => s.specialty);

      // Get products
      const prods = await db
        .select({
          name: products.name,
          category: products.category,
          description: products.description
        })
        .from(products)
        .where(and(
          eq(products.supplierId, supplierId),
          eq(products.isActive, true)
        ))
        .limit(50);

      // Generate embedding
      const embedding = await generateSupplierEmbedding(
        supplier[0].legalName,
        supplier[0].description,
        specialties,
        supplier[0].location,
        prods
      );

      // Update supplier with embedding
      await db
        .update(suppliers)
        .set({ searchEmbedding: embedding as any })
        .where(eq(suppliers.id, supplierId));

      res.json({ message: "Embedding generated successfully", embedding });
    } catch (error: any) {
      console.error("Error generating embedding:", error);
      res.status(500).json({ message: "Error generating embedding" });
    }
  });

  // Bulk generate embeddings for all suppliers
  app.post('/api/suppliers/generate-embeddings-bulk', isAuthenticated, hasRole(['admin', 'superadmin']), async (req, res) => {
    const { generateSupplierEmbedding } = await import('./services/embedding-service.js');
    try {
      // Get all approved suppliers
      const allSuppliers = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.status, 'approved'));

      let count = 0;
      for (const supplier of allSuppliers) {
        // Get specialties
        const specs = await db
          .select({ specialty: supplierSpecialties.specialty })
          .from(supplierSpecialties)
          .where(eq(supplierSpecialties.supplierId, supplier.id));

        const specialties = specs.map(s => s.specialty);

        // Get products
        const prods = await db
          .select({
            name: products.name,
            category: products.category,
            description: products.description
          })
          .from(products)
          .where(and(
            eq(products.supplierId, supplier.id),
            eq(products.isActive, true)
          ))
          .limit(50);

        // Generate embedding
        const embedding = await generateSupplierEmbedding(
          supplier.legalName,
          supplier.description,
          specialties,
          supplier.location,
          prods
        );

        // Update supplier
        await db
          .update(suppliers)
          .set({ searchEmbedding: embedding as any })
          .where(eq(suppliers.id, supplier.id));

        count++;
      }

      res.json({ message: `Generated embeddings for ${count} suppliers` });
    } catch (error: any) {
      console.error("Error generating bulk embeddings:", error);
      res.status(500).json({ message: "Error generating bulk embeddings" });
    }
  });

  // Create HTTP server
  const server = createServer(app);

  return server;
}
