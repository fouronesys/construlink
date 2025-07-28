import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  pgEnum,
  uuid,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // Hashed password
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["client", "supplier", "admin", "superadmin"] }).default("client"),
  emailVerified: boolean("email_verified").default(false),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  verifoneCustomerId: varchar("verifone_customer_id"),
  verifoneSubscriptionId: varchar("verifone_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier status enum
export const supplierStatusEnum = pgEnum("supplier_status", ["pending", "approved", "suspended", "rejected"]);

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  rnc: varchar("rnc", { length: 50 }).unique().notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: supplierStatusEnum("status").default("pending"),
  approvalDate: timestamp("approval_date"),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier specialties
export const supplierSpecialties = pgTable("supplier_specialties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  specialty: varchar("specialty", { length: 100 }).notNull(),
});

// Supplier documents
export const supplierDocuments = pgTable("supplier_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  docType: varchar("doc_type", { enum: ["rnc", "license", "certificate"] }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  expiryDate: date("expiry_date"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  plan: varchar("plan", { enum: ["basic", "professional", "enterprise"] }).default("basic"),
  status: varchar("status", { enum: ["active", "inactive", "cancelled", "trialing"] }).default("inactive"),
  verifoneSubscriptionId: varchar("verifone_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialEndDate: timestamp("trial_end_date"),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).default("1000.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("DOP"),
  status: varchar("status", { enum: ["pending", "completed", "failed"] }).default("pending"),
  verifoneTransactionId: varchar("verifone_transaction_id"),
  paymentDate: timestamp("payment_date").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plan usage tracking 
export const planUsage = pgTable("plan_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  productsCount: decimal("products_count", { precision: 10, scale: 0 }).default("0"),
  quotesReceived: decimal("quotes_received", { precision: 10, scale: 0 }).default("0"),
  specialtiesCount: decimal("specialties_count", { precision: 10, scale: 0 }).default("0"),
  projectPhotos: decimal("project_photos", { precision: 10, scale: 0 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services
export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote requests
export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  clientPhone: varchar("client_phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  projectType: varchar("project_type", { length: 100 }),
  description: text("description").notNull(),
  budget: varchar("budget", { length: 50 }),
  estimatedStartDate: date("estimated_start_date"),
  status: varchar("status", { enum: ["pending", "responded", "closed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Verifications (admin actions)
export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  decision: varchar("decision", { enum: ["approved", "rejected"] }).notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  user: one(users, {
    fields: [suppliers.userId],
    references: [users.id],
  }),
  specialties: many(supplierSpecialties),
  documents: many(supplierDocuments),
  subscriptions: many(subscriptions),
  products: many(products),
  services: many(services),
  quoteRequests: many(quoteRequests),
  verifications: many(verifications),
  reviews: many(reviews),
  planUsage: many(planUsage),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [subscriptions.supplierId],
    references: [suppliers.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [services.supplierId],
    references: [suppliers.id],
  }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [quoteRequests.supplierId],
    references: [suppliers.id],
  }),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [verifications.supplierId],
    references: [suppliers.id],
  }),
  admin: one(users, {
    fields: [verifications.adminId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [reviews.supplierId],
    references: [suppliers.id],
  }),
}));

export const planUsageRelations = relations(planUsage, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [planUsage.supplierId],
    references: [suppliers.id],
  }),
}));

// Insert schemas for forms
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  emailVerified: true,
  isActive: true,
  lastLoginAt: true,
  verifoneCustomerId: true,
  verifoneSubscriptionId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  userId: true,
  status: true,
  approvalDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSpecialtySchema = createInsertSchema(supplierSpecialties).omit({
  id: true,
});

export const insertSupplierDocumentSchema = createInsertSchema(supplierDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  paymentDate: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertPlanUsageSchema = createInsertSchema(planUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  role: z.enum(["client", "supplier"]).default("client"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

// Types
export type User = typeof users.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type SupplierSpecialty = typeof supplierSpecialties.$inferSelect;
export type SupplierDocument = typeof supplierDocuments.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Service = typeof services.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type PlanUsage = typeof planUsage.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = Partial<InsertUser> & { id?: string; email: string; firstName: string; lastName: string; };
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertSupplierSpecialty = z.infer<typeof insertSupplierSpecialtySchema>;
export type InsertSupplierDocument = z.infer<typeof insertSupplierDocumentSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertPlanUsage = z.infer<typeof insertPlanUsageSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;


