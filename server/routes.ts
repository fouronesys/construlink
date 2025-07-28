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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

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

  // Admin suppliers list with filtering
  app.get('/api/admin/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, search, limit = 50, offset = 0 } = req.query;
      const suppliers = await storage.getSuppliers({
        status,
        search,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Add user info and specialties to each supplier
      const suppliersWithDetails = await Promise.all(
        suppliers.map(async (supplier) => {
          const user = await storage.getUser(supplier.userId);
          const specialties = await storage.getSupplierSpecialties(supplier.id);
          const subscription = await storage.getSubscriptionBySupplierId(supplier.id);
          
          return {
            ...supplier,
            user,
            specialties: specialties.map(s => s.specialty),
            subscription,
          };
        })
      );

      res.json(suppliersWithDetails);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Approve supplier
  app.patch('/api/admin/suppliers/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const supplier = await storage.updateSupplierStatus(id, 'approved');
      res.json(supplier);
    } catch (error) {
      console.error("Error approving supplier:", error);
      res.status(500).json({ message: "Failed to approve supplier" });
    }
  });

  // Reject supplier
  app.patch('/api/admin/suppliers/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const { reason } = req.body;
      
      const supplier = await storage.updateSupplierStatus(id, 'rejected');
      // TODO: Store rejection reason and send email notification
      
      res.json(supplier);
    } catch (error) {
      console.error("Error rejecting supplier:", error);
      res.status(500).json({ message: "Failed to reject supplier" });
    }
  });

  // Suspend supplier
  app.patch('/api/admin/suppliers/:id/suspend', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const supplier = await storage.updateSupplierStatus(id, 'suspended');
      res.json(supplier);
    } catch (error) {
      console.error("Error suspending supplier:", error);
      res.status(500).json({ message: "Failed to suspend supplier" });
    }
  });

  // Delete/Edit product routes for suppliers
  app.patch('/api/supplier/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const { id } = req.params;
      const updates = req.body;
      
      // Verify the product belongs to this supplier
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/supplier/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const { id } = req.params;
      
      // Verify the product belongs to this supplier
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Create subscription
  app.post('/api/subscriptions/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const { planId, planName, monthlyAmount } = req.body;

      // Check if user is a supplier
      const supplier = await storage.getSupplierByUserId(userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Create subscription record
      const subscription = await storage.createSubscription({
        supplierId: supplier.id,
        plan: planId,
        monthlyAmount: monthlyAmount.toString(),
        status: 'trialing',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
      });

      res.json({ subscriptionId: subscription.id });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Get subscription details
  app.get('/api/subscriptions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Get supplier plan limits
  app.get('/api/suppliers/plan-limits/:supplierId', isAuthenticated, async (req: any, res) => {
    try {
      const { supplierId } = req.params;
      const limits = await storage.getSupplierPlanLimits(supplierId);
      res.json(limits);
    } catch (error) {
      console.error("Error fetching plan limits:", error);
      res.status(500).json({ message: "Failed to fetch plan limits" });
    }
  });

  // Update plan usage (for tracking limits)
  app.post('/api/plan-usage/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      const { supplierId, type, increment = 1 } = req.body;
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Get or create plan usage for current month
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

      // Update the specific counter
      const updates: Partial<typeof usage> = {};
      switch (type) {
        case 'products':
          updates.productsCount = (parseInt(usage.productsCount || "0") + increment).toString();
          break;
        case 'quotes':
          updates.quotesReceived = (parseInt(usage.quotesReceived || "0") + increment).toString();
          break;
        case 'specialties':
          updates.specialtiesCount = (parseInt(usage.specialtiesCount || "0") + increment).toString();
          break;
        case 'photos':
          updates.projectPhotos = (parseInt(usage.projectPhotos || "0") + increment).toString();
          break;
      }

      if (Object.keys(updates).length > 0) {
        usage = await storage.updatePlanUsage(supplierId, month, updates);
      }

      res.json(usage);
    } catch (error) {
      console.error("Error updating plan usage:", error);
      res.status(500).json({ message: "Failed to update plan usage" });
    }
  });

  // Check plan limits before actions
  app.post('/api/plan-limits/check', isAuthenticated, async (req: any, res) => {
    try {
      const { supplierId, type } = req.body;
      const month = new Date().toISOString().slice(0, 7);

      const limits = await storage.getSupplierPlanLimits(supplierId);
      const usage = await storage.getPlanUsage(supplierId, month);

      let canPerformAction = true;
      let message = "";

      if (usage) {
        switch (type) {
          case 'product':
            if (limits.maxProducts !== -1 && parseInt(usage.productsCount || "0") >= limits.maxProducts) {
              canPerformAction = false;
              message = `Has alcanzado el límite de ${limits.maxProducts} productos para tu plan ${limits.plan}`;
            }
            break;
          case 'quote':
            if (limits.maxQuotes !== -1 && parseInt(usage.quotesReceived || "0") >= limits.maxQuotes) {
              canPerformAction = false;
              message = `Has alcanzado el límite de ${limits.maxQuotes} cotizaciones por mes para tu plan ${limits.plan}`;
            }
            break;
          case 'specialty':
            if (limits.maxSpecialties !== -1 && parseInt(usage.specialtiesCount || "0") >= limits.maxSpecialties) {
              canPerformAction = false;
              message = `Has alcanzado el límite de ${limits.maxSpecialties} especialidades para tu plan ${limits.plan}`;
            }
            break;
          case 'photo':
            if (limits.maxProjectPhotos !== -1 && parseInt(usage.projectPhotos || "0") >= limits.maxProjectPhotos) {
              canPerformAction = false;
              message = `Has alcanzado el límite de ${limits.maxProjectPhotos} fotos de proyectos para tu plan ${limits.plan}`;
            }
            break;
        }
      }

      res.json({ 
        canPerformAction, 
        message, 
        limits, 
        currentUsage: usage 
      });
    } catch (error) {
      console.error("Error checking plan limits:", error);
      res.status(500).json({ message: "Failed to check plan limits" });
    }
  });

  // Get plan usage for specific month
  app.get('/api/plan-usage/:supplierId/:month', isAuthenticated, async (req: any, res) => {
    try {
      const { supplierId, month } = req.params;
      const usage = await storage.getPlanUsage(supplierId, month);
      
      if (!usage) {
        return res.status(404).json({ message: "Usage data not found" });
      }
      
      res.json(usage);
    } catch (error) {
      console.error("Error fetching plan usage:", error);
      res.status(500).json({ message: "Failed to fetch plan usage" });
    }
  });

  // Process Verifone payment
  app.post('/api/payments/process-verifone', isAuthenticated, async (req: any, res) => {
    try {
      const { subscriptionId, planId, amount, paymentMethod } = req.body;

      // Validate required Verifone credentials
      if (!process.env.VERIFONE_MERCHANT_CODE || !process.env.VERIFONE_SECRET_KEY) {
        return res.status(500).json({ 
          success: false, 
          message: "Verifone credentials not configured" 
        });
      }

      // Here we would integrate with actual Verifone API
      // For now, simulate successful payment processing
      const paymentData = {
        merchantCode: process.env.VERIFONE_MERCHANT_CODE,
        amount: amount,
        currency: 'DOP',
        cardNumber: paymentMethod.cardNumber,
        expiryDate: paymentMethod.expiryDate,
        cvv: paymentMethod.cvv,
        cardholderName: paymentMethod.cardholderName
      };

      // Simulate Verifone API call
      const verifoneResponse = await processVerifonePayment(paymentData);

      if (verifoneResponse.success) {
        // Update subscription status to active
        await storage.updateSubscriptionStatus(subscriptionId, 'active');

        // Update supplier status to approved if pending
        const subscription = await storage.getSubscription(subscriptionId);
        if (subscription) {
          const supplier = await storage.getSupplier(subscription.supplierId);
          if (supplier && supplier.status === 'pending') {
            await storage.updateSupplierStatus(subscription.supplierId, 'approved');
          }
        }

        res.json({ 
          success: true, 
          transactionId: verifoneResponse.transactionId,
          message: "Payment processed successfully" 
        });
      } else {
        res.json({ 
          success: false, 
          message: verifoneResponse.error || "Payment failed" 
        });
      }
    } catch (error) {
      console.error("Error processing Verifone payment:", error);
      res.status(500).json({ 
        success: false, 
        message: "Payment processing error" 
      });
    }
  });

  // Verifone payment simulation function
  async function processVerifonePayment(paymentData: any) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Basic validation
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
      return {
        success: false,
        error: "Invalid payment data"
      };
    }

    // Simulate success (90% success rate)
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        transactionId: `VF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      return {
        success: false,
        error: "Payment declined by bank"
      };
    }
  }

  // Get pending approvals
  app.get('/api/admin/approvals', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user; // User is already attached by isAuthenticated middleware
      
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
