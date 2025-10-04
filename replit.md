# Verified Construction Suppliers Platform

## Overview
This is a B2B directory platform for verified construction material and service suppliers in the Dominican Republic. The system features RNC validation through DGII, monthly subscription management via Verifone, and administrative approval workflows. Built with React/TypeScript frontend, Express backend, and PostgreSQL with Drizzle ORM.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Shadcn/UI with Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit OpenID Connect with session-based auth
- **Payment Processing**: Verifone for subscription management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle with schema migrations
- **Connection**: Connection pooling with @neondatabase/serverless
- **Schema Location**: Shared schema definition in `/shared/schema.ts`

## Key Components

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL
- **Role-Based Access**: Four roles (client, supplier, admin, superadmin)
- **Authorization Middleware**: Custom middleware for route protection

### Supplier Management
- **Registration Flow**: Unified registration page with role selection (client/supplier)
- **Subscription Plans**: Three tiers with specific limitations and pricing
  - Basic Plan (RD$1,000/month): 10 products, 5 quotes/month, 1 specialty
  - Professional Plan (RD$2,500/month): Unlimited products/quotes, 5 specialties, 20 project photos
  - Enterprise Plan (RD$5,000/month): Everything unlimited plus API access and advanced analytics
- **Plan Validation**: Real-time checking of usage against plan limits
- **Verification System**: Admin approval workflow with document review
- **Status Management**: Pending, approved, suspended, rejected states
- **Subscription Integration**: Verifone recurring billing with tiered pricing

### Payment System
- **Provider**: Verifone with webhook integration
- **Subscription Model**: Monthly recurring payments
- **Trial Period**: 7-day trial period
- **Currency**: Dominican Peso (DOP) at RD$1000

### External Integrations
- **RNC Validation**: DGII validation via fouronerncvalidator.onrender.com
- **Payment Gateway**: Verifone for payment processing
- **Email Notifications**: Automated status updates for suppliers

## Data Flow

### Supplier Registration
1. User selects "Supplier" role during unified registration
2. After login, suppliers are directed to subscription selection
3. Supplier completes plan selection and payment via Verifone
4. System creates supplier profile with subscription
5. Administrative review queue populated for approval
6. Admin approval/rejection with email notifications
7. Approved suppliers appear in public directory with plan-based limitations enforced

### Quote Request Process
1. Clients browse verified supplier directory
2. Filter by specialty, location, and ratings
3. Submit quote requests through contact forms
4. Suppliers receive notifications in dashboard
5. Direct communication facilitated between parties

### Subscription Management
1. Monthly billing cycle through Verifone
2. Automatic suspension for failed payments
3. Renewal notifications and grace periods
4. Admin override capabilities for special cases

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection
- **verifone**: Payment processing
- **drizzle-orm**: Database ORM
- **express**: Web server framework
- **@tanstack/react-query**: Server state management

### UI Dependencies
- **@radix-ui/react-***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form handling
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite dev server with HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL, STRIPE keys, session secrets

### Production Build
- **Frontend**: Vite production build to `/dist/public`
- **Backend**: ESBuild compilation to `/dist/index.js`
- **Static Assets**: Served by Express in production mode
- **Database**: Drizzle migrations via `npm run db:push`

### Environment Configuration
- **NODE_ENV**: Controls development vs production behavior
- **DATABASE_URL**: PostgreSQL connection string
- **VERIFONE_API_KEY**: Server-side Verifone integration
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Authentication domain configuration

### Hosting Considerations
- Platform designed for Replit deployment
- Uses Replit-specific authentication and banner integration
- WebSocket support required for database connections
- Static file serving handled by Express middleware

### CapRover Deployment
- **Dockerfile**: Multi-stage build with Node 20 Alpine
- **Static Assets**: Public directory (including banner uploads) copied to production container
- **Persistent Storage**: Banner uploads stored in `/app/public/uploads/banners`
- **Port Configuration**: Application runs on port 80 in production
- **Image Management**: Banner images copied from builder stage to ensure availability in production

## Recent Changes

### October 4, 2025 - CapRover Deployment Fix
- ✓ Fixed banner images not displaying in CapRover deployment
- ✓ Updated Dockerfile to copy public directory from builder stage
- ✓ Ensured static assets (banner uploads) are available in production container
- ✓ Documented CapRover deployment configuration in project documentation

