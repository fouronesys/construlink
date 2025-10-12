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
  integer,
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
  role: varchar("role", { enum: ["client", "supplier", "moderator", "support", "admin", "superadmin"] }).default("client"),
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

// Banner device type enum
export const deviceTypeEnum = pgEnum("device_type", ["desktop", "tablet", "mobile"]);

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
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
  bannerImageUrl: varchar("banner_image_url"),
  isFeatured: boolean("is_featured").default(false),
  featuredSince: timestamp("featured_since"),
  isClaimed: boolean("is_claimed").default(true),
  claimedAt: timestamp("claimed_at"),
  addedByAdmin: boolean("added_by_admin").default(false),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default(sql`0`),
  totalReviews: integer("total_reviews").default(0),
  searchEmbedding: jsonb("search_embedding"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier claim requests
export const supplierClaims = pgTable("supplier_claims", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  rnc: varchar("rnc", { length: 50 }).notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  message: text("message"),
  documentUrls: text("document_urls").array(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Supplier banners
export const supplierBanners = pgTable("supplier_banners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  deviceType: deviceTypeEnum("device_type").notNull(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  description: text("description"),
  linkUrl: text("link_url"),
  displayOrder: decimal("display_order", { precision: 10, scale: 0 }).default("0"),
  isActive: boolean("is_active").default(true),
  clickCount: decimal("click_count", { precision: 10, scale: 0 }).default("0"),
  impressionCount: decimal("impression_count", { precision: 10, scale: 0 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment gateway enum
export const paymentGatewayEnum = pgEnum("payment_gateway", ["azul", "verifone", "manual"]);

// Billing cycle enum
export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "annual"]);

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  plan: varchar("plan", { enum: ["basic", "professional", "enterprise"] }).default("basic"),
  status: varchar("status", { enum: ["active", "inactive", "cancelled", "trialing"] }).default("inactive"),
  paymentGateway: paymentGatewayEnum("payment_gateway"), // Sin default, será explícito
  gatewaySubscriptionId: varchar("gateway_subscription_id"), // ID genérico del gateway
  verifoneSubscriptionId: varchar("verifone_subscription_id"), // Mantener por compatibilidad
  billingCycle: billingCycleEnum("billing_cycle").default("monthly"), // Ciclo de facturación
  trialDays: integer("trial_days").default(7), // Días de prueba configurables por plan
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
  gatewayName: paymentGatewayEnum("gateway_name"), // Sin default, será explícito
  gatewayTransactionId: varchar("gateway_transaction_id"), // ID de transacción del gateway
  gatewayAuthCode: varchar("gateway_auth_code"), // Código de autorización
  gatewayResponseCode: varchar("gateway_response_code"), // Código de respuesta
  gatewayMetadata: jsonb("gateway_metadata"), // Datos adicionales del gateway
  verifoneTransactionId: varchar("verifone_transaction_id"), // Mantener por compatibilidad
  paymentDate: timestamp("payment_date").defaultNow(),
});

// Refunds (Reembolsos)
export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "completed"] }).default("pending"),
  processedBy: varchar("processed_by").references(() => users.id),
  gatewayRefundId: varchar("gateway_refund_id"), // ID de reembolso del gateway
  verifoneRefundId: varchar("verifone_refund_id"), // Mantener por compatibilidad
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Invoices (Facturas)
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "cascade" }).notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).unique().notNull(),
  ncf: varchar("ncf", { length: 19 }), // NCF format: B0100000001 (11 chars) or E310000000001 (13 chars)
  ncfSequence: varchar("ncf_sequence", { length: 20 }), // Serie autorizada por DGII
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  itbis: decimal("itbis", { precision: 10, scale: 2 }).default("0"), // 18% tax in DR
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("DOP"),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  status: varchar("status", { enum: ["draft", "sent", "paid", "cancelled"] }).default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
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
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Review responses (supplier replies to reviews)
export const reviewResponses = pgTable("review_responses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "cascade" }).notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  responseText: text("response_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Review reports (for inappropriate reviews)
export const reviewReports = pgTable("review_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "cascade" }).notNull(),
  reportedBy: varchar("reported_by").references(() => users.id, { onDelete: "set null" }),
  reporterEmail: varchar("reporter_email", { length: 255 }),
  reason: varchar("reason", { enum: ["spam", "inappropriate", "offensive", "fake", "other"] }).notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["pending", "reviewed", "resolved", "dismissed"] }).default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Admin actions log
