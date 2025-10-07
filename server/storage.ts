import {
  users,
  suppliers,
  supplierSpecialties,
  subscriptions,
  payments,
  refunds,
  invoices,
  products,
  services,
  quoteRequests,
  verifications,
  reviews,
  reviewResponses,
  reviewReports,
  supplierDocuments,
  supplierBanners,
  planUsage,
  adminActions,
  platformConfig,
  type User,
  type UpsertUser,
  type Supplier,
  type InsertSupplier,
  type SupplierSpecialty,
  type InsertSupplierSpecialty,
  type SupplierBanner,
  type InsertSupplierBanner,
  type Subscription,
  type InsertSubscription,
  type Payment,
  type InsertPayment,
  type Refund,
  type InsertRefund,
  type Invoice,
  type InsertInvoice,
  type Product,
  type InsertProduct,
  type Service,
  type InsertService,
  type QuoteRequest,
  type InsertQuoteRequest,
  type Verification,
  type InsertVerification,
  type Review,
  type InsertReview,
  type ReviewResponse,
  type InsertReviewResponse,
  type ReviewReport,
  type InsertReviewReport,
  type SupplierDocument,
  type InsertSupplierDocument,
  type PlanUsage,
  type InsertPlanUsage,
  type AdminAction,
  type InsertAdminAction,
  type PlatformConfig,
  type InsertPlatformConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, ilike, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Supplier operations
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSupplierByUserId(userId: string): Promise<Supplier | undefined>;
  getSupplierByRnc(rnc: string): Promise<Supplier | undefined>;
  updateSupplierStatus(id: string, status: "pending" | "approved" | "suspended" | "rejected"): Promise<Supplier>;
  updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier>;
  getSuppliers(filters?: {
    status?: string;
    specialty?: string;
    location?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Supplier[]>;
  deleteSupplier(id: string): Promise<void>;
  
  // Supplier specialties
  addSupplierSpecialty(specialty: InsertSupplierSpecialty): Promise<SupplierSpecialty>;
  getSupplierSpecialties(supplierId: string): Promise<SupplierSpecialty[]>;
  
  // Supplier documents
  addSupplierDocument(document: InsertSupplierDocument): Promise<SupplierDocument>;
  getSupplierDocuments(supplierId: string): Promise<SupplierDocument[]>;
  
  // Featured suppliers
  toggleFeaturedStatus(supplierId: string, isFeatured: boolean): Promise<Supplier>;
  getFeaturedSuppliers(): Promise<Supplier[]>;
  
  // Supplier banners
  createBanner(banner: InsertSupplierBanner): Promise<SupplierBanner>;
  getBannersBySupplierId(supplierId: string): Promise<SupplierBanner[]>;
  getBanner(id: string): Promise<SupplierBanner | undefined>;
  updateBanner(id: string, updates: Partial<SupplierBanner>): Promise<SupplierBanner>;
  deleteBanner(id: string): Promise<void>;
  getActiveFeaturedBanners(): Promise<SupplierBanner[]>;
  incrementBannerClicks(bannerId: string): Promise<boolean>;
  incrementBannerImpressions(bannerId: string): Promise<boolean>;
  getBannerStats(): Promise<{ bannerId: string; supplierId: string; supplierName: string; clicks: number; impressions: number; deviceType: string; }[]>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | null>;
  getSubscriptionBySupplierId(supplierId: string): Promise<Subscription | undefined>;
  getSubscriptionByVerifoneId(verifoneId: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  updateSubscriptionStatus(id: string, status: "active" | "inactive" | "cancelled" | "trialing"): Promise<Subscription>;
  getActiveSubscriptions(): Promise<Subscription[]>;
  getAllSubscriptions(filters?: {
    status?: string;
    plan?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    subscriptions: Array<Subscription & {
      supplierName?: string;
      supplierEmail?: string;
    }>;
    total: number;
  }>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsBySubscriptionId(subscriptionId: string): Promise<Payment[]>;
  getAllPayments(filters?: {
    status?: string;
    supplierId?: string;
    plan?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ 
    payments: Array<Payment & { 
      userName?: string;
      userEmail?: string;
    }>; 
    total: number;
  }>;
  getPaymentStats(): Promise<{
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    averageAmount: number;
    revenueByPlan: Array<{
      planType: string;
      totalRevenue: number;
      count: number;
    }>;
  }>;
  
  // Refund operations
  createRefund(refund: InsertRefund): Promise<Refund>;
  getRefundsByPaymentId(paymentId: string): Promise<Refund[]>;
  getRefund(id: string): Promise<Refund | undefined>;
  getAllRefunds(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ 
    refunds: Array<Refund & { 
      paymentAmount?: number;
      supplierName?: string;
    }>; 
    total: number;
  }>;
  processRefund(id: string, updates: { status: "approved" | "rejected" | "completed"; processedBy: string; verifoneRefundId?: string; }): Promise<Refund>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByPaymentId(paymentId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getAllInvoices(filters?: {
    status?: string;
    supplierId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ 
    invoices: Array<Invoice & { 
      supplierName?: string;
    }>; 
    total: number;
  }>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  getNextInvoiceNumber(): Promise<string>;
  getNextNCF(sequence: string): Promise<string>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProductsBySupplierId(supplierId: string): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Service operations
  createService(service: InsertService): Promise<Service>;
  getServicesBySupplierId(supplierId: string): Promise<Service[]>;
  updateService(id: string, updates: Partial<Service>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  
  // Quote request operations
  createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest>;
  getQuoteRequestsBySupplierId(supplierId: string): Promise<QuoteRequest[]>;
  updateQuoteRequestStatus(id: string, status: "pending" | "responded" | "closed"): Promise<QuoteRequest>;
  
  // Verification operations
  createVerification(verification: InsertVerification): Promise<Verification>;
  getVerificationsBySupplierId(supplierId: string): Promise<Verification[]>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsBySupplierId(supplierId: string, filters?: {
    sortBy?: 'recent' | 'rating_high' | 'rating_low';
    limit?: number;
    offset?: number;
  }): Promise<Review[]>;
  updateSupplierRating(supplierId: string): Promise<void>;
  canUserReview(supplierId: string, userId?: string, email?: string): Promise<boolean>;
  
  // Review response operations
  createReviewResponse(response: InsertReviewResponse): Promise<ReviewResponse>;
  getReviewResponse(reviewId: string): Promise<ReviewResponse | undefined>;
  updateReviewResponse(id: string, responseText: string): Promise<ReviewResponse>;
  deleteReviewResponse(id: string): Promise<void>;
  
  // Review report operations
  createReviewReport(report: InsertReviewReport): Promise<ReviewReport>;
  getReviewReports(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ReviewReport[]>;
  updateReviewReportStatus(id: string, status: 'reviewed' | 'resolved' | 'dismissed', reviewedBy: string, reviewNotes?: string): Promise<ReviewReport>;
  
  // Plan usage operations
  createPlanUsage(usage: InsertPlanUsage): Promise<PlanUsage>;
  getPlanUsage(supplierId: string, month: string): Promise<PlanUsage | undefined>;
  updatePlanUsage(supplierId: string, month: string, updates: Partial<PlanUsage>): Promise<PlanUsage>;
  getSupplierPlanLimits(supplierId: string): Promise<{
    plan: string;
    maxProducts: number;
    maxQuotes: number;
    maxSpecialties: number;
    maxProjectPhotos: number;
    hasPriority: boolean;
    hasAnalytics: boolean;
    hasApiAccess: boolean;
  }>;
  
  // Analytics
  getSupplierStats(supplierId: string): Promise<{
    totalQuotes: number;
    totalViews: number;
    averageRating: number;
    totalReviews: number;
  }>;
  
  getAdminStats(): Promise<{
    totalSuppliers: number;
    pendingApprovals: number;
    totalQuotes: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
  }>;
  
  // Admin actions operations
  logAdminAction(action: InsertAdminAction): Promise<AdminAction>;
  getAdminActions(filters?: {
    adminId?: string;
    actionType?: string;
    entityType?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminAction[]>;
  getUsers(): Promise<User[]>;
  getAdminUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: "client" | "supplier" | "moderator" | "support" | "admin" | "superadmin"): Promise<User>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User>;
  
  // Platform configuration operations
  getPlatformConfig(configKey: string): Promise<PlatformConfig | undefined>;
  getAllPlatformConfigs(): Promise<PlatformConfig[]>;
  upsertPlatformConfig(config: { configKey: string; configValue: any; description?: string; updatedBy?: string; }): Promise<PlatformConfig>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.id) {
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    } else {
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          password: userData.password || 'oauth_user',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return user;
    }
  }

  // Supplier operations
  async createSupplier(supplier: InsertSupplier & { userId: string }): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getSupplierByUserId(userId: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.userId, userId));
    return supplier;
  }

  async getSupplierByRnc(rnc: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.rnc, rnc));
    return supplier;
  }

  async updateSupplierStatus(id: string, status: "pending" | "approved" | "suspended" | "rejected"): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ 
        status, 
        approvalDate: status === "approved" ? new Date() : null,
        updatedAt: new Date() 
      })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ 
        ...updates,
        updatedAt: new Date() 
      })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async getSuppliers(filters?: {
    status?: string;
    specialty?: string;
    location?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Supplier[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(suppliers.status, filters.status as any));
    }
    
    if (filters?.location) {
      conditions.push(ilike(suppliers.location, `%${filters.location}%`));
    }
    
    // Filter by specialty if provided
    if (filters?.specialty) {
      const suppliersWithSpecialty = await db
        .select({ id: supplierSpecialties.supplierId })
        .from(supplierSpecialties)
        .where(ilike(supplierSpecialties.specialty, `%${filters.specialty}%`));
      
      const specialtySupplierIds = suppliersWithSpecialty.map(s => s.id);
      
      if (specialtySupplierIds.length > 0) {
        conditions.push(inArray(suppliers.id, specialtySupplierIds));
      } else {
        // No suppliers with this specialty found
        return [];
      }
    }
    
    // Enhanced search: search in supplier name, specialties, products (name, description, category)
    // When searching, we want to find suppliers where ANY of these match (OR logic within search)
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      
      const searchConditions = [
        // Match in supplier name
        ilike(suppliers.legalName, searchTerm)
      ];
      
      // Find supplier IDs that match in specialties
      const suppliersBySpecialty = await db
        .select({ id: supplierSpecialties.supplierId })
        .from(supplierSpecialties)
        .where(ilike(supplierSpecialties.specialty, searchTerm));
      
      // Find supplier IDs that match in products (name, description, or category)
      const suppliersByProducts = await db
        .select({ id: products.supplierId })
        .from(products)
        .where(
          or(
            ilike(products.name, searchTerm),
            ilike(products.description, searchTerm),
            ilike(products.category, searchTerm)
          )
        );
      
      // Combine specialty and product matches
      const matchingSupplierIds = new Set([
        ...suppliersBySpecialty.map(s => s.id),
        ...suppliersByProducts.map(s => s.id)
      ]);
      
      // Add supplier IDs from specialty/product matches to the OR condition
      if (matchingSupplierIds.size > 0) {
        searchConditions.push(inArray(suppliers.id, Array.from(matchingSupplierIds)));
      }
      
      // Combine all search conditions with OR
      conditions.push(or(...searchConditions));
    }
    
    let query = db.select().from(suppliers);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(suppliers.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getSuppliersWithCount(filters?: {
    status?: string;
    specialty?: string;
    location?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ suppliers: Supplier[]; total: number }> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(suppliers.status, filters.status as any));
    }
    
    if (filters?.location) {
      conditions.push(ilike(suppliers.location, `%${filters.location}%`));
    }
    
    // Filter by specialty if provided
    if (filters?.specialty) {
      const suppliersWithSpecialty = await db
        .select({ id: supplierSpecialties.supplierId })
        .from(supplierSpecialties)
        .where(ilike(supplierSpecialties.specialty, `%${filters.specialty}%`));
      
      const specialtySupplierIds = suppliersWithSpecialty.map(s => s.id);
      
      if (specialtySupplierIds.length > 0) {
        conditions.push(inArray(suppliers.id, specialtySupplierIds));
      } else {
        // No suppliers with this specialty found
        return { suppliers: [], total: 0 };
      }
    }
    
    // Enhanced search: search in supplier name, specialties, products (name, description, category)
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      
      const searchConditions = [
        ilike(suppliers.legalName, searchTerm)
      ];
      
      const suppliersBySpecialty = await db
        .select({ id: supplierSpecialties.supplierId })
        .from(supplierSpecialties)
        .where(ilike(supplierSpecialties.specialty, searchTerm));
      
      const suppliersByProducts = await db
        .select({ id: products.supplierId })
        .from(products)
        .where(
          or(
            ilike(products.name, searchTerm),
            ilike(products.description, searchTerm),
            ilike(products.category, searchTerm)
          )
        );
      
      const matchingSupplierIds = new Set([
        ...suppliersBySpecialty.map(s => s.id),
        ...suppliersByProducts.map(s => s.id)
      ]);
      
      if (matchingSupplierIds.size > 0) {
        searchConditions.push(inArray(suppliers.id, Array.from(matchingSupplierIds)));
      }
      
      conditions.push(or(...searchConditions));
    }
    
    // Count total
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(suppliers);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const [{ count }] = await countQuery;
    
    // Get paginated results
    let query = db.select().from(suppliers);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(suppliers.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    const results = await query;
    
    return { suppliers: results, total: Number(count) };
  }

  // Supplier specialties
  async addSupplierSpecialty(specialty: InsertSupplierSpecialty): Promise<SupplierSpecialty> {
    const [newSpecialty] = await db.insert(supplierSpecialties).values(specialty).returning();
    return newSpecialty;
  }

  async getSupplierSpecialties(supplierId: string): Promise<SupplierSpecialty[]> {
    return await db
      .select()
      .from(supplierSpecialties)
      .where(eq(supplierSpecialties.supplierId, supplierId));
  }

  // Supplier documents
  async addSupplierDocument(document: InsertSupplierDocument): Promise<SupplierDocument> {
    const [newDocument] = await db.insert(supplierDocuments).values(document).returning();
    return newDocument;
  }

  async getSupplierDocuments(supplierId: string): Promise<SupplierDocument[]> {
    return await db
      .select()
      .from(supplierDocuments)
      .where(eq(supplierDocuments.supplierId, supplierId));
  }

  // Featured suppliers
  async toggleFeaturedStatus(supplierId: string, isFeatured: boolean): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ 
        isFeatured,
        featuredSince: isFeatured ? new Date() : null,
        updatedAt: new Date() 
      })
      .where(eq(suppliers.id, supplierId))
      .returning();
    return updatedSupplier;
  }

  async getFeaturedSuppliers(): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.isFeatured, true), eq(suppliers.status, 'approved')))
      .orderBy(desc(suppliers.featuredSince));
  }

  // Supplier banners
  async createBanner(banner: InsertSupplierBanner): Promise<SupplierBanner> {
    const [newBanner] = await db.insert(supplierBanners).values(banner).returning();
    return newBanner;
  }

  async getBannersBySupplierId(supplierId: string): Promise<SupplierBanner[]> {
    return await db
      .select()
      .from(supplierBanners)
      .where(eq(supplierBanners.supplierId, supplierId))
      .orderBy(asc(supplierBanners.displayOrder));
  }

  async getBanner(id: string): Promise<SupplierBanner | undefined> {
    const [banner] = await db
      .select()
      .from(supplierBanners)
      .where(eq(supplierBanners.id, id));
    return banner;
  }

  async updateBanner(id: string, updates: Partial<SupplierBanner>): Promise<SupplierBanner> {
    const [updatedBanner] = await db
      .update(supplierBanners)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supplierBanners.id, id))
      .returning();
    return updatedBanner;
  }

  async deleteBanner(id: string): Promise<void> {
    await db.delete(supplierBanners).where(eq(supplierBanners.id, id));
  }

  async getActiveFeaturedBanners(): Promise<SupplierBanner[]> {
    return await db
      .select()
      .from(supplierBanners)
      .innerJoin(suppliers, eq(supplierBanners.supplierId, suppliers.id))
      .where(and(
        eq(supplierBanners.isActive, true),
        eq(suppliers.isFeatured, true),
        eq(suppliers.status, 'approved')
      ))
      .orderBy(asc(supplierBanners.displayOrder))
      .then(results => results.map(r => r.supplier_banners));
  }

  async incrementBannerClicks(bannerId: string): Promise<boolean> {
    const result = await db
      .update(supplierBanners)
      .set({ 
        clickCount: sql`${supplierBanners.clickCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(supplierBanners.id, bannerId))
      .returning({ id: supplierBanners.id });
    
    return result.length > 0;
  }

  async incrementBannerImpressions(bannerId: string): Promise<boolean> {
    const result = await db
      .update(supplierBanners)
      .set({ 
        impressionCount: sql`${supplierBanners.impressionCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(supplierBanners.id, bannerId))
      .returning({ id: supplierBanners.id });
    
    return result.length > 0;
  }

  async getBannerStats(): Promise<{ bannerId: string; supplierId: string; supplierName: string; clicks: number; impressions: number; deviceType: string; }[]> {
    const results = await db
      .select({
        bannerId: supplierBanners.id,
        supplierId: suppliers.id,
        supplierName: suppliers.legalName,
        clicks: supplierBanners.clickCount,
        impressions: supplierBanners.impressionCount,
        deviceType: supplierBanners.deviceType,
      })
      .from(supplierBanners)
      .innerJoin(suppliers, eq(supplierBanners.supplierId, suppliers.id))
      .where(eq(suppliers.isFeatured, true))
      .orderBy(desc(supplierBanners.clickCount));
    
    return results.map(r => ({
      bannerId: r.bannerId,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      clicks: parseInt(r.clicks || '0'),
      impressions: parseInt(r.impressions || '0'),
      deviceType: r.deviceType,
    }));
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async getSubscriptionBySupplierId(supplierId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.supplierId, supplierId))
      .orderBy(desc(subscriptions.createdAt));
    return subscription;
  }

  async getSubscriptionByVerifoneId(verifoneId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.verifoneSubscriptionId, verifoneId));
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentsBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.subscriptionId, subscriptionId))
      .orderBy(desc(payments.paymentDate));
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async getAllPayments(filters?: {
    status?: string;
    supplierId?: string;
    plan?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ 
    payments: Array<Payment & { 
      userName?: string;
      userEmail?: string;
    }>; 
    total: number;
  }> {
    const whereConditions = [];
    
    if (filters?.status) {
      whereConditions.push(eq(payments.status, filters.status as any));
    }

    if (filters?.supplierId) {
      whereConditions.push(eq(suppliers.id, filters.supplierId));
    }

    if (filters?.plan) {
      whereConditions.push(eq(subscriptions.plan, filters.plan as any));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereConditions.push(
        sql`(
          ${users.firstName} ILIKE ${searchTerm} OR
          ${users.email} ILIKE ${searchTerm} OR
          ${payments.id} ILIKE ${searchTerm} OR
          ${payments.verifoneTransactionId} ILIKE ${searchTerm}
        )`
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .leftJoin(suppliers, eq(subscriptions.supplierId, suppliers.id))
      .leftJoin(users, eq(suppliers.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await db
      .select({
        payment: payments,
        subscription: subscriptions,
        supplier: suppliers,
        user: users,
      })
      .from(payments)
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .leftJoin(suppliers, eq(subscriptions.supplierId, suppliers.id))
      .leftJoin(users, eq(suppliers.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(payments.paymentDate))
      .limit(filters?.limit || 10)
      .offset(filters?.offset || 0);
    
    const paymentsData = results.map(r => ({
      ...r.payment,
      userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : undefined,
      userEmail: r.user?.email || undefined,
    }));

    return { payments: paymentsData, total };
  }

  async getPaymentStats(): Promise<{
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    averageAmount: number;
    revenueByPlan: Array<{
      planType: string;
      totalRevenue: number;
      count: number;
    }>;
  }> {
    const allPayments = await db
      .select({
        payment: payments,
        subscription: subscriptions,
      })
      .from(payments)
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .orderBy(desc(payments.paymentDate));

    const totalPayments = allPayments.length;
    const successfulPayments = allPayments.filter(p => p.payment.status === 'completed').length;
    const failedPayments = allPayments.filter(p => p.payment.status === 'failed').length;
    const pendingPayments = allPayments.filter(p => p.payment.status === 'pending').length;

    const totalRevenue = allPayments
      .filter(p => p.payment.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.payment.amount || '0'), 0);

    const averageAmount = successfulPayments > 0 
      ? totalRevenue / successfulPayments 
      : 0;

    // Calculate revenue by plan
    const revenueByPlanMap = new Map<string, { totalRevenue: number; count: number }>();
    
    allPayments
      .filter(p => p.payment.status === 'completed')
      .forEach(p => {
        const planType = p.subscription?.plan || 'Unknown';
        const amount = parseFloat(p.payment.amount || '0');
        
        if (revenueByPlanMap.has(planType)) {
          const existing = revenueByPlanMap.get(planType)!;
          revenueByPlanMap.set(planType, {
            totalRevenue: existing.totalRevenue + amount,
            count: existing.count + 1,
          });
        } else {
          revenueByPlanMap.set(planType, {
            totalRevenue: amount,
            count: 1,
          });
        }
      });

    const revenueByPlan = Array.from(revenueByPlanMap.entries()).map(([planType, data]) => ({
      planType,
      ...data,
    }));

    return {
      totalRevenue,
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      averageAmount,
      revenueByPlan,
    };
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProductsBySupplierId(supplierId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.supplierId, supplierId))
      .orderBy(desc(products.createdAt));
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Service operations
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async getServicesBySupplierId(supplierId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.supplierId, supplierId))
      .orderBy(desc(services.createdAt));
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Quote request operations
  async createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest> {
    const [newQuoteRequest] = await db.insert(quoteRequests).values(quoteRequest).returning();
    return newQuoteRequest;
  }

  async getQuoteRequestsBySupplierId(supplierId: string): Promise<QuoteRequest[]> {
    return await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.supplierId, supplierId))
      .orderBy(desc(quoteRequests.createdAt));
  }

  async updateQuoteRequestStatus(id: string, status: "pending" | "responded" | "closed"): Promise<QuoteRequest> {
    const [updatedQuoteRequest] = await db
      .update(quoteRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(quoteRequests.id, id))
      .returning();
    return updatedQuoteRequest;
  }

  // Verification operations
  async createVerification(verification: InsertVerification): Promise<Verification> {
    const [newVerification] = await db.insert(verifications).values(verification).returning();
    return newVerification;
  }

  async getVerificationsBySupplierId(supplierId: string): Promise<Verification[]> {
    return await db
      .select()
      .from(verifications)
      .where(eq(verifications.supplierId, supplierId))
      .orderBy(desc(verifications.createdAt));
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    await this.updateSupplierRating(review.supplierId);
    return newReview;
  }

  async getReviewsBySupplierId(supplierId: string, filters?: {
    sortBy?: 'recent' | 'rating_high' | 'rating_low';
    limit?: number;
    offset?: number;
  }): Promise<Review[]> {
    let query = db
      .select()
      .from(reviews)
      .where(eq(reviews.supplierId, supplierId));
    
    // Apply sorting
    if (filters?.sortBy === 'rating_high') {
      query = query.orderBy(desc(reviews.rating), desc(reviews.createdAt)) as any;
    } else if (filters?.sortBy === 'rating_low') {
      query = query.orderBy(asc(reviews.rating), desc(reviews.createdAt)) as any;
    } else {
      // Default: recent first
      query = query.orderBy(desc(reviews.createdAt)) as any;
    }
    
    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  async updateSupplierRating(supplierId: string): Promise<void> {
    const supplierReviews = await this.getReviewsBySupplierId(supplierId);
    
    if (supplierReviews.length === 0) {
      await db
        .update(suppliers)
        .set({ 
          averageRating: sql`0`,
          totalReviews: 0,
          updatedAt: new Date()
        })
        .where(eq(suppliers.id, supplierId));
      return;
    }

    const totalRating = supplierReviews.reduce((sum, review) => {
      return sum + parseFloat(review.rating);
    }, 0);
    
    const averageRating = totalRating / supplierReviews.length;
    
    await db
      .update(suppliers)
      .set({ 
        averageRating: sql`${averageRating}`,
        totalReviews: supplierReviews.length,
        updatedAt: new Date()
      })
      .where(eq(suppliers.id, supplierId));
  }

  async canUserReview(supplierId: string, userId?: string, email?: string): Promise<boolean> {
    if (!userId && !email) return false;

    const conditions = [];
    
    if (userId) {
      conditions.push(eq(reviews.userId, userId));
    }
    if (email) {
      conditions.push(eq(reviews.clientEmail, email));
    }

    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.supplierId, supplierId),
          or(...conditions)
        )
      )
      .limit(1);

    return existingReview.length === 0;
  }

  // Review response operations
  async createReviewResponse(response: InsertReviewResponse): Promise<ReviewResponse> {
    const [newResponse] = await db.insert(reviewResponses).values(response).returning();
    return newResponse;
  }

  async getReviewResponse(reviewId: string): Promise<ReviewResponse | undefined> {
    const [response] = await db
      .select()
      .from(reviewResponses)
      .where(eq(reviewResponses.reviewId, reviewId))
      .limit(1);
    return response;
  }

  async updateReviewResponse(id: string, responseText: string): Promise<ReviewResponse> {
    const [updated] = await db
      .update(reviewResponses)
      .set({ responseText, updatedAt: new Date() })
      .where(eq(reviewResponses.id, id))
      .returning();
    return updated;
  }

  async deleteReviewResponse(id: string): Promise<void> {
    await db.delete(reviewResponses).where(eq(reviewResponses.id, id));
  }

  // Review report operations
  async createReviewReport(report: InsertReviewReport): Promise<ReviewReport> {
    const [newReport] = await db.insert(reviewReports).values(report).returning();
    return newReport;
  }

  async getReviewReports(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ReviewReport[]> {
    let query = db.select().from(reviewReports);

    if (filters?.status && filters.status !== 'all') {
      query = query.where(eq(reviewReports.status, filters.status as any)) as any;
    }

    query = query.orderBy(desc(reviewReports.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async updateReviewReportStatus(
    id: string, 
    status: 'reviewed' | 'resolved' | 'dismissed', 
    reviewedBy: string, 
    reviewNotes?: string
  ): Promise<ReviewReport> {
    const [updated] = await db
      .update(reviewReports)
      .set({ 
        status, 
        reviewedBy, 
        reviewNotes,
        resolvedAt: new Date() 
      })
      .where(eq(reviewReports.id, id))
      .returning();
    return updated;
  }

  // Additional subscription operations
  async getSubscription(id: string): Promise<Subscription | null> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);
    return subscription ?? null;
  }

  async updateSubscriptionStatus(id: string, status: "active" | "inactive" | "cancelled" | "trialing"): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
  }

  async getAllSubscriptions(filters?: {
    status?: string;
    plan?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    subscriptions: Array<Subscription & {
      supplierName?: string;
      supplierEmail?: string;
    }>;
    total: number;
  }> {
    const whereConditions = [];

    if (filters?.status && filters.status !== 'all') {
      whereConditions.push(eq(subscriptions.status, filters.status as any));
    }

    if (filters?.plan && filters.plan !== 'all') {
      whereConditions.push(eq(subscriptions.plan, filters.plan as any));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereConditions.push(
        sql`(
          ${suppliers.legalName} ILIKE ${searchTerm} OR
          ${suppliers.email} ILIKE ${searchTerm} OR
          ${subscriptions.verifoneSubscriptionId} ILIKE ${searchTerm}
        )`
      );
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .leftJoin(suppliers, eq(subscriptions.supplierId, suppliers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    const results = await db
      .select({
        subscription: subscriptions,
        supplier: suppliers,
      })
      .from(subscriptions)
      .leftJoin(suppliers, eq(subscriptions.supplierId, suppliers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(subscriptions.createdAt))
      .limit(filters?.limit || 10)
      .offset(filters?.offset || 0);

    const subscriptionsData = results.map(r => ({
      ...r.subscription,
      supplierName: r.supplier?.legalName || undefined,
      supplierEmail: r.supplier?.email || undefined,
    }));

    return { subscriptions: subscriptionsData, total };
  }

  // Analytics
  async getSupplierStats(supplierId: string): Promise<{
    totalQuotes: number;
    totalViews: number;
    averageRating: number;
    totalReviews: number;
  }> {
    const [quotesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quoteRequests)
      .where(eq(quoteRequests.supplierId, supplierId));

    const [reviewsResult] = await db
      .select({ 
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(rating)`
      })
      .from(reviews)
      .where(eq(reviews.supplierId, supplierId));

    return {
      totalQuotes: quotesResult?.count || 0,
      totalViews: 1247, // This would come from a tracking system
      averageRating: reviewsResult?.avgRating || 0,
      totalReviews: reviewsResult?.count || 0,
    };
  }

  // Plan usage operations
  async createPlanUsage(usage: InsertPlanUsage): Promise<PlanUsage> {
    const [newUsage] = await db.insert(planUsage).values(usage).returning();
    return newUsage;
  }

  async getPlanUsage(supplierId: string, month: string): Promise<PlanUsage | undefined> {
    const [usage] = await db
      .select()
      .from(planUsage)
      .where(and(eq(planUsage.supplierId, supplierId), eq(planUsage.month, month)))
      .limit(1);
    return usage;
  }

  async updatePlanUsage(supplierId: string, month: string, updates: Partial<PlanUsage>): Promise<PlanUsage> {
    const [updatedUsage] = await db
      .update(planUsage)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(planUsage.supplierId, supplierId), eq(planUsage.month, month)))
      .returning();
    return updatedUsage;
  }

  async getSupplierPlanLimits(supplierId: string): Promise<{
    plan: string;
    maxProducts: number;
    maxQuotes: number;
    maxSpecialties: number;
    maxProjectPhotos: number;
    hasPriority: boolean;
    hasAnalytics: boolean;
    hasApiAccess: boolean;
  }> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.supplierId, supplierId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const plan = subscription?.plan || 'basic';
    
    const planLimits = {
      basic: {
        plan: 'basic',
        maxProducts: 10,
        maxQuotes: 5,
        maxSpecialties: 1,
        maxProjectPhotos: 0,
        hasPriority: false,
        hasAnalytics: false,
        hasApiAccess: false,
      },
      professional: {
        plan: 'professional',
        maxProducts: -1, // unlimited
        maxQuotes: -1,   // unlimited
        maxSpecialties: 5,
        maxProjectPhotos: 20,
        hasPriority: true,
        hasAnalytics: true,
        hasApiAccess: false,
      },
      enterprise: {
        plan: 'enterprise',
        maxProducts: -1, // unlimited
        maxQuotes: -1,   // unlimited
        maxSpecialties: -1, // unlimited
        maxProjectPhotos: -1, // unlimited
        hasPriority: true,
        hasAnalytics: true,
        hasApiAccess: true,
      }
    };

    return planLimits[plan as keyof typeof planLimits] || planLimits.basic;
  }

  async getAdminStats(): Promise<{
    totalSuppliers: number;
    pendingApprovals: number;
    totalQuotes: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
  }> {
    const [totalSuppliersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers);

    const [pendingApprovalsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(eq(suppliers.status, 'pending'));

    const [totalQuotesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quoteRequests);

    const [activeSubscriptionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const [monthlyRevenueResult] = await db
      .select({ total: sql<number>`sum(cast(monthly_amount as decimal))` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    return {
      totalSuppliers: Number(totalSuppliersResult?.count) || 0,
      pendingApprovals: Number(pendingApprovalsResult?.count) || 0,
      totalQuotes: Number(totalQuotesResult?.count) || 0,
      activeSubscriptions: Number(activeSubscriptionsResult?.count) || 0,
      monthlyRevenue: Number(monthlyRevenueResult?.total) || 0,
    };
  }

  // Admin actions operations
  async logAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    const [adminAction] = await db
      .insert(adminActions)
      .values(action)
      .returning();
    return adminAction;
  }

  async getAdminActions(filters?: {
    adminId?: string;
    actionType?: string;
    entityType?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminAction[]> {
    let query = db.select().from(adminActions);

    const conditions = [];
    if (filters?.adminId) {
      conditions.push(eq(adminActions.adminId, filters.adminId));
    }
    if (filters?.actionType) {
      conditions.push(eq(adminActions.actionType, filters.actionType));
    }
    if (filters?.entityType) {
      conditions.push(eq(adminActions.entityType, filters.entityType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(adminActions.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return query;
  }

  async getUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAdminUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(inArray(users.role, ['moderator', 'support', 'admin', 'superadmin']))
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: "client" | "supplier" | "moderator" | "support" | "admin" | "superadmin"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Platform configuration operations
  async getPlatformConfig(configKey: string): Promise<PlatformConfig | undefined> {
    const [config] = await db
      .select()
      .from(platformConfig)
      .where(eq(platformConfig.configKey, configKey))
      .limit(1);
    return config;
  }

  async getAllPlatformConfigs(): Promise<PlatformConfig[]> {
    return db
      .select()
      .from(platformConfig)
      .orderBy(platformConfig.configKey);
  }

  async upsertPlatformConfig(config: { 
    configKey: string; 
    configValue: any; 
    description?: string; 
    updatedBy?: string; 
  }): Promise<PlatformConfig> {
    const existing = await this.getPlatformConfig(config.configKey);
    
    if (existing) {
      const [updated] = await db
        .update(platformConfig)
        .set({ 
          configValue: config.configValue, 
          description: config.description,
          updatedBy: config.updatedBy,
          updatedAt: new Date() 
        })
        .where(eq(platformConfig.configKey, config.configKey))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(platformConfig)
        .values({
          configKey: config.configKey,
          configValue: config.configValue,
          description: config.description,
          updatedBy: config.updatedBy,
        })
        .returning();
      return created;
    }
  }

  // Refund operations
  async createRefund(refund: InsertRefund): Promise<Refund> {
    const [newRefund] = await db.insert(refunds).values(refund).returning();
    return newRefund;
  }

  async getRefundsByPaymentId(paymentId: string): Promise<Refund[]> {
    return await db
      .select()
      .from(refunds)
      .where(eq(refunds.paymentId, paymentId))
      .orderBy(desc(refunds.createdAt));
  }

  async getRefund(id: string): Promise<Refund | undefined> {
    const [refund] = await db.select().from(refunds).where(eq(refunds.id, id));
    return refund;
  }

  async getAllRefunds(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ 
    refunds: Array<Refund & { 
      paymentAmount?: number;
      supplierName?: string;
    }>; 
    total: number;
  }> {
    const whereConditions = [];
    
    if (filters?.status && filters.status !== 'all') {
      whereConditions.push(eq(refunds.status, filters.status as any));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereConditions.push(
        sql`(
          ${refunds.id} ILIKE ${searchTerm} OR
          ${refunds.reason} ILIKE ${searchTerm} OR
          ${suppliers.legalName} ILIKE ${searchTerm}
        )`
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(refunds)
      .leftJoin(payments, eq(refunds.paymentId, payments.id))
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .leftJoin(suppliers, eq(subscriptions.supplierId, suppliers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await db
      .select({
        refund: refunds,
        payment: payments,
        supplier: suppliers,
      })
      .from(refunds)
      .leftJoin(payments, eq(refunds.paymentId, payments.id))
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .leftJoin(suppliers, eq(subscriptions.supplierId, suppliers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(refunds.createdAt))
      .limit(filters?.limit || 10)
      .offset(filters?.offset || 0);
    
    const refundsData = results.map(r => ({
      ...r.refund,
      paymentAmount: r.payment ? Number(r.payment.amount) : undefined,
      supplierName: r.supplier?.legalName || undefined,
    }));

    return { refunds: refundsData, total };
  }

  async processRefund(id: string, updates: { 
    status: "approved" | "rejected" | "completed"; 
    processedBy: string; 
    verifoneRefundId?: string; 
  }): Promise<Refund> {
    const [updatedRefund] = await db
      .update(refunds)
      .set({
        status: updates.status,
        processedBy: updates.processedBy,
        verifoneRefundId: updates.verifoneRefundId,
        processedAt: new Date(),
      })
      .where(eq(refunds.id, id))
      .returning();
    return updatedRefund;
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async getInvoicesByPaymentId(paymentId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.paymentId, paymentId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getAllInvoices(filters?: {
    status?: string;
    supplierId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ 
    invoices: Array<Invoice & { 
      supplierName?: string;
    }>; 
    total: number;
  }> {
    const whereConditions = [];
    
    if (filters?.status && filters.status !== 'all') {
      whereConditions.push(eq(invoices.status, filters.status as any));
    }

    if (filters?.supplierId) {
      whereConditions.push(eq(invoices.supplierId, filters.supplierId));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereConditions.push(
        sql`(
          ${invoices.invoiceNumber} ILIKE ${searchTerm} OR
          ${invoices.ncf} ILIKE ${searchTerm} OR
          ${suppliers.legalName} ILIKE ${searchTerm}
        )`
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .leftJoin(suppliers, eq(invoices.supplierId, suppliers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated results
    const results = await db
      .select({
        invoice: invoices,
        supplier: suppliers,
      })
      .from(invoices)
      .leftJoin(suppliers, eq(invoices.supplierId, suppliers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(invoices.createdAt))
      .limit(filters?.limit || 10)
      .offset(filters?.offset || 0);
    
    const invoicesData = results.map(r => ({
      ...r.invoice,
      supplierName: r.supplier?.legalName || undefined,
    }));

    return { invoices: invoicesData, total };
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    
    const result = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(sql`${invoices.invoiceNumber} LIKE ${prefix + '%'}`)
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);

    if (result.length === 0) {
      return `${prefix}00001`;
    }

    const lastNumber = result[0].invoiceNumber;
    const numberPart = parseInt(lastNumber.split('-').pop() || '0');
    const nextNumber = (numberPart + 1).toString().padStart(5, '0');
    return `${prefix}${nextNumber}`;
  }

  async getNextNCF(sequence: string): Promise<string> {
    const result = await db
      .select({ ncf: invoices.ncf })
      .from(invoices)
      .where(
        and(
          sql`${invoices.ncf} IS NOT NULL`,
          eq(invoices.ncfSequence, sequence)
        )
      )
      .orderBy(desc(invoices.ncf))
      .limit(1);

    if (result.length === 0) {
      return `${sequence}00000001`;
    }

    const lastNCF = result[0].ncf || '';
    const numberPart = parseInt(lastNCF.slice(-8));
    const nextNumber = (numberPart + 1).toString().padStart(8, '0');
    return `${sequence}${nextNumber}`;
  }
}

export const storage = new DatabaseStorage();