### October 3, 2025 - Payment and Billing Management (Sprint 4 Complete)
- ✓ Verified complete backend implementation for payments, refunds, and invoices
- ✓ Dashboard with payment statistics (total revenue, successful/failed payments, average amount)
- ✓ Revenue charts by subscription plan (Basic, Professional, Enterprise)
- ✓ Advanced filtering system (search, status, plan, pagination)
- ✓ Refund management with approve/reject workflow
- ✓ Invoice generation with NCF (fiscal receipt numbers for Dominican Republic)
- ✓ Automatic ITBIS calculation (18% tax for DR)
- ✓ CSV export functionality for payments and invoices
- ✓ Complete integration with Verifone payment gateway
- ✓ Sequential invoice numbering (INV-YYYY-#####)
- ✓ Sequential NCF generation for fiscal compliance
- ✓ Fixed LSP error in admin-panel.tsx
- ✓ All features with full data-testid coverage for QA

### October 2, 2025 - Admin User Management and Audit Logs (Sprint 3 Partial)
- ✓ Implemented admin user management system (superadmin only)
- ✓ Added role management with 4 roles (client, supplier, admin, superadmin)
- ✓ Created user status management (activate/deactivate accounts)
- ✓ Implemented comprehensive admin action logging system
- ✓ Added audit trail with before/after state tracking
- ✓ Created Zod validation schemas for all admin endpoints
- ✓ Built log viewer with filtering (by action type, entity type, search)
- ✓ Added protection against self-modification for admins
- ✓ All features with full data-testid coverage for QA

### October 2, 2025 - Analytics Dashboard Implementation (Sprint 2 Complete)
- ✓ Implemented comprehensive Analytics dashboard in admin panel
- ✓ Added banner tracking statistics (clicks, impressions, CTR)
- ✓ Created visual charts using Recharts library for data visualization
- ✓ Implemented CSV export functionality for banner statistics
- ✓ Added detailed table view with per-banner performance metrics
- ✓ Integrated empty state handling for when no analytics data exists
- ✓ All analytics features fully responsive and mobile-optimized

### January 28, 2025 - Core Platform Implementation
- ✓ Fixed database connection and schema setup
- ✓ Completed backend API routes for all user roles
- ✓ Implemented supplier dashboard with plan usage tracking
- ✓ Added admin panel with approval workflow
- ✓ Created payment system with Verifone integration
- ✓ Built comprehensive directory with search and filtering
- ✓ Added subscription plan management system
- ✓ Implemented role-based access control
- ✓ Server running successfully on port 5000
- ✓ All core business logic and workflows operational
- ✓ Transformed main page to focus on product/service showcase
- ✓ Created separate pricing page (/pricing)
- ✓ Fixed all /register-supplier references to /register
- ✓ Enhanced RNC validation with proper API token authentication
- ✓ Added URL parameter parsing for category-based directory access
- ✓ Optimized navigation with authentication moved to dropdown
- ✓ Enhanced plan limit validation with proper error handling for suppliers reaching their plan limits
- ✓ Implemented comprehensive plan usage tracking system with monthly counters for all plan features
- ✓ Created PlanUsageWidget component showing real-time usage statistics with progress bars and plan-specific messaging
- ✓ Added admin subscription management functions to suspend/reactivate supplier accounts
- ✓ Implemented proper error messages for plan limit violations across all supplier actions
- ✓ Made entire interface fully responsive for mobile phones and tablets
- ✓ Fixed payment dialog positioning issues on mobile devices
- ✓ Optimized form layouts with responsive grids and mobile-first approach
- ✓ Added mobile-specific CSS classes for proper dialog centering
- ✓ Confirmed payment processing works correctly on all device sizes

## Current Status
The application is fully functional with a comprehensive admin panel featuring:
- **Sprint 1**: Complete banner management system for featured suppliers
- **Sprint 2**: Analytics dashboard with tracking, charts, and CSV export
- **Sprint 3**: Admin user management and audit logging
  - Role management for users (client, supplier, admin, superadmin)
  - User activation/deactivation controls
  - Comprehensive action logging with before/after state tracking
  - Log viewer with advanced filtering capabilities
  - All features restricted to superadmin access
- **Sprint 4**: Payment and billing management (COMPLETE)
  - Payment dashboard with statistics and revenue charts
  - Refund management with approval workflow
  - Invoice generation with NCF for Dominican Republic fiscal compliance
  - Automatic ITBIS (18%) calculation
  - CSV export for payments and invoices
  - Complete Verifone integration

The platform includes a product-focused main page, pricing section, proper RNC validation, and category-based directory filtering. All interfaces are fully responsive for mobile phones and tablets. Payment processing with Verifone is working correctly across all device sizes. The admin panel now has complete payment and billing management capabilities including fiscal compliance for the Dominican Republic.