export const adminActions = pgTable("admin_actions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  actionType: varchar("action_type", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform configuration
export const platformConfig = pgTable("platform_config", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: varchar("config_key", { length: 100 }).unique().notNull(),
  configValue: jsonb("config_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Payment Gateway Configuration
export const paymentGatewayConfig = pgTable("payment_gateway_config", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  gatewayName: paymentGatewayEnum("gateway_name").notNull().unique(),
  isEnabled: boolean("is_enabled").default(true),
  isSandbox: boolean("is_sandbox").default(true),
  merchantId: varchar("merchant_id", { length: 100 }),
  merchantName: varchar("merchant_name", { length: 255 }),
  authToken: varchar("auth_token", { length: 500 }),
  secretKey: varchar("secret_key", { length: 500 }),
  baseUrl: varchar("base_url", { length: 500 }),
  callbackUrls: jsonb("callback_urls"), // { approved, declined, cancel }
  additionalConfig: jsonb("additional_config"), // Configuración adicional específica del gateway
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// NCF Series status enum
export const ncfStatusEnum = pgEnum("ncf_status", ["active", "depleted", "expired"]);

// NCF Series type enum (tipos de comprobante fiscal en RD)
export const ncfTypeEnum = pgEnum("ncf_type", [
  "B01", // Crédito Fiscal
  "B02", // Consumidor Final
  "B14", // Regímenes Especiales
  "B15", // Gubernamental
  "B16", // Exportaciones
  "E31", // Factura Electrónica (e-NCF)
]);

// NCF Series (Número de Comprobante Fiscal - Dominican Republic)
export const ncfSeries = pgTable("ncf_series", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  seriesType: ncfTypeEnum("series_type").notNull(), // Tipo de comprobante
  prefix: varchar("prefix", { length: 3 }).notNull(), // B01, B02, E31, etc.
  currentSequence: integer("current_sequence").notNull().default(0), // Secuencia actual
  startSequence: integer("start_sequence").notNull(), // Inicio de secuencia autorizada
  endSequence: integer("end_sequence").notNull(), // Fin de secuencia autorizada
  status: ncfStatusEnum("status").default("active"),
  authorizedBy: varchar("authorized_by", { length: 255 }).default("DGII"), // Entidad que autorizó
  authorizedDate: timestamp("authorized_date"),
  expiryDate: timestamp("expiry_date"), // Fecha de vencimiento de la serie
  lowStockThreshold: integer("low_stock_threshold").default(100), // Alertar cuando queden X disponibles
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier publications (posts/updates from suppliers)
export const supplierPublications = pgTable("supplier_publications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  category: varchar("category", { length: 100 }),
  isActive: boolean("is_active").default(true),
  viewCount: decimal("view_count", { precision: 10, scale: 0 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Paid advertisements
export const paidAdvertisements = pgTable("paid_advertisements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  linkUrl: varchar("link_url", { length: 500 }),
  displayLocation: varchar("display_location", { enum: ["sidebar", "header", "footer", "content"] }).default("content"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  clickCount: decimal("click_count", { precision: 10, scale: 0 }).default("0"),
  impressionCount: decimal("impression_count", { precision: 10, scale: 0 }).default("0"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  costPerClick: decimal("cost_per_click", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advertisement requests (suppliers request to promote their publications)
export const advertisementRequests = pgTable("advertisement_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }).notNull(),
  publicationId: uuid("publication_id").references(() => supplierPublications.id, { onDelete: "cascade" }).notNull(),
  requestedDuration: integer("requested_duration").notNull(), // days
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  advertisementId: uuid("advertisement_id").references(() => paidAdvertisements.id), // Link to created ad if approved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  user: one(users, {
    fields: [suppliers.userId],
    references: [users.id],
  }),
  claims: many(supplierClaims),
  specialties: many(supplierSpecialties),
  documents: many(supplierDocuments),
  banners: many(supplierBanners),
  subscriptions: many(subscriptions),
  products: many(products),
  services: many(services),
  quoteRequests: many(quoteRequests),
  verifications: many(verifications),
  reviews: many(reviews),
  planUsage: many(planUsage),
  invoices: many(invoices),
  publications: many(supplierPublications),
  advertisements: many(paidAdvertisements),
}));

export const supplierClaimsRelations = relations(supplierClaims, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierClaims.supplierId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [supplierClaims.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [supplierClaims.reviewedBy],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [subscriptions.supplierId],
    references: [suppliers.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  refunds: many(refunds),
  invoices: many(invoices),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  payment: one(payments, {
    fields: [refunds.paymentId],
    references: [payments.id],
  }),
  processor: one(users, {
    fields: [refunds.processedBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  payment: one(payments, {
    fields: [invoices.paymentId],
    references: [payments.id],
  }),
  supplier: one(suppliers, {
    fields: [invoices.supplierId],
    references: [suppliers.id],
  }),
}));

export const ncfSeriesRelations = relations(ncfSeries, ({ many }) => ({
  invoices: many(invoices),
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

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [reviews.supplierId],
    references: [suppliers.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  response: one(reviewResponses, {
    fields: [reviews.id],
    references: [reviewResponses.reviewId],
  }),
  reports: many(reviewReports),
}));

export const reviewResponsesRelations = relations(reviewResponses, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewResponses.reviewId],
    references: [reviews.id],
  }),
  supplier: one(suppliers, {
    fields: [reviewResponses.supplierId],
    references: [suppliers.id],
  }),
}));

export const reviewReportsRelations = relations(reviewReports, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewReports.reviewId],
    references: [reviews.id],
  }),
  reporter: one(users, {
    fields: [reviewReports.reportedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [reviewReports.reviewedBy],
    references: [users.id],
  }),
}));

export const planUsageRelations = relations(planUsage, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [planUsage.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierBannersRelations = relations(supplierBanners, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierBanners.supplierId],
    references: [suppliers.id],
  }),
}));

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  admin: one(users, {
    fields: [adminActions.adminId],
    references: [users.id],
  }),
}));

