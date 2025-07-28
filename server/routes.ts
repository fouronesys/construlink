import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq, and, desc, ilike, inArray } from "drizzle-orm";
import { db } from "./db";
import { 
  suppliers, 
  users, 
  supplierSpecialties, 
  subscriptions, 
  payments, 
  reviews, 
  verifications,
  insertSupplierSchema,
  insertQuoteRequestSchema,
  insertProductSchema,
  registerSchema, 
  loginSchema,
  type InsertSupplier,
  type Supplier,
  type RegisterData,
  type LoginData,
  type PlanUsage
} from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, hasRole, hashPassword, comparePassword } from "./auth";
import { storage } from "./storage";

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
      
      // Find user
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
          
          (supplier as any).hasActiveSubscription = activeSubscription.length > 0;
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
      const userId = req.session.userId!;
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user.length) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Get supplier info if user is a supplier
      let supplier = null;
      if (user[0].role === 'supplier') {
        const supplierData = await db.select().from(suppliers).where(eq(suppliers.userId, userId)).limit(1);
        supplier = supplierData.length > 0 ? supplierData[0] : null;
      }
      
      res.json({ 
        id: user[0].id, 
        email: user[0].email, 
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        role: user[0].role,
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
      if (req.body.specialties && Array.isArray(req.body.specialties)) {
        for (const specialty of req.body.specialties) {
          await db.insert(supplierSpecialties).values({
            supplierId: newSupplier[0].id,
            specialty,
          });
        }
      }

      // Update user role
      await db.update(users).set({ role: 'supplier' }).where(eq(users.id, userId));

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
      const { plan = 'basic' } = req.body;
      
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
      if (existingSubscription.length > 0) {
        return res.status(400).json({ message: "El proveedor ya tiene una suscripción activa" });
      }

      // Plan pricing and trial days
      const planPricing: Record<string, number> = {
        basic: 1000,
        professional: 2500,
        enterprise: 5000
      };

      const amount = planPricing[plan] || 1000;

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
        plan: plan as 'basic' | 'professional' | 'enterprise',
        monthlyAmount: amount.toString()
      });

      // Generate payment session for Verifone
      const paymentSession = {
        subscriptionId: verifoneSubscriptionId,
        amount,
        currency: 'DOP',
        plan,
        description: `Suscripción mensual - Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        redirectUrl: `${req.protocol}://${req.get('host')}/supplier-dashboard?payment=success`,
        cancelUrl: `${req.protocol}://${req.get('host')}/register?payment=cancelled`
      };

      res.json({
        subscriptionId: verifoneSubscriptionId,
        paymentSession: paymentSession,
        amount,
        plan,
        message: "Subscription created successfully"
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Process Verifone payment
  app.post('/api/process-verifone-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { subscriptionId, paymentMethod, amount } = req.body;
      
      // In a real implementation, you would call Verifone API here
      // For now, we'll simulate a successful payment
      
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        // Update subscription status
        const subscription = await storage.getSubscriptionByVerifoneId(subscriptionId);
        if (subscription) {
          await storage.updateSubscription(subscription.id, { status: 'active' });
        }
        
        res.json({
          success: true,
          transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          message: 'Payment processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment failed. Please check your payment details.'
        });
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

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
      await storage.createPayment({
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



  // Get suppliers (public endpoint with filters)
  app.get('/api/suppliers', async (req, res) => {
    try {
      const { status = 'approved', specialty, location, search, page = '1', limit = '12' } = req.query;
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const suppliers = await storage.getSuppliers({
        status: status as string,
        specialty: specialty as string,
        location: location as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset,
      });

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

      res.json(suppliersWithSpecialties);
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
      const hasActiveSubscription = subscription && subscription.status === 'active';

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

      const { status, search, limit = 50, offset = 0 } = req.query;
      const suppliers = await storage.getSuppliers({
        status: status as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
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
            stats,
          };
        })
      );

      res.json(suppliersWithDetails);
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

      // TODO: Send email notification to supplier about status change

      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier status:", error);
      res.status(500).json({ message: "Failed to update supplier status" });
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
        return res.status(404).json({ message: "Subscription not found" });
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

  // Create review for supplier
  app.post('/api/suppliers/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
      const reviewData = {
        ...req.body,
        supplierId: id,
      };

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
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

      // Update supplier data (this would need to be implemented in storage)
      // For now, we'll return the current supplier data
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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

  // Create subscription with Verifone
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const { plan } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Check if supplier already has an active subscription
      const existingSubscription = await storage.getSubscriptionBySupplierId(supplier.id);
      if (existingSubscription && existingSubscription.status === 'active') {
        return res.status(400).json({ message: "Supplier already has an active subscription" });
      }

      // Plan pricing
      const planPricing = {
        basic: 1000,
        professional: 2500,
        enterprise: 5000
      };

      const amount = planPricing[plan as keyof typeof planPricing];
      if (!amount) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      // Create subscription
      const subscriptionData = {
        supplierId: supplier.id,
        plan: plan as 'basic' | 'professional' | 'enterprise',
        status: 'trialing' as const,
        monthlyAmount: amount.toString(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day trial
      };

      const subscription = await storage.createSubscription(subscriptionData);

      res.json({
        subscriptionId: subscription.id,
        plan,
        amount,
        trialEndDate: subscription.trialEndDate,
        message: "Subscription created successfully"
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Create HTTP server
  const server = createServer(app);

  return server;
}
