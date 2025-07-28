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
  type User,
  type UpsertUser,
  type Supplier,
  type InsertSupplier,
  type SupplierSpecialty,
  type InsertSupplierSpecialty,
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
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionBySupplierId(supplierId: string): Promise<Subscription | undefined>;
  getSubscriptionByVerifoneId(verifoneId: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsBySubscriptionId(subscriptionId: string): Promise<Payment[]>;
  
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
        .values(userData)
        .returning();
      return user;
    }
  }

  // Supplier operations
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const supplierData = {
      ...supplier,
      userId: supplier.userId || '',
      email: supplier.email || '',
    };
    const [newSupplier] = await db.insert(suppliers).values(supplierData).returning();
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

  async getAdminStats(): Promise<{
    totalSuppliers: number;
    pendingApprovals: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
  }> {
    const [suppliersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers);

    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(eq(suppliers.status, "pending"));

    const [subscriptionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    const [revenueResult] = await db
      .select({ total: sql<number>`sum(amount)` })
      .from(payments)
      .where(eq(payments.status, "completed"));

    return {
      totalSuppliers: suppliersResult?.count || 0,
      pendingApprovals: pendingResult?.count || 0,
      activeSubscriptions: subscriptionsResult?.count || 0,
      monthlyRevenue: revenueResult?.total || 0,
    };
  }
}

export const storage = new DatabaseStorage();