export const platformConfigRelations = relations(platformConfig, ({ one }) => ({
  updater: one(users, {
    fields: [platformConfig.updatedBy],
    references: [users.id],
  }),
}));

export const supplierPublicationsRelations = relations(supplierPublications, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierPublications.supplierId],
    references: [suppliers.id],
  }),
}));

export const paidAdvertisementsRelations = relations(paidAdvertisements, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [paidAdvertisements.supplierId],
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

export const insertSupplierBannerSchema = createInsertSchema(supplierBanners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertRefundSchema = createInsertSchema(refunds).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
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

export const insertReviewResponseSchema = createInsertSchema(reviewResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewReportSchema = createInsertSchema(reviewReports).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertPlanUsageSchema = createInsertSchema(planUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformConfigSchema = createInsertSchema(platformConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertPaymentGatewayConfigSchema = createInsertSchema(paymentGatewayConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierClaimSchema = createInsertSchema(supplierClaims).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  reviewedAt: true,
  createdAt: true,
});

export const insertSupplierPublicationSchema = createInsertSchema(supplierPublications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaidAdvertisementSchema = createInsertSchema(paidAdvertisements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdvertisementRequestSchema = createInsertSchema(advertisementRequests).omit({
  id: true,
  status: true,
  adminNotes: true,
  reviewedBy: true,
  reviewedAt: true,
  advertisementId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNcfSeriesSchema = createInsertSchema(ncfSeries).omit({
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
  // Supplier-specific fields (conditional)
  rnc: z.string().optional(),
  legalName: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "supplier") {
    return data.rnc && data.legalName && data.phone && data.location;
  }
  return true;
}, {
  message: "Todos los campos de empresa son requeridos para proveedores",
  path: ["role"],
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

// Admin schemas
export const logAdminActionSchema = z.object({
  actionType: z.string().min(1, "Action type is required"),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["client", "supplier", "moderator", "support", "admin", "superadmin"]),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserEmailSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const updateUserPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const updatePlatformConfigSchema = z.object({
  configValue: z.any(),
  description: z.string().optional(),
});

// Refund and Invoice schemas
export const createRefundSchema = z.object({
  paymentId: z.string().uuid("Payment ID must be a valid UUID"),
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

export const processRefundSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  verifoneRefundId: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  paymentId: z.string().uuid("Payment ID must be a valid UUID"),
  supplierId: z.string().uuid("Supplier ID must be a valid UUID"),
  ncfSequence: z.string().optional(),
  notes: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type SupplierClaim = typeof supplierClaims.$inferSelect;
export type SupplierSpecialty = typeof supplierSpecialties.$inferSelect;
export type SupplierDocument = typeof supplierDocuments.$inferSelect;
export type SupplierBanner = typeof supplierBanners.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Refund = typeof refunds.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Service = typeof services.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ReviewResponse = typeof reviewResponses.$inferSelect;
export type ReviewReport = typeof reviewReports.$inferSelect;
export type PlanUsage = typeof planUsage.$inferSelect;
export type AdminAction = typeof adminActions.$inferSelect;
export type PlatformConfig = typeof platformConfig.$inferSelect;
export type PaymentGatewayConfig = typeof paymentGatewayConfig.$inferSelect;
export type SupplierPublication = typeof supplierPublications.$inferSelect;
export type PaidAdvertisement = typeof paidAdvertisements.$inferSelect;
export type AdvertisementRequest = typeof advertisementRequests.$inferSelect;
export type NcfSeries = typeof ncfSeries.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = Partial<InsertUser> & { id?: string; email: string; firstName: string; lastName: string; };
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertSupplierClaim = z.infer<typeof insertSupplierClaimSchema>;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertSupplierSpecialty = z.infer<typeof insertSupplierSpecialtySchema>;
export type InsertSupplierDocument = z.infer<typeof insertSupplierDocumentSchema>;
export type InsertSupplierBanner = z.infer<typeof insertSupplierBannerSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertReviewResponse = z.infer<typeof insertReviewResponseSchema>;
export type InsertReviewReport = z.infer<typeof insertReviewReportSchema>;
export type InsertPlanUsage = z.infer<typeof insertPlanUsageSchema>;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type InsertPlatformConfig = z.infer<typeof insertPlatformConfigSchema>;
export type InsertPaymentGatewayConfig = z.infer<typeof insertPaymentGatewayConfigSchema>;
export type InsertSupplierPublication = z.infer<typeof insertSupplierPublicationSchema>;
export type InsertPaidAdvertisement = z.infer<typeof insertPaidAdvertisementSchema>;
export type InsertAdvertisementRequest = z.infer<typeof insertAdvertisementRequestSchema>;
export type InsertNcfSeries = z.infer<typeof insertNcfSeriesSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;


