import {
  users,
  suppliers,
  supplierSpecialties,
  subscriptions,
  payments,
  products,
  services,
  quoteRequests,
  verifications,
  reviews,
  supplierDocuments,
  supplierBanners,
  planUsage,
  adminActions,
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
  type SupplierDocument,
  type InsertSupplierDocument,
  type PlanUsage,
  type InsertPlanUsage,
  type AdminAction,
  type InsertAdminAction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, ilike, sql, inArray } from "drizzle-orm";

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
  getSubscriptionBySupplierId(supplierId: string): Promise<Subscription | undefined>;
  getSubscriptionByVerifoneId(verifoneId: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsBySubscriptionId(subscriptionId: string): Promise<Payment[]>;
  getAllPayments(filters?: {
    status?: string;
    supplierId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Array<Payment & { 
    subscription?: Subscription; 
    supplier?: { id: string; legalName: string; plan: string; }; 
  }>>;
  getPaymentStats(): Promise<{
    totalPayments: number;
    completedPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalRevenue: number;
    monthlyRevenue: number;
    recentPayments: Array<Payment & { supplierName: string; plan: string; }>;
  }>;
  
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
  getReviewsBySupplierId(supplierId: string): Promise<Review[]>;
  
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
  getAdminUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: "client" | "supplier" | "admin" | "superadmin"): Promise<User>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User>;
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
    let query = db.select().from(suppliers);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(suppliers.status, filters.status as any));
    }
    
    if (filters?.location) {
      conditions.push(ilike(suppliers.location, `%${filters.location}%`));
    }
    
    if (filters?.search) {
      conditions.push(ilike(suppliers.legalName, `%${filters.search}%`));
    }
    
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
    limit?: number;
    offset?: number;
  }): Promise<Array<Payment & { 
    subscription?: Subscription; 
    supplier?: { id: string; legalName: string; plan: string; }; 
  }>> {
    const whereConditions = [];
    
    if (filters?.status) {
      whereConditions.push(eq(payments.status, filters.status as any));
    }

    if (filters?.supplierId) {
      whereConditions.push(eq(suppliers.id, filters.supplierId));
    }

    const results = await db
      .select({
        payment: payments,
        subscription: subscriptions,
        supplier: suppliers,
      })
      .from(payments)
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .leftJoin(suppliers, eq(subscriptions.supplierId, suppliers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(payments.paymentDate))
      .limit(filters?.limit || 100)
      .offset(filters?.offset || 0);
    
    return results.map(r => ({
      ...r.payment,
      subscription: r.subscription || undefined,
      supplier: r.supplier ? {
        id: r.supplier.id,
        legalName: r.supplier.legalName,
        plan: r.subscription?.plan || 'N/A',
      } : undefined,
    }));
  }

  async getPaymentStats(): Promise<{
    totalPayments: number;
    completedPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalRevenue: number;
    monthlyRevenue: number;
    recentPayments: Array<Payment & { supplierName: string; plan: string; }>;
  }> {
    const allPayments = await db
      .select({
        payment: payments,
        subscription: subscriptions,
        supplier: suppliers,
      })
      .from(payments)
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .leftJoin(suppliers, eq(subscriptions.supplierId, suppliers.id))
      .orderBy(desc(payments.paymentDate));

    const totalPayments = allPayments.length;
    const completedPayments = allPayments.filter(p => p.payment.status === 'completed').length;
    const failedPayments = allPayments.filter(p => p.payment.status === 'failed').length;
    const pendingPayments = allPayments.filter(p => p.payment.status === 'pending').length;

    const totalRevenue = allPayments
      .filter(p => p.payment.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.payment.amount || '0'), 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = allPayments
      .filter(p => 
        p.payment.status === 'completed' && 
        p.payment.paymentDate && 
        p.payment.paymentDate.toISOString().slice(0, 7) === currentMonth
      )
      .reduce((sum, p) => sum + parseFloat(p.payment.amount || '0'), 0);

    const recentPayments = allPayments
      .slice(0, 10)
      .map(r => ({
        ...r.payment,
        supplierName: r.supplier?.legalName || 'N/A',
        plan: r.subscription?.plan || 'N/A',
      }));

    return {
      totalPayments,
      completedPayments,
      failedPayments,
      pendingPayments,
      totalRevenue,
      monthlyRevenue,
      recentPayments,
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
    return newReview;
  }

  async getReviewsBySupplierId(supplierId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.supplierId, supplierId))
      .orderBy(desc(reviews.createdAt));
  }

  // Additional subscription operations
  async getSubscription(id: string): Promise<Subscription | null> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);
    return subscription || null;
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

    const [activeSubscriptionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const [monthlyRevenueResult] = await db
      .select({ total: sql<number>`sum(cast(monthly_amount as decimal))` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    return {
      totalSuppliers: totalSuppliersResult?.count || 0,
      pendingApprovals: pendingApprovalsResult?.count || 0,
      activeSubscriptions: activeSubscriptionsResult?.count || 0,
      monthlyRevenue: monthlyRevenueResult?.total || 0,
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

  async getAdminUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(inArray(users.role, ['admin', 'superadmin']))
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: "client" | "supplier" | "admin" | "superadmin"): Promise<User> {
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
}

export const storage = new DatabaseStorage();
