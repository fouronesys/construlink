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
  type LoginData
} from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, hasRole, hashPassword, comparePassword } from "./auth";
import { storage } from "./storage";

const MONTHLY_SUBSCRIPTION_AMOUNT = 1000; // RD$1000

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
      
      // Call the DGII validation API
      const response = await fetch(`https://fouronerncvalidator.onrender.com/validate/${rnc}`);
      const data = await response.json();
      
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
        premium: 2500,
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
        plan: plan as 'basic' | 'premium' | 'enterprise',
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
        cancelUrl: `${req.protocol}://${req.get('host')}/register-supplier?payment=cancelled`
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

  // Process Verifone payment (manual payment processing)
  app.post('/api/process-verifone-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { subscriptionId, paymentMethod, amount } = req.body;
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!user || !supplier) {
        return res.status(404).json({ message: "User or supplier not found" });
      }

      const subscription = await storage.getSubscriptionBySupplierId(supplier.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Generate transaction ID for Verifone
      const transactionId = `vf_txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // In a real implementation, you would call Verifone API here
      // For now, we'll simulate a successful payment
      const paymentStatus = 'completed'; // This would come from Verifone API
      
      // Create payment record
      await storage.createPayment({
        subscriptionId: subscription.id,
        amount: (amount || MONTHLY_SUBSCRIPTION_AMOUNT).toString(),
        currency: 'DOP',
        status: paymentStatus,
        verifoneTransactionId: transactionId,
      });

      // Update subscription if payment successful
      if (paymentStatus === 'completed') {
        const nextPeriodEnd = new Date();
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
        
        await storage.updateSubscription(subscription.id, {
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextPeriodEnd,
        });
      }

      res.json({
        transactionId,
        status: paymentStatus,
        message: paymentStatus === 'completed' ? 
          "Payment processed successfully" : 
          "Payment failed, please try again"
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
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
      const quoteRequest = await storage.createQuoteRequest(quoteRequestData);
      
      // TODO: Send email notification to supplier
      
      res.json(quoteRequest);
    } catch (error) {
      console.error("Error creating quote request:", error);
      res.status(500).json({ message: "Failed to create quote request" });
    }
  });

  // Supplier dashboard endpoints
  app.get('/api/supplier/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const supplier = await storage.getSupplierByUserId(userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        supplierId: supplier.id,
      });

      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Admin endpoints
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
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

  // Get pending approvals
  app.get('/api/admin/approvals', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const pendingSuppliers = await storage.getSuppliers({ status: 'pending' });
      
      const suppliersWithDetails = await Promise.all(
        pendingSuppliers.map(async (supplier) => {
          const specialties = await storage.getSupplierSpecialties(supplier.id);
          return {
            ...supplier,
            specialties: specialties.map(s => s.specialty),
          };
        })
      );

      res.json(suppliersWithDetails);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  // Approve/reject supplier
  app.patch('/api/admin/suppliers/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { status, comments } = req.body;

      const updatedSupplier = await storage.updateSupplierStatus(id, status);
      
      // Create verification record
      await storage.createVerification({
        supplierId: id,
        adminId: user.id,
        decision: status === 'approved' ? 'approved' : 'rejected',
        comments,
      });

      // TODO: Send email notification to supplier

      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier status:", error);
      res.status(500).json({ message: "Failed to update supplier status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